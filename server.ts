import express, { Request, Response } from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, Modality } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/api/live' });

app.use(express.json({ limit: '50mb' }));

// Server-side Gemini client initialization with mandatory aistudio-build user-agent
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in environment secrets.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// 1. Audio Transcription using gemini-3.5-transcribe
app.post('/api/ai/transcribe', async (req: Request, res: Response): Promise<void> => {
  try {
    const { audioData, mimeType = 'audio/webm' } = req.body;
    if (!audioData) {
      res.status(400).json({ error: 'Missing audioData in request body.' });
      return;
    }

    const ai = getGeminiClient();
    const audioPart = {
      inlineData: {
        mimeType,
        data: audioData,
      },
    };

    const promptText =
      'Transcribe this spoken audio accurately. Format the speech into clean teleprompter script lines. ' +
      'Keep lines relatively short (5 to 10 words per line) so they are easy to read right below a camera lens. ' +
      'Include Markdown headers (# or ##) for natural section transitions and insert [PAUSE 1.5s] cues where the speaker naturally paused.';

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-transcribe',
      contents: {
        parts: [audioPart, { text: promptText }],
      },
    });

    const transcript = response.text || '';
    res.json({ transcript });
  } catch (error: any) {
    console.error('Transcription error:', error);
    res.status(500).json({
      error: error?.message || 'Failed to transcribe audio with gemini-3.5-transcribe',
    });
  }
});

// 2. Multi-turn AI Script Doctor / Speech Coach Chatbot
app.post('/api/ai/chat', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      messages,
      model = 'gemini-3.8-flash',
      currentScript = '',
    } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'Invalid or missing messages array.' });
      return;
    }

    // Supported models according to spec: gemini-4-argon (complex), gemini-3.8-flash (general), gemini-3.1-flash-lite (fast)
    const validModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-4-argon'];
    const chosenModel = validModels.includes(model) ? model : 'gemini-3.8-flash';

    const ai = getGeminiClient();

    const systemInstruction =
      'You are LensCue AI Script Doctor & Presentation Coach. ' +
      'Your mission is to help presenters, executives, creators, and speakers refine, rewrite, and rehearse their scripts for on-camera teleprompter delivery.\n\n' +
      'Key guidelines for camera teleprompter scripts:\n' +
      '1. Line length: Keep lines around 5 to 9 words per line. Wide lines force eye-tracking from left to right, whereas narrow lines keep the speaker\'s eyes locked directly onto the webcam lens.\n' +
      '2. Conversational tone: Eliminate jargon, bureaucratic phrasing, and complex nested clauses. Speak as if talking to one respected colleague across a coffee table.\n' +
      '3. Pacing & Cues: Add actionable stage directions in square brackets: [SMILE], [PAUSE 1.5s], [LOOK AT LENS], [LEAN IN], [B-ROLL CUE].\n' +
      '4. Active Script Context: When the user asks you to rewrite or tweak, provide the improved script ready to copy or insert directly into LensCue.\n' +
      (currentScript ? `\n--- CURRENT SCRIPT IN USER'S PROMPTER ---\n${currentScript}\n--------------------------------------\n` : '');

    // Format chat history
    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const response = await ai.models.generateContent({
      model: chosenModel,
      contents,
      config: {
        systemInstruction,
      },
    });

    const reply = response.text || '';
    res.json({ reply, modelUsed: chosenModel });
  } catch (error: any) {
    console.error('Chatbot error:', error);
    res.status(500).json({
      error: error?.message || 'Failed to generate chat response',
    });
  }
});

// 3. Quick Script Refinement Engine (Preset Tools)
app.post('/api/ai/refine-script', async (req: Request, res: Response): Promise<void> => {
  try {
    const { script, mode = 'conversational' } = req.body;
    if (!script) {
      res.status(400).json({ error: 'Missing script in request body.' });
      return;
    }

    const ai = getGeminiClient();

    const modePrompts: Record<string, string> = {
      conversational:
        'Rewrite this script to sound warm, natural, and conversational for video. Break it into short, punchy teleprompter lines (5-8 words per line). Remove stiff corporate jargon.',
      cues:
        'Analyze this script and insert natural rhetorical stage cues in brackets such as [SMILE], [PAUSE 1.5s], [PAUSE 2s], [LOOK DIRECTLY AT LENS], and [LEAN IN SLIGHTLY]. Keep all original speech intact.',
      sixty_sec:
        'Condense and edit this script to be a razor-sharp 60-second executive pitch (approx. 130-150 spoken words total). Structure into hook, problem, solution, and clear CTA.',
      punchy_hook:
        'Re-craft the opening lines of this script into a magnetic 3-second hook that immediately grabs the viewer\'s attention and establishes undeniable credibility on camera.',
      shorten_lines:
        'Reformat this script without changing words so that every line is strictly 5 to 7 words maximum. This minimizes horizontal eye travel and keeps gaze locked on the webcam lens.',
    };

    const instruction = modePrompts[mode] || modePrompts.conversational;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `${instruction}\n\nOriginal Script:\n${script}`,
      config: {
        systemInstruction:
          'You are an expert teleprompter script editor. Return ONLY the revised script formatted cleanly in Markdown. Do not wrap in conversational meta-commentary.',
      },
    });

    res.json({ refinedScript: response.text || script });
  } catch (error: any) {
    console.error('Script refinement error:', error);
    res.status(500).json({
      error: error?.message || 'Failed to refine script',
    });
  }
});

// 4. Live API Real-Time Voice Conversation via gemini-3.8-live over WebSocket
wss.on('connection', async (clientWs: WebSocket) => {
  console.log('[Live API] Client connected to WebSocket');
  let liveSession: any = null;

  try {
    const ai = getGeminiClient();

    liveSession = await (ai as any).live.connect({
      model: 'gemini-3.8-live',
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
        },
        systemInstruction:
          'You are the LensCue AI Rehearsal Partner and Live Voice Coach. ' +
          'The user is sitting in front of their camera teleprompter rehearsing their speech. ' +
          'Listen attentively to their spoken delivery. When they finish speaking or ask for feedback, ' +
          'converse with them naturally with short, encouraging, and constructive voice feedback on their cadence, energy, and tone. ' +
          'Keep your spoken responses concise and conversational (1-3 sentences) so the rehearsal moves forward smoothly.',
      },
      callbacks: {
        onmessage: (message: any) => {
          try {
            for (const part of message.serverContent?.modelTurn?.parts ?? []) {
              if (part.inlineData?.data) {
                clientWs.send(JSON.stringify({ audio: part.inlineData.data }));
              }
            }
            if (message.serverContent?.interrupted) {
              clientWs.send(JSON.stringify({ interrupted: true }));
            }
          } catch (err) {
            console.error('[Live API] Error forwarding message to client:', err);
          }
        },
        onclose: () => {
          console.log('[Live API] Gemini session closed');
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ closed: true }));
          }
        },
        onerror: (err: any) => {
          console.error('[Live API] Gemini session error:', err);
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ error: err?.message || 'Live session error' }));
          }
        },
      },
    });

    clientWs.send(JSON.stringify({ ready: true }));

    clientWs.on('message', (data) => {
      try {
        const parsed = JSON.parse(data.toString());
        if (parsed.audio && liveSession) {
          liveSession.sendRealtimeInput({
            audio: { data: parsed.audio, mimeType: 'audio/pcm;rate=16000' },
          });
        }
      } catch (err) {
        console.error('[Live API] Error handling client message:', err);
      }
    });

    clientWs.on('close', () => {
      console.log('[Live API] Client disconnected');
      if (liveSession?.close) {
        liveSession.close().catch(() => {});
      }
    });
  } catch (err: any) {
    console.error('[Live API] Connection error:', err);
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify({ error: err?.message || 'Could not connect to Live API' }));
      clientWs.close();
    }
  }
});

// Mount Vite in development or serve static build in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  server.listen(port, '0.0.0.0', () => {
    console.log(`[LensCue Server] Running on http://localhost:${port}`);
  });
}

startServer().catch((err) => {
  console.error('[LensCue Server] Failed to start:', err);
  process.exit(1);
});
