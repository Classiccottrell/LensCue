import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  ChevronUp,
  ChevronDown,
  Maximize,
  Minimize,
  Sliders,
  Gauge,
  Camera,
  ExternalLink,
  Volume2,
} from 'lucide-react';
import { ScriptLine, PrompterSettings } from '../types/prompter';
import { formatTime } from '../utils/scriptParser';

interface PresentationViewProps {
  lines: ScriptLine[];
  currentLineIndex: number;
  onLineChange: (index: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  settings: PrompterSettings;
  onUpdateSettings: (updates: Partial<PrompterSettings>) => void;
  onOpenConfig: () => void;
}

export const PresentationView: React.FC<PresentationViewProps> = ({
  lines,
  currentLineIndex,
  onLineChange,
  isPlaying,
  onTogglePlay,
  settings,
  onUpdateSettings,
  onOpenConfig,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeLineRef = useRef<HTMLDivElement | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [lineProgress, setLineProgress] = useState(0); // 0 to 1 for active line time elapsed

  const currentLine = lines[currentLineIndex];
  const totalLines = lines.length;

  // Calculate remaining speech time from current line to end
  const remainingTimeSec = useMemo(() => {
    let sum = 0;
    for (let i = currentLineIndex; i < lines.length; i++) {
      if (i === currentLineIndex) {
        sum += (lines[i].durationSec || 2) * (1 - lineProgress);
      } else {
        sum += lines[i].durationSec || 2;
      }
    }
    return sum;
  }, [lines, currentLineIndex, lineProgress]);

  // Handle countdown before start
  useEffect(() => {
    if (!isPlaying) {
      setCountdown(null);
      return;
    }

    if (settings.countdownDuration > 0 && countdown === null && currentLineIndex === 0) {
      setCountdown(settings.countdownDuration);
    }
  }, [isPlaying, settings.countdownDuration, currentLineIndex]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      setCountdown(null);
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown]);

  // Main line pacing timer
  useEffect(() => {
    if (!isPlaying || countdown !== null || !currentLine) {
      return;
    }

    const lineDurationMs = (currentLine.durationSec || 2) * 1000;
    const intervalMs = 50;
    const step = intervalMs / lineDurationMs;

    setLineProgress(0);

    const interval = setInterval(() => {
      setLineProgress((prev) => {
        if (prev >= 1) return 1;
        return prev + step;
      });
    }, intervalMs);

    return () => clearInterval(interval);
  }, [isPlaying, countdown, currentLineIndex, currentLine]);

  // Handle line transition cleanly when line progress completes
  useEffect(() => {
    if (lineProgress >= 1 && isPlaying) {
      setLineProgress(0);
      if (currentLineIndex < totalLines - 1) {
        onLineChange(currentLineIndex + 1);
      } else {
        onTogglePlay();
      }
    }
  }, [lineProgress, isPlaying, currentLineIndex, totalLines, onLineChange, onTogglePlay]);

  // Scroll active line into view smoothly
  useEffect(() => {
    if (activeLineRef.current && settings.visibleLinesCount > 1) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [currentLineIndex, settings.visibleLinesCount]);

  // Determine width constraint class
  const widthClass = {
    narrow: 'max-w-md', // ~448px - camera notch hugger
    medium: 'max-w-xl', // ~576px
    wide: 'max-w-3xl',   // ~768px
    full: 'max-w-5xl',
  }[settings.prompterWidth];

  // Determine font size class
  const fontClass = {
    sm: 'text-xl sm:text-2xl',
    md: 'text-2xl sm:text-3xl',
    lg: 'text-3xl sm:text-4xl font-semibold',
    xl: 'text-4xl sm:text-5xl font-bold',
    '2xl': 'text-5xl sm:text-6xl font-bold',
  }[settings.fontSize];

  // Lines to display based on visibleLinesCount setting:
  // 1 line: only current active line
  // 3 lines: 1 previous, 1 active, 1 next
  // 5 lines: 2 previous, 1 active, 2 next
  // 7 lines: 3 previous, 1 active, 3 next
  // 99 lines: continuous scroll list
  const visibleIndices = useMemo(() => {
    if (settings.visibleLinesCount === 99) {
      return lines.map((_, i) => i);
    }
    const count = settings.visibleLinesCount;
    if (count === 1) {
      return [currentLineIndex];
    }
    const offset = Math.floor(count / 2);
    const indices: number[] = [];
    for (let i = currentLineIndex - offset; i <= currentLineIndex + offset; i++) {
      if (i >= 0 && i < lines.length) {
        indices.push(i);
      }
    }
    return indices;
  }, [lines, currentLineIndex, settings.visibleLinesCount]);

  if (!lines || lines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <p className="text-zinc-400 text-base mb-4">No script loaded yet.</p>
        <button
          type="button"
          onClick={onOpenConfig}
          className="px-4 py-2 bg-white text-black font-semibold rounded-lg hover:bg-zinc-200 transition-colors text-sm"
        >
          Load or Upload Script
        </button>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative min-h-[calc(100vh-60px)] flex flex-col items-center justify-start bg-black text-white select-none ${
        settings.isMirrored ? 'scale-x-[-1]' : ''
      }`}
    >
      {/* Countdown Overlay */}
      {countdown !== null && countdown > 0 && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md">
          <div className="flex flex-col items-center">
            <span className="text-zinc-500 text-sm font-mono uppercase tracking-widest mb-2">
              Look directly at the camera
            </span>
            <span className="text-8xl sm:text-9xl font-bold text-white tabular-nums animate-pulse">
              {countdown}
            </span>
          </div>
        </div>
      )}

      {/* Camera Notch Focus Header / Anchor */}
      <div className="w-full flex flex-col items-center pt-8 sm:pt-9 pb-1 shrink-0">
        <div className="flex items-center gap-2.5 text-zinc-500 text-[11px] font-mono tabular-nums">
          <span className="flex items-center gap-1">
            <span className="text-zinc-400">Line</span>
            <span className="text-white font-medium">{currentLineIndex + 1}</span>
            <span>/</span>
            <span>{totalLines}</span>
          </span>
          <span aria-hidden="true" className="text-zinc-700">·</span>
          <span className="flex items-center gap-1">
            <Gauge className="w-3 h-3 text-zinc-400" />
            <span className="text-white font-medium">{settings.wpm}</span>
            <span>WPM</span>
          </span>
          <span aria-hidden="true" className="text-zinc-700">·</span>
          <span className="flex items-center gap-1">
            <span className="text-zinc-400">Remaining</span>
            <span className="text-white font-medium">{formatTime(remainingTimeSec)}</span>
          </span>
        </div>

        {/* Global Progress Bar */}
        <div className="w-44 sm:w-56 h-0.5 bg-zinc-900 rounded-full mt-1.5 overflow-hidden">
          <div
            className="h-full bg-white transition-all duration-150 rounded-full"
            style={{
              width: `${Math.min(100, ((currentLineIndex + lineProgress) / totalLines) * 100)}%`,
            }}
          />
        </div>
      </div>

      {/* Main Reading Viewport - Anchored immediately below the camera notch */}
      <div
        className={`w-full ${widthClass} mx-auto px-4 sm:px-6 pt-1 pb-28 flex-1 flex flex-col justify-start`}
      >
        {/* If visibleLinesCount === 1: Ultra-focused Single Line View right under the lens */}
        {settings.visibleLinesCount === 1 ? (
          <div className="flex flex-col items-center justify-start pt-2 sm:pt-4 text-center">
            {/* Visual Eyeline Indicator */}
            <div className="flex items-center gap-2 mb-3 opacity-60">
              <div className="w-8 h-[1px] bg-zinc-700" />
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-700/80 text-[9px] font-mono text-zinc-400">
                <span>LOOK HERE</span>
              </div>
              <div className="w-8 h-[1px] bg-zinc-700" />
            </div>

            {currentLine.type === 'cue' ? (
              <div className="p-3 sm:p-4 rounded-xl bg-amber-950/40 border border-amber-600/40 text-amber-300 font-mono text-base sm:text-lg uppercase tracking-wider mb-2">
                {currentLine.text}
              </div>
            ) : currentLine.type === 'pause' ? (
              <div className="p-3 sm:p-4 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-300 font-mono text-lg sm:text-xl tracking-widest mb-2 animate-pulse">
                {currentLine.text}
              </div>
            ) : currentLine.type === 'heading' ? (
              <h2 className="text-zinc-400 text-lg sm:text-xl uppercase tracking-widest font-semibold mb-2">
                {currentLine.text}
              </h2>
            ) : (
              <p
                className={`${fontClass} leading-tight text-white font-medium tracking-tight transition-all duration-200`}
                style={{ textAlign: settings.align }}
              >
                {currentLine.text}
              </p>
            )}

            {/* Line cadence micro-progress indicator */}
            <div className="w-32 h-1 bg-zinc-900 rounded-full mt-4 sm:mt-5 overflow-hidden">
              <div
                className="h-full bg-amber-400 transition-all duration-75"
                style={{ width: `${lineProgress * 100}%` }}
              />
            </div>

            {/* Next line sneak peek */}
            {currentLineIndex < totalLines - 1 && (
              <div className="mt-4 sm:mt-5 text-xs sm:text-sm text-zinc-500 font-normal line-clamp-1 max-w-md opacity-60">
                <span className="text-zinc-600 mr-2 font-mono text-[10px]">NEXT:</span>
                {lines[currentLineIndex + 1].text}
              </div>
            )}
          </div>
        ) : (
          /* Multi-line view anchored tight at top */
          <div className="space-y-2.5 sm:space-y-3.5 pt-1">
            {visibleIndices.map((idx) => {
              const line = lines[idx];
              const isActive = idx === currentLineIndex;
              const isPast = idx < currentLineIndex;
              const isFuture = idx > currentLineIndex;

              return (
                <div
                  key={line.id}
                  ref={isActive ? activeLineRef : null}
                  onClick={() => {
                    onLineChange(idx);
                    setLineProgress(0);
                  }}
                  className={`group relative rounded-xl px-4 py-3 transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-zinc-900/80 border border-zinc-700/80 shadow-2xl'
                      : isPast && settings.dimPreviousLines
                      ? 'opacity-25 hover:opacity-50'
                      : 'opacity-40 hover:opacity-75'
                  }`}
                >
                  {/* Active Line Focus Marker */}
                  {isActive && (
                    <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1 h-8 rounded-full bg-white" />
                  )}

                  {/* Stage Cue Styling */}
                  {line.type === 'cue' ? (
                    <div className="text-amber-300 font-mono text-xs sm:text-sm tracking-wide uppercase">
                      {line.text}
                    </div>
                  ) : line.type === 'pause' ? (
                    <div className="text-zinc-400 font-mono text-sm tracking-widest flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                      <span>{line.text}</span>
                    </div>
                  ) : line.type === 'heading' ? (
                    <h3
                      className={`font-bold tracking-tight ${
                        isActive ? 'text-zinc-200 text-xl' : 'text-zinc-500 text-lg'
                      }`}
                    >
                      {line.text}
                    </h3>
                  ) : (
                    <p
                      className={`${
                        isActive
                          ? `${fontClass} text-white font-semibold leading-tight`
                          : 'text-lg sm:text-xl text-zinc-400 font-normal leading-snug'
                      }`}
                      style={{ textAlign: settings.align }}
                    >
                      {line.text}
                    </p>
                  )}

                  {/* Active Line Timing Bar */}
                  {isActive && (
                    <div className="mt-3 w-full h-0.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-white transition-all duration-75"
                        style={{ width: `${lineProgress * 100}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
