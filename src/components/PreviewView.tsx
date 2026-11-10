import React, { useRef, useState } from 'react';
import {
  FileText,
  Upload,
  Clock,
  Hash,
  Sparkles,
  Play,
  RotateCcw,
  Check,
  PlusCircle,
  Eye,
  Sliders,
  FileCode,
  Mic,
  Radio,
  MessageSquare,
  Zap,
  Timer,
  Loader2,
  Undo2,
} from 'lucide-react';
import { ScriptLine, PrompterSettings, SampleScript } from '../types/prompter';
import {
  SAMPLE_SCRIPTS,
  formatTime,
  calculateTotalDuration,
  calculateTotalWords,
} from '../utils/scriptParser';

interface PreviewViewProps {
  rawContent: string;
  onRawContentChange: (content: string) => void;
  lines: ScriptLine[];
  currentLineIndex: number;
  onSelectLine: (index: number) => void;
  onStartPresentation: () => void;
  settings: PrompterSettings;
  onOpenChatbot?: () => void;
  onOpenTranscribe?: () => void;
  onOpenLiveVoice?: () => void;
}

export const PreviewView: React.FC<PreviewViewProps> = ({
  rawContent,
  onRawContentChange,
  lines,
  currentLineIndex,
  onSelectLine,
  onStartPresentation,
  settings,
  onOpenChatbot,
  onOpenTranscribe,
  onOpenLiveVoice,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [tab, setTab] = useState<'lines' | 'editor'>('lines');
  const [isRefining, setIsRefining] = useState(false);
  const [activeRefineMode, setActiveRefineMode] = useState<string | null>(null);
  const [previousScript, setPreviousScript] = useState<string | null>(null);
  const [refineFeedback, setRefineFeedback] = useState<string | null>(null);

  const totalWords = calculateTotalWords(lines);
  const totalDuration = calculateTotalDuration(lines);
  const avgWordsPerLine = lines.length > 0 ? (totalWords / lines.length).toFixed(1) : '0';

  const handleQuickRefine = async (mode: 'conversational' | 'cues' | 'sixty_sec' | 'punchy_hook' | 'shorten_lines', label: string) => {
    if (!rawContent.trim() || isRefining) return;

    setIsRefining(true);
    setActiveRefineMode(mode);
    setRefineFeedback(null);

    try {
      const res = await fetch('/api/ai/refine-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script: rawContent, mode }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to refine script');
      }

      const data = await res.json();
      if (data.revisedScript) {
        setPreviousScript(rawContent);
        onRawContentChange(data.revisedScript);
        setRefineFeedback(`Applied: ${label}`);
        setTimeout(() => setRefineFeedback(null), 3000);
      }
    } catch (err: any) {
      console.error('Quick refine error:', err);
      setRefineFeedback(`Error: ${err.message}`);
      setTimeout(() => setRefineFeedback(null), 4000);
    } finally {
      setIsRefining(false);
      setActiveRefineMode(null);
    }
  };

  const handleUndo = () => {
    if (previousScript !== null) {
      onRawContentChange(previousScript);
      setPreviousScript(null);
      setRefineFeedback('Reverted to previous version');
      setTimeout(() => setRefineFeedback(null), 2500);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        onRawContentChange(text);
      }
    };
    reader.readAsText(file);
    // Reset file input so user can re-upload same file if needed
    e.target.value = '';
  };

  const handleInsertCue = (cue: string) => {
    onRawContentChange(rawContent + (rawContent.endsWith('\n') ? '' : '\n') + cue + '\n');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-28 text-white">
      {/* Header and Stats Strip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Eye className="w-5 h-5 text-zinc-400" />
            Script Preview & Rehearsal
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Inspect line-by-line cadence, rehearsal timings, and script structure before presenting.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".md,.txt,.markdown"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-zinc-300 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-colors whitespace-nowrap"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload (.md / .txt)</span>
          </button>

          <button
            type="button"
            onClick={onStartPresentation}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-black bg-white hover:bg-zinc-200 rounded-lg transition-colors whitespace-nowrap shadow-sm"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Launch Presentation</span>
          </button>
        </div>
      </div>

      {/* Script Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
        <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80">
          <span className="text-zinc-500 text-xs font-medium block">Total Duration</span>
          <span className="text-xl font-bold text-white font-mono tabular-nums mt-0.5 block">
            {formatTime(totalDuration)}
          </span>
          <span className="text-[11px] text-zinc-500 font-mono mt-0.5 block">
            at {settings.wpm} WPM
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80">
          <span className="text-zinc-500 text-xs font-medium block">Word Count</span>
          <span className="text-xl font-bold text-white font-mono tabular-nums mt-0.5 block">
            {totalWords}
          </span>
          <span className="text-[11px] text-zinc-500 font-mono mt-0.5 block">spoken words</span>
        </div>

        <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80">
          <span className="text-zinc-500 text-xs font-medium block">Prompter Lines</span>
          <span className="text-xl font-bold text-white font-mono tabular-nums mt-0.5 block">
            {lines.length}
          </span>
          <span className="text-[11px] text-zinc-500 font-mono mt-0.5 block">guided cues</span>
        </div>

        <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80">
          <span className="text-zinc-500 text-xs font-medium block">Avg. Words / Line</span>
          <span className="text-xl font-bold text-white font-mono tabular-nums mt-0.5 block">
            {avgWordsPerLine}
          </span>
          <span className="text-[11px] text-zinc-500 font-mono mt-0.5 block">optimal for lens gaze</span>
        </div>
      </div>

      {/* AI Speech & Script Studio */}
      <section
        aria-label="AI Speech & Script Studio"
        className="my-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-zinc-900/90 to-zinc-950 border border-zinc-800/90 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-32 bg-amber-500/5 blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Sparkles className="w-4 h-4 fill-amber-400/20" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <span>AI Speech & Script Studio</span>
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                  Gemini Models
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Transcribe voice, rehearse with real-time audio, or refine your script for on-camera eye contact.
              </p>
            </div>
          </div>

          {/* Primary AI Tool Modals Launchers */}
          <div className="flex flex-wrap items-center gap-2">
            {onOpenTranscribe && (
              <button
                type="button"
                onClick={onOpenTranscribe}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-200 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 rounded-xl transition-all shadow-sm active:scale-95"
              >
                <Mic className="w-3.5 h-3.5 text-rose-400" />
                <span>Dictate (3.5 Transcribe)</span>
              </button>
            )}

            {onOpenLiveVoice && (
              <button
                type="button"
                onClick={onOpenLiveVoice}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-200 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 rounded-xl transition-all shadow-sm active:scale-95"
              >
                <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>Live Voice Coach (3.8 Live)</span>
              </button>
            )}

            {onOpenChatbot && (
              <button
                type="button"
                onClick={onOpenChatbot}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-black bg-gradient-to-r from-amber-300 to-amber-400 hover:from-amber-200 hover:to-amber-300 rounded-xl transition-all shadow-md active:scale-95"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>AI Script Doctor</span>
              </button>
            )}
          </div>
        </div>

        {/* 1-Click Fast Refinement Presets */}
        <div className="pt-3.5 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-zinc-500 font-mono text-[11px] mr-1 flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" />
              1-Click Refine:
            </span>

            <button
              type="button"
              disabled={isRefining}
              onClick={() => handleQuickRefine('shorten_lines', 'Camera Eye-Lock (5-7 words)')}
              className="px-2.5 py-1 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white disabled:opacity-40 transition-colors flex items-center gap-1"
              title="Reformat lines to 5-7 words so eyes never pan away from webcam lens"
            >
              <span>👁️ Camera Eye-Lock</span>
            </button>

            <button
              type="button"
              disabled={isRefining}
              onClick={() => handleQuickRefine('cues', 'Timing & Stage Cues ([PAUSE], [SMILE])')}
              className="px-2.5 py-1 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white disabled:opacity-40 transition-colors flex items-center gap-1"
              title="Auto-insert rhetorical pauses and lens cues"
            >
              <span>⏱️ Timing Cues</span>
            </button>

            <button
              type="button"
              disabled={isRefining}
              onClick={() => handleQuickRefine('conversational', 'Natural Conversational Cadence')}
              className="px-2.5 py-1 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white disabled:opacity-40 transition-colors flex items-center gap-1"
              title="Transform stiff written text into natural spoken flow"
            >
              <span>💬 Conversational</span>
            </button>

            <button
              type="button"
              disabled={isRefining}
              onClick={() => handleQuickRefine('sixty_sec', '60-Second Video Pitch')}
              className="px-2.5 py-1 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white disabled:opacity-40 transition-colors flex items-center gap-1"
              title="Condense script into a razor-sharp 1-minute elevator pitch (~140 words)"
            >
              <span>⚡ 60s Pitch</span>
            </button>

            <button
              type="button"
              disabled={isRefining}
              onClick={() => handleQuickRefine('punchy_hook', 'Magnetic Opening Hook')}
              className="px-2.5 py-1 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white disabled:opacity-40 transition-colors flex items-center gap-1"
              title="Rewrite the opening 3 seconds to captivate listeners"
            >
              <span>🎣 Punchy Hook</span>
            </button>
          </div>

          {/* Status or Undo */}
          <div className="flex items-center gap-2 text-xs">
            {isRefining && (
              <span className="flex items-center gap-1.5 text-amber-400 font-mono text-[11px]">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Refining with Gemini...
              </span>
            )}

            {refineFeedback && !isRefining && (
              <span className="text-emerald-400 font-mono text-[11px] bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                {refineFeedback}
              </span>
            )}

            {previousScript && !isRefining && (
              <button
                type="button"
                onClick={handleUndo}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors font-mono text-[11px]"
                title="Undo AI changes"
              >
                <Undo2 className="w-3 h-3" />
                <span>Undo</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Sample Script Switcher Pill Strip */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="text-xs text-zinc-500 mr-1">Load sample script:</span>
        {SAMPLE_SCRIPTS.map((sample) => (
          <button
            key={sample.id}
            type="button"
            onClick={() => onRawContentChange(sample.content)}
            className="px-2.5 py-1 text-xs rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors"
          >
            {sample.title}
          </button>
        ))}
      </div>

      {/* Tab Switcher: Line Breakdown vs Direct Text/Markdown Editor */}
      <div className="flex items-center gap-2 mb-4 border-b border-zinc-800 pb-2">
        <button
          type="button"
          onClick={() => setTab('lines')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            tab === 'lines' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
          }`}
        >
          Line-by-Line Breakdown ({lines.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('editor')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            tab === 'editor' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
          }`}
        >
          Edit Script (Markdown / Plain Text)
        </button>
      </div>

      {/* Main Content Area */}
      {tab === 'lines' ? (
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
          <div className="px-4 py-3 bg-zinc-900/50 border-b border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
            <span>Click any line to set active starting point for presentation</span>
            <span className="font-mono">Est. Duration</span>
          </div>

          <div className="divide-y divide-zinc-900 max-h-[550px] overflow-y-auto">
            {lines.map((line, index) => {
              const isSelected = index === currentLineIndex;

              return (
                <div
                  key={line.id}
                  onClick={() => onSelectLine(index)}
                  className={`flex items-start justify-between gap-4 px-4 py-3 cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-zinc-900/90 border-l-2 border-white'
                      : 'hover:bg-zinc-900/40 text-zinc-300'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="text-xs font-mono text-zinc-600 w-6 pt-0.5 text-right shrink-0">
                      {index + 1}
                    </span>

                    <div className="min-w-0">
                      {line.type === 'cue' ? (
                        <span className="inline-block text-xs font-mono text-amber-300 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40">
                          {line.text}
                        </span>
                      ) : line.type === 'pause' ? (
                        <span className="inline-block text-xs font-mono text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-700">
                          {line.text}
                        </span>
                      ) : line.type === 'heading' ? (
                        <span className="font-bold text-white text-sm block">
                          {line.text}
                        </span>
                      ) : (
                        <p
                          className={`text-sm ${
                            isSelected ? 'text-white font-medium' : 'text-zinc-300'
                          }`}
                        >
                          {line.text}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 pt-0.5">
                    <span className="text-xs font-mono text-zinc-500 tabular-nums">
                      {line.durationSec.toFixed(1)}s
                    </span>
                    {isSelected && (
                      <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-800/40">
                        Active
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Markdown / Plain Text Direct Editor */
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-zinc-950 border border-zinc-800 rounded-lg text-xs">
            <span className="text-zinc-400">Quick insert prompter directives:</span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleInsertCue('[PAUSE 1.5s]')}
                className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded text-zinc-300 transition-colors"
              >
                + [PAUSE 1.5s]
              </button>
              <button
                type="button"
                onClick={() => handleInsertCue('[PAUSE 3s]')}
                className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded text-zinc-300 transition-colors"
              >
                + [PAUSE 3s]
              </button>
              <button
                type="button"
                onClick={() => handleInsertCue('[SMILE AND LOOK AT LENS]')}
                className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded text-zinc-300 transition-colors"
              >
                + [SMILE]
              </button>
              <button
                type="button"
                onClick={() => handleInsertCue('[NEXT SLIDE]')}
                className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded text-zinc-300 transition-colors"
              >
                + [SLIDE CUE]
              </button>
            </div>
          </div>

          <textarea
            value={rawContent}
            onChange={(e) => onRawContentChange(e.target.value)}
            rows={18}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white font-mono text-sm leading-relaxed focus:outline-none focus:border-zinc-500 shadow-2xl resize-y"
            placeholder="Paste or write your speech script here. Markdown headers (#) and bullets (-) are automatically parsed."
          />
        </div>
      )}
    </div>
  );
};
