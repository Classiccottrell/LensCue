import React from 'react';
import { Play, Pause, Eye, Sliders, Presentation, Sparkles } from 'lucide-react';
import { AppMode } from '../types/prompter';

interface TopNavProps {
  currentMode: AppMode;
  onModeChange: (mode: AppMode) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  hasScript: boolean;
}

export const TopNav: React.FC<TopNavProps & { showNotch?: boolean }> = ({
  currentMode,
  onModeChange,
  isPlaying,
  onTogglePlay,
  hasScript,
  showNotch = true,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-black/95 backdrop-blur-md border-b border-zinc-800/80 px-3 sm:px-6 py-2 transition-colors">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* Zone 1: Wordmark & Mode Navigation */}
        <div className="flex items-center gap-3 sm:gap-5 min-w-0">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-6 h-6 rounded-md bg-zinc-900 border border-zinc-700/80 flex items-center justify-center text-white">
              <div className="w-2.5 h-2.5 rounded-full bg-white flex items-center justify-center">
                <div className="w-1 h-1 rounded-full bg-black" />
              </div>
            </div>
            <span className="text-sm sm:text-base font-bold tracking-tight text-white whitespace-nowrap hidden md:inline">
              LensCue
            </span>
          </div>

          {/* Mode Switcher Buttons */}
          <nav
            aria-label="Application modes"
            className="flex items-center p-0.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-medium shrink-0"
          >
            <button
              type="button"
              onClick={() => onModeChange('presentation')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md transition-all whitespace-nowrap shrink-0 ${
                currentMode === 'presentation'
                  ? 'bg-zinc-800 text-white shadow-sm font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
              }`}
            >
              <Presentation className="w-3.5 h-3.5" />
              <span>Presentation</span>
            </button>

            <button
              type="button"
              onClick={() => onModeChange('preview')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md transition-all whitespace-nowrap shrink-0 ${
                currentMode === 'preview'
                  ? 'bg-zinc-800 text-white shadow-sm font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Preview</span>
            </button>

            <button
              type="button"
              onClick={() => onModeChange('config')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md transition-all whitespace-nowrap shrink-0 ${
                currentMode === 'config'
                  ? 'bg-zinc-800 text-white shadow-sm font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Config</span>
            </button>
          </nav>
        </div>

        {/* Center: Camera Notch Optical Anchor */}
        {showNotch && (
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-950 border border-zinc-800 shadow-sm shrink-0"
            title="Position app directly below your camera for true eye contact"
          >
            <div className="relative flex items-center justify-center w-3 h-3 rounded-full bg-black border border-zinc-700">
              <div className="w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_5px_rgba(56,189,248,0.8)]" />
            </div>
            <span className="text-[10px] font-mono tracking-wider uppercase text-zinc-400 font-medium hidden lg:inline">
              Camera Lens
            </span>
          </div>
        )}

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onTogglePlay}
            disabled={!hasScript}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shadow-sm ${
              isPlaying
                ? 'bg-amber-500 hover:bg-amber-400 text-black'
                : 'bg-white hover:bg-zinc-200 text-black'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
            title="Press Spacebar anytime to play or pause"
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
            <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-mono rounded bg-black/15 text-black/80 font-normal">
              Space
            </kbd>
          </button>
        </div>
      </div>
    </header>
  );
};
