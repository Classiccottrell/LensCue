import React, { useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  ChevronUp,
  ChevronDown,
  Maximize,
  Minimize,
  Sliders,
  Eye,
  Presentation,
  Gauge,
  Keyboard,
  Sparkles,
  Mic,
  Radio,
  MessageSquare,
} from 'lucide-react';
import { AppMode, PrompterSettings } from '../types/prompter';
import { formatTime } from '../utils/scriptParser';

interface BottomNavProps {
  currentMode: AppMode;
  onModeChange: (mode: AppMode) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  currentLineIndex: number;
  totalLines: number;
  remainingTimeSec: number;
  onLineChange: (index: number) => void;
  settings: PrompterSettings;
  onUpdateSettings: (updates: Partial<PrompterSettings>) => void;
  hasScript: boolean;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onOpenShortcuts?: () => void;
  onOpenChatbot?: () => void;
  onOpenTranscribe?: () => void;
  onOpenLiveVoice?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentMode,
  onModeChange,
  isPlaying,
  onTogglePlay,
  currentLineIndex,
  totalLines,
  remainingTimeSec,
  onLineChange,
  settings,
  onUpdateSettings,
  hasScript,
  isFullscreen,
  onToggleFullscreen,
  onOpenShortcuts,
  onOpenChatbot,
  onOpenTranscribe,
  onOpenLiveVoice,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isAiMenuOpen, setIsAiMenuOpen] = useState(false);

  return (
    <aside
      aria-label="Teleprompter controls and navigation"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`fixed bottom-3 left-1/2 -translate-x-1/2 z-50 w-auto max-w-[96vw] transition-opacity duration-300 ${
        currentMode === 'presentation' && isPlaying && !isHovered
          ? 'opacity-20 hover:opacity-100'
          : 'opacity-100'
      }`}
    >
      <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-3 px-3 py-2 bg-zinc-950/95 border border-zinc-800/90 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.85)] backdrop-blur-xl">
        {/* Section 1: Brand & Mode Switcher */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div className="flex items-center gap-1.5 pr-1 border-r border-zinc-800 hidden sm:flex">
            <div className="w-5 h-5 rounded-md bg-zinc-900 border border-zinc-700 flex items-center justify-center text-white">
              <div className="w-2 h-2 rounded-full bg-white flex items-center justify-center">
                <div className="w-0.5 h-0.5 rounded-full bg-black" />
              </div>
            </div>
            <span className="text-xs font-bold tracking-tight text-white whitespace-nowrap">
              LensCue
            </span>
          </div>

          {/* Mode Switcher */}
          <nav
            aria-label="Application modes"
            className="flex items-center p-0.5 bg-zinc-900/80 border border-zinc-800 rounded-xl text-xs font-medium shrink-0"
          >
            <button
              type="button"
              onClick={() => onModeChange('presentation')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all whitespace-nowrap shrink-0 ${
                currentMode === 'presentation'
                  ? 'bg-zinc-800 text-white font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Presentation className="w-3.5 h-3.5" />
              <span>Presentation</span>
            </button>

            <button
              type="button"
              onClick={() => onModeChange('preview')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all whitespace-nowrap shrink-0 ${
                currentMode === 'preview'
                  ? 'bg-zinc-800 text-white font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Preview</span>
            </button>

            <button
              type="button"
              onClick={() => onModeChange('config')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all whitespace-nowrap shrink-0 ${
                currentMode === 'config'
                  ? 'bg-zinc-800 text-white font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Config</span>
            </button>
          </nav>
        </div>

        <div className="w-[1px] h-5 bg-zinc-800 hidden sm:block shrink-0" />

        {/* Section 2: Prompter Controls */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Previous Line */}
          <button
            type="button"
            onClick={() => {
              if (currentLineIndex > 0) {
                onLineChange(currentLineIndex - 1);
              }
            }}
            disabled={currentLineIndex === 0}
            className="p-1.5 sm:p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/80 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            title="Previous Line [↑]"
            aria-label="Previous line"
          >
            <ChevronUp className="w-4 h-4" />
          </button>

          {/* Primary Play / Pause Action */}
          <button
            type="button"
            onClick={onTogglePlay}
            disabled={!hasScript}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-semibold text-xs transition-transform active:scale-95 shadow-sm whitespace-nowrap ${
              isPlaying
                ? 'bg-amber-500 hover:bg-amber-400 text-black'
                : 'bg-white hover:bg-zinc-200 text-black'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
            title="Toggle Play/Pause [Space]"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start</span>
              </>
            )}
            <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-mono rounded bg-black/15 text-black/80 font-normal">
              Space
            </kbd>
          </button>

          {/* Next Line */}
          <button
            type="button"
            onClick={() => {
              if (currentLineIndex < totalLines - 1) {
                onLineChange(currentLineIndex + 1);
              }
            }}
            disabled={currentLineIndex === totalLines - 1}
            className="p-1.5 sm:p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/80 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            title="Next Line [↓]"
            aria-label="Next line"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        <div className="w-[1px] h-5 bg-zinc-800 hidden sm:block shrink-0" />

        {/* Section 3: Pacing Speed Adjustments */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => onUpdateSettings({ wpm: Math.max(80, settings.wpm - 10) })}
            className="px-1.5 py-1 rounded-lg text-xs font-mono text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors"
            title="Slower pace [-]"
            aria-label="Decrease speaking pace"
          >
            -10
          </button>

          <span className="text-xs font-mono text-zinc-200 tabular-nums px-1 flex items-center gap-1">
            <Gauge className="w-3 h-3 text-zinc-500 hidden sm:inline" />
            <span>{settings.wpm}</span>
            <span className="text-zinc-500 text-[10px]">WPM</span>
          </span>

          <button
            type="button"
            onClick={() => onUpdateSettings({ wpm: Math.min(320, settings.wpm + 10) })}
            className="px-1.5 py-1 rounded-lg text-xs font-mono text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors"
            title="Faster pace [+]"
            aria-label="Increase speaking pace"
          >
            +10
          </button>
        </div>

        <div className="w-[1px] h-5 bg-zinc-800 hidden md:block shrink-0" />

        {/* Section 4: Text lines mode + Stats */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Quick Visible Lines Selector */}
          <button
            type="button"
            onClick={() =>
              onUpdateSettings({
                visibleLinesCount: settings.visibleLinesCount === 1 ? 3 : settings.visibleLinesCount === 3 ? 5 : 1,
              })
            }
            className="px-2 py-1 rounded-lg text-xs font-mono text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors"
            title="Cycle visible lines: 1 Line (Camera Notch Focus) -> 3 Lines -> 5 Lines"
            aria-label="Cycle visible lines count"
          >
            {settings.visibleLinesCount === 1 ? '1 Line' : `${settings.visibleLinesCount} Lines`}
          </button>

          {/* Reset */}
          <button
            type="button"
            onClick={() => onLineChange(0)}
            className="p-1.5 sm:p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors hidden sm:block"
            title="Restart from beginning [R]"
            aria-label="Restart script from beginning"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Fullscreen */}
          <button
            type="button"
            onClick={onToggleFullscreen}
            className="p-1.5 sm:p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors hidden sm:block"
            title="Toggle Fullscreen [F]"
            aria-label="Toggle Fullscreen mode"
          >
            {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
          </button>

          {/* AI Tools Popover Trigger */}
          {(onOpenChatbot || onOpenTranscribe || onOpenLiveVoice) && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsAiMenuOpen((prev) => !prev)}
                className={`p-1.5 sm:p-2 rounded-xl transition-all flex items-center gap-1 ${
                  isAiMenuOpen
                    ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20'
                    : 'text-amber-400 hover:text-amber-300 hover:bg-amber-400/10'
                }`}
                title="AI Speech & Script Tools"
                aria-label="Open AI Speech and Script tools"
              >
                <Sparkles className="w-3.5 h-3.5 fill-current" />
                <span className="text-xs font-semibold hidden md:inline">AI</span>
              </button>

              {/* Popover Menu */}
              {isAiMenuOpen && (
                <div
                  className="absolute bottom-full mb-3 right-0 sm:left-1/2 sm:-translate-x-1/2 w-64 p-2 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl backdrop-blur-xl z-50 flex flex-col gap-1 text-xs"
                  role="menu"
                >
                  <div className="px-2.5 py-1.5 border-b border-zinc-800/80 flex items-center justify-between">
                    <span className="font-semibold text-white flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      AI Speech Studio
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500">Gemini</span>
                  </div>

                  {onOpenChatbot && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsAiMenuOpen(false);
                        onOpenChatbot();
                      }}
                      className="w-full text-left px-2.5 py-2 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors flex items-center gap-2.5"
                    >
                      <div className="w-6 h-6 rounded-lg bg-amber-400/10 text-amber-400 flex items-center justify-center shrink-0">
                        <MessageSquare className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-white flex items-center justify-between">
                          <span>AI Script Doctor</span>
                          <kbd className="text-[9px] font-mono text-zinc-500 bg-zinc-900 px-1 rounded">A</kbd>
                        </div>
                        <p className="text-[11px] text-zinc-400 truncate">Multi-turn rewrite & camera cues</p>
                      </div>
                    </button>
                  )}

                  {onOpenTranscribe && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsAiMenuOpen(false);
                        onOpenTranscribe();
                      }}
                      className="w-full text-left px-2.5 py-2 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors flex items-center gap-2.5"
                    >
                      <div className="w-6 h-6 rounded-lg bg-rose-400/10 text-rose-400 flex items-center justify-center shrink-0">
                        <Mic className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-white">Dictate Script</div>
                        <p className="text-[11px] text-zinc-400 truncate">Mic or audio upload (3.5)</p>
                      </div>
                    </button>
                  )}

                  {onOpenLiveVoice && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsAiMenuOpen(false);
                        onOpenLiveVoice();
                      }}
                      className="w-full text-left px-2.5 py-2 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors flex items-center gap-2.5"
                    >
                      <div className="w-6 h-6 rounded-lg bg-emerald-400/10 text-emerald-400 flex items-center justify-center shrink-0">
                        <Radio className="w-3.5 h-3.5 animate-pulse" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-white">Live Voice Rehearsal</div>
                        <p className="text-[11px] text-zinc-400 truncate">Real-time sparring (3.8 Live)</p>
                      </div>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Shortcuts Help Modal trigger */}
          {onOpenShortcuts && (
            <button
              type="button"
              onClick={onOpenShortcuts}
              className="p-1.5 sm:p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors"
              title="Keyboard Shortcuts [?]"
              aria-label="View keyboard shortcuts"
            >
              <Keyboard className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Section 5: Real-time Stats */}
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400 border-l border-zinc-800 pl-2 shrink-0 hidden lg:flex">
          <span>{currentLineIndex + 1}/{totalLines}</span>
          <span className="text-zinc-600">·</span>
          <span>{formatTime(remainingTimeSec)}</span>
        </div>
      </div>
    </aside>
  );
};
