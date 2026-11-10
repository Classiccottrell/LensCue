import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Radio,
  X,
  Volume2,
  Sparkles,
  PhoneCall,
  PhoneOff,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { floatTo16BitPCMBase64, playPCMChunk } from '../utils/audioUtils';

interface LiveVoiceCoachModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentScriptTitle?: string;
}

export const LiveVoiceCoachModal: React.FC<LiveVoiceCoachModalProps> = ({
  isOpen,
  onClose,
  currentScriptTitle,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [liveLog, setLiveLog] = useState<string[]>([
    'Ready to start live voice session with Gemini 3.8 Live.',
  ]);

  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const playbackStartTimeRef = useRef<{ current: number }>({ current: 0 });

  useEffect(() => {
    if (!isOpen) {
      disconnectLive();
    }
  }, [isOpen]);

  const addLog = (msg: string) => {
    setLiveLog((prev) => [...prev.slice(-6), msg]);
  };

  const connectLive = async () => {
    setIsConnecting(true);
    setErrorMessage(null);
    addLog('Connecting to Gemini 3.8 Live API...');

    try {
      // Setup Web Audio contexts
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000,
      });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000,
      });

      inputAudioCtxRef.current = inputCtx;
      outputAudioCtxRef.current = outputCtx;
      playbackStartTimeRef.current.current = outputCtx.currentTime;

      // Get user microphone stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      mediaStreamRef.current = stream;

      // Setup WebSocket connection to server Live API bridge
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/live`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        addLog('Connected to Live WebSocket. Initializing microphone pipeline...');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.ready) {
            setIsConnected(true);
            setIsConnecting(false);
            addLog('Gemini Live session active. Speak freely into your camera!');
          }

          if (data.audio) {
            setIsAiSpeaking(true);
            playPCMChunk(outputCtx, data.audio, playbackStartTimeRef.current);
            // Reset AI speaking indicator after playback catch-up
            setTimeout(() => {
              if (outputCtx.currentTime >= playbackStartTimeRef.current.current) {
                setIsAiSpeaking(false);
              }
            }, 500);
          }

          if (data.interrupted) {
            playbackStartTimeRef.current.current = outputCtx.currentTime;
            setIsAiSpeaking(false);
          }

          if (data.error) {
            setErrorMessage(data.error);
            addLog(`Error: ${data.error}`);
          }
        } catch (err) {
          console.error('[Live Voice] Error parsing ws message:', err);
        }
      };

      ws.onerror = (err) => {
        console.error('[Live Voice] WebSocket error:', err);
        setErrorMessage('Failed to connect to Live API bridge.');
        setIsConnecting(false);
      };

      ws.onclose = () => {
        setIsConnected(false);
        setIsConnecting(false);
        addLog('Live session ended.');
      };

      // Connect mic to script processor to stream 16kHz PCM
      const source = inputCtx.createMediaStreamSource(stream);
      const processor = inputCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (!ws || ws.readyState !== WebSocket.OPEN || isMuted) return;
        const inputData = e.inputBuffer.getChannelData(0);
        const base64Pcm = floatTo16BitPCMBase64(inputData);
        ws.send(JSON.stringify({ audio: base64Pcm }));
      };

      source.connect(processor);
      processor.connect(inputCtx.destination);
    } catch (err: any) {
      console.error('[Live Voice] Setup failed:', err);
      setErrorMessage(err?.message || 'Could not start Live Voice session.');
      setIsConnecting(false);
      disconnectLive();
    }
  };

  const disconnectLive = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (inputAudioCtxRef.current) {
      inputAudioCtxRef.current.close().catch(() => {});
      inputAudioCtxRef.current = null;
    }
    if (outputAudioCtxRef.current) {
      outputAudioCtxRef.current.close().catch(() => {});
      outputAudioCtxRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
    setIsAiSpeaking(false);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="live-voice-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl p-6 text-white text-center"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-6">
          <div className="flex items-center gap-2.5 text-left">
            <div className="w-8 h-8 rounded-xl bg-sky-950 border border-sky-600/40 text-sky-400 flex items-center justify-center font-bold">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h2 id="live-voice-title" className="text-base font-bold text-white flex items-center gap-2">
                Live Voice Rehearsal Partner
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-sky-400 font-normal">
                  gemini-3.8-live
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Real-time back-and-forth speech coaching with sub-second latency.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
            aria-label="Close live modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-800/80 text-xs text-red-200 flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Visualizer Sphere */}
        <div className="py-6 flex flex-col items-center justify-center">
          <div className="relative flex items-center justify-center">
            {isConnected && (
              <div
                className={`w-36 h-36 rounded-full absolute transition-all duration-300 ${
                  isAiSpeaking
                    ? 'bg-sky-500/30 scale-125 animate-pulse'
                    : 'bg-emerald-500/20 scale-110 animate-ping'
                }`}
              />
            )}

            <div
              className={`w-28 h-28 rounded-full border flex items-center justify-center transition-all duration-300 relative z-10 shadow-2xl ${
                isConnected
                  ? isAiSpeaking
                    ? 'bg-gradient-to-tr from-sky-600 to-indigo-500 border-sky-300 text-white'
                    : 'bg-gradient-to-tr from-emerald-600 to-teal-500 border-emerald-300 text-white'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-600'
              }`}
            >
              {isConnecting ? (
                <Loader2 className="w-10 h-10 animate-spin text-sky-400" />
              ) : isConnected ? (
                isAiSpeaking ? (
                  <Volume2 className="w-10 h-10 animate-bounce" />
                ) : (
                  <Mic className="w-10 h-10" />
                )
              ) : (
                <PhoneOff className="w-10 h-10" />
              )}
            </div>
          </div>

          {/* Status Label */}
          <div className="mt-5">
            <span className="text-sm font-bold text-white block">
              {isConnecting
                ? 'Connecting to Gemini Live...'
                : isConnected
                ? isAiSpeaking
                  ? 'Gemini is speaking...'
                  : 'Listening... Read your script or ask for tips'
                : 'Session Ready to Start'}
            </span>
            <span className="text-xs text-zinc-400 block mt-1">
              {isConnected
                ? 'Practice natural eye contact with your camera while speaking.'
                : 'Have a real-time conversational rehearsal session with your AI director.'}
            </span>
          </div>
        </div>

        {/* Live Audio Activity / Activity logs */}
        <div className="mb-6 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-left font-mono text-[11px] text-zinc-400 space-y-1">
          {liveLog.map((log, i) => (
            <div key={i} className="line-clamp-1">
              › {log}
            </div>
          ))}
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-center gap-3 pt-3 border-t border-zinc-900">
          {!isConnected ? (
            <button
              type="button"
              onClick={connectLive}
              disabled={isConnecting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition-all shadow-lg disabled:opacity-40"
            >
              <PhoneCall className="w-4 h-4 fill-current" />
              <span>{isConnecting ? 'Connecting...' : 'Start Voice Rehearsal'}</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setIsMuted((prev) => !prev)}
                className={`p-2.5 rounded-xl border transition-colors ${
                  isMuted
                    ? 'bg-amber-950/60 border-amber-600/40 text-amber-300'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white'
                }`}
                title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
              >
                {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={disconnectLive}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs transition-colors shadow-md"
              >
                <PhoneOff className="w-4 h-4" />
                <span>End Session</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
