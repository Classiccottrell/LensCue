import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Upload, Loader2, X, Check, FileAudio, Sparkles, Volume2 } from 'lucide-react';
import { blobToBase64 } from '../utils/audioUtils';

interface AudioTranscribeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyScript: (newScript: string, append: boolean) => void;
}

export const AudioTranscribeModal: React.FC<AudioTranscribeModalProps> = ({
  isOpen,
  onClose,
  onApplyScript,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      if (isRecording) {
        stopRecording();
      }
      setTranscript(null);
      setErrorMessage(null);
      setRecordingSeconds(0);
    }
  }, [isOpen]);

  const startRecording = async () => {
    setErrorMessage(null);
    setTranscript(null);
    audioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : '';

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        });
        stream.getTracks().forEach((track) => track.stop());
        await processAudioTranscription(audioBlob);
      };

      recorder.start(250);
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      setErrorMessage(
        err?.message || 'Microphone access denied. Please allow microphone permissions.'
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);
  };

  const processAudioTranscription = async (blob: Blob) => {
    setIsTranscribing(true);
    setErrorMessage(null);
    try {
      const base64Data = await blobToBase64(blob);
      const res = await fetch('/api/ai/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioData: base64Data,
          mimeType: blob.type || 'audio/webm',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to transcribe audio.');
      }

      setTranscript(data.transcript);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error transcribing audio.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processAudioTranscription(file);
    e.target.value = '';
  };

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="transcribe-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl p-6 text-white"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-950/60 border border-amber-600/40 flex items-center justify-center text-amber-400">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <h2 id="transcribe-modal-title" className="text-base font-bold text-white flex items-center gap-2">
                Dictate to Script
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-400 font-normal">
                  gemini-3.5-transcribe
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Speak naturally or upload audio. Gemini will transcribe and format into camera lines.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-800/80 text-xs text-red-200">
            {errorMessage}
          </div>
        )}

        {/* Recording or Upload Area */}
        {!transcript && (
          <div className="flex flex-col items-center justify-center p-6 rounded-xl bg-zinc-900/40 border border-zinc-800/80 text-center">
            {isRecording ? (
              <div className="flex flex-col items-center gap-3">
                <div className="relative flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-red-500/20 animate-ping absolute" />
                  <div className="w-16 h-16 rounded-full bg-red-600 border border-red-400 flex items-center justify-center text-white shadow-lg relative z-10">
                    <Mic className="w-7 h-7 animate-pulse" />
                  </div>
                </div>

                <div className="font-mono text-2xl font-bold text-white tabular-nums">
                  {formatTimer(recordingSeconds)}
                </div>
                <span className="text-xs text-zinc-400">Listening to your voice... Speak your script</span>

                <button
                  type="button"
                  onClick={stopRecording}
                  className="mt-2 flex items-center gap-2 px-5 py-2 rounded-xl bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition-all shadow-md"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Done Speaking (Transcribe)</span>
                </button>
              </div>
            ) : isTranscribing ? (
              <div className="flex flex-col items-center gap-3 py-6">
                <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
                <span className="text-sm font-semibold text-white">
                  Transcribing with gemini-3.5-transcribe...
                </span>
                <span className="text-xs text-zinc-500">
                  Formatting into teleprompter-optimized lines with pacing pauses
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 py-2">
                <button
                  type="button"
                  onClick={startRecording}
                  className="flex items-center justify-center w-16 h-16 rounded-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white transition-all transform hover:scale-105 shadow-xl"
                  title="Click to start dictating"
                >
                  <Mic className="w-7 h-7 text-amber-400" />
                </button>

                <div>
                  <span className="text-sm font-semibold text-white block">Tap to Start Dictating</span>
                  <span className="text-xs text-zinc-400 block mt-0.5">
                    Speak your presentation ideas aloud. Gemini will structure them line by line.
                  </span>
                </div>

                <div className="flex items-center gap-3 w-full my-1">
                  <div className="h-[1px] bg-zinc-800 flex-1" />
                  <span className="text-[10px] font-mono uppercase text-zinc-500">Or upload audio</span>
                  <div className="h-[1px] bg-zinc-800 flex-1" />
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="audio/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 transition-colors"
                >
                  <FileAudio className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Select Audio File (.mp3, .wav, .m4a)</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Transcript Result View */}
        {transcript && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Transcribed Teleprompter Script
              </span>
              <button
                type="button"
                onClick={() => {
                  setTranscript(null);
                  startRecording();
                }}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                Record Again
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800 max-h-60 overflow-y-auto font-mono text-xs leading-relaxed text-zinc-200 whitespace-pre-wrap">
              {transcript}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-900">
              <button
                type="button"
                onClick={() => {
                  onApplyScript(transcript, true);
                  onClose();
                }}
                className="px-3 py-1.5 text-xs text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-colors"
              >
                Append to Script
              </button>

              <button
                type="button"
                onClick={() => {
                  onApplyScript(transcript, false);
                  onClose();
                }}
                className="px-4 py-1.5 text-xs font-semibold text-black bg-white hover:bg-zinc-200 rounded-lg transition-colors shadow-sm"
              >
                Replace Script
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
