import React, { useState, useEffect, useMemo } from 'react';
import { AppMode, PrompterSettings } from './types/prompter';
import { SAMPLE_SCRIPTS, parseScript } from './utils/scriptParser';
import { CameraNotchGuide } from './components/CameraNotchGuide';
import { WebcamOverlay } from './components/WebcamOverlay';
import { BottomNav } from './components/BottomNav';
import { PresentationView } from './components/PresentationView';
import { PreviewView } from './components/PreviewView';
import { ConfigurationView } from './components/ConfigurationView';

import { ShortcutsModal } from './components/ShortcutsModal';
import { isTextInputElement } from './utils/shortcuts';

const STORAGE_KEY_SCRIPT = 'lenscue_script_v1';
const STORAGE_KEY_SETTINGS = 'lenscue_settings_v1';

const DEFAULT_SETTINGS: PrompterSettings = {
  wpm: 150,
  visibleLinesCount: 3, // 3 lines gives comfortable context while hugging camera
  prompterWidth: 'narrow', // ~440px - keeps eyes locked directly below the lens
  fontSize: 'lg',
  align: 'center',
  isMirrored: false,
  showCameraNotchGuide: true,
  showWebcamPreview: false,
  webcamOpacity: 0.25,
  countdownDuration: 3,
  dimPreviousLines: true,
  highlightCurrentLine: true,
  voiceFollowEnabled: false,
  autoAdvance: true,
};

export default function App() {
  // Load initial script from localStorage or fallback to default sample
  const [rawScript, setRawScript] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SCRIPT);
      if (saved && saved.trim()) return saved;
    } catch {
      // ignore
    }
    return SAMPLE_SCRIPTS[0].content;
  });

  // Load initial settings
  const [settings, setSettings] = useState<PrompterSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {
      // ignore
    }
    return DEFAULT_SETTINGS;
  });

  const [currentMode, setCurrentMode] = useState<AppMode>('presentation');
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Helper to show transient keypress toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 1200);
    return () => clearTimeout(t);
  }, [toastMessage]);

  // Parse lines whenever rawScript or WPM changes
  const lines = useMemo(() => {
    return parseScript(rawScript, settings.wpm);
  }, [rawScript, settings.wpm]);

  // Calculate remaining speech time
  const remainingTimeSec = useMemo(() => {
    let sum = 0;
    for (let i = currentLineIndex; i < lines.length; i++) {
      sum += lines[i].durationSec || 2;
    }
    return sum;
  }, [lines, currentLineIndex]);

  // Persist script to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SCRIPT, rawScript);
    } catch {
      // ignore
    }
  }, [rawScript]);

  // Persist settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch {
      // ignore
    }
  }, [settings]);

  // Ensure currentLineIndex stays in bounds if script changes
  useEffect(() => {
    if (lines.length > 0 && currentLineIndex >= lines.length) {
      setCurrentLineIndex(Math.max(0, lines.length - 1));
    }
  }, [lines.length, currentLineIndex]);

  const handleUpdateSettings = (updates: Partial<PrompterSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  };

  const handleTogglePlay = () => {
    setIsPlaying((prev) => {
      const next = !prev;
      showToast(next ? '▶ Playing' : '⏸ Paused');
      return next;
    });
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
      showToast('Fullscreen ON');
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
      showToast('Fullscreen OFF');
    }
  };

  // Global Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Do not trigger shortcuts when typing in inputs or textareas
      if (isTextInputElement(e.target)) {
        return;
      }

      // Space: Toggle Play / Pause
      if (e.code === 'Space') {
        e.preventDefault();
        if (currentMode !== 'presentation') {
          setCurrentMode('presentation');
        }
        setIsPlaying((prev) => {
          const next = !prev;
          showToast(next ? '▶ Playing' : '⏸ Paused');
          return next;
        });
        return;
      }

      // ArrowDown / ArrowRight / PageDown: Next Line
      if (e.code === 'ArrowDown' || e.code === 'ArrowRight' || e.code === 'PageDown') {
        e.preventDefault();
        setCurrentLineIndex((prev) => {
          const next = Math.min(lines.length - 1, prev + 1);
          showToast(`Line ${next + 1} / ${lines.length}`);
          return next;
        });
        return;
      }

      // ArrowUp / ArrowLeft / PageUp: Previous Line
      if (e.code === 'ArrowUp' || e.code === 'ArrowLeft' || e.code === 'PageUp') {
        e.preventDefault();
        setCurrentLineIndex((prev) => {
          const next = Math.max(0, prev - 1);
          showToast(`Line ${next + 1} / ${lines.length}`);
          return next;
        });
        return;
      }

      // Home or KeyR: Restart from Line 1
      if (e.code === 'KeyR' || e.code === 'Home') {
        e.preventDefault();
        setCurrentLineIndex(0);
        showToast('↺ Restarted from Line 1');
        return;
      }

      // End: Jump to Last Line
      if (e.code === 'End') {
        e.preventDefault();
        const last = Math.max(0, lines.length - 1);
        setCurrentLineIndex(last);
        showToast(`Jumped to End (${last + 1})`);
        return;
      }

      // + / = / ] / NumpadAdd: Increase talking pace (+10 WPM)
      if (e.code === 'Equal' || e.code === 'NumpadAdd' || e.code === 'BracketRight') {
        e.preventDefault();
        setSettings((prev) => {
          const nextWpm = Math.min(320, prev.wpm + 10);
          showToast(`Pace: ${nextWpm} WPM`);
          return { ...prev, wpm: nextWpm };
        });
        return;
      }

      // - / _ / [ / NumpadSubtract: Decrease talking pace (-10 WPM)
      if (e.code === 'Minus' || e.code === 'NumpadSubtract' || e.code === 'BracketLeft') {
        e.preventDefault();
        setSettings((prev) => {
          const nextWpm = Math.max(80, prev.wpm - 10);
          showToast(`Pace: ${nextWpm} WPM`);
          return { ...prev, wpm: nextWpm };
        });
        return;
      }

      // KeyF: Toggle Fullscreen
      if (e.code === 'KeyF') {
        e.preventDefault();
        handleToggleFullscreen();
        return;
      }

      // KeyM: Toggle Mirror Mode
      if (e.code === 'KeyM') {
        e.preventDefault();
        setSettings((prev) => {
          const next = !prev.isMirrored;
          showToast(next ? 'Mirror Mode ON' : 'Mirror Mode OFF');
          return { ...prev, isMirrored: next };
        });
        return;
      }

      // KeyL: Cycle Visible Lines Count (1 Line -> 3 Lines -> 5 Lines)
      if (e.code === 'KeyL') {
        e.preventDefault();
        setSettings((prev) => {
          const nextLines = prev.visibleLinesCount === 1 ? 3 : prev.visibleLinesCount === 3 ? 5 : 1;
          showToast(`${nextLines} Lines Mode`);
          return { ...prev, visibleLinesCount: nextLines };
        });
        return;
      }

      // KeyC: Toggle Camera Notch Guide
      if (e.code === 'KeyC') {
        e.preventDefault();
        setSettings((prev) => {
          const next = !prev.showCameraNotchGuide;
          showToast(next ? 'Camera Guide ON' : 'Camera Guide OFF');
          return { ...prev, showCameraNotchGuide: next };
        });
        return;
      }

      // KeyW: Toggle Webcam Mirror Preview
      if (e.code === 'KeyW') {
        e.preventDefault();
        setSettings((prev) => {
          const next = !prev.showWebcamPreview;
          showToast(next ? 'Webcam Mirror ON' : 'Webcam Mirror OFF');
          return { ...prev, showWebcamPreview: next };
        });
        return;
      }

      // ? or KeyH: Toggle Keyboard Shortcuts Modal
      if (e.key === '?' || e.code === 'KeyH') {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
        return;
      }

      // Escape: Close Modal or Pause Playback
      if (e.code === 'Escape') {
        if (isShortcutsOpen) {
          setIsShortcutsOpen(false);
        } else if (isPlaying) {
          setIsPlaying(false);
          showToast('⏸ Paused');
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentMode, lines.length, isPlaying, isShortcutsOpen]);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col selection:bg-zinc-800 selection:text-white">
      {/* Top Camera Notch Guide - sits right at the physical top border below the camera */}
      <CameraNotchGuide
        showGuide={settings.showCameraNotchGuide}
        isMirrored={settings.isMirrored}
      />

      {/* Live Webcam Overlay */}
      <WebcamOverlay
        enabled={settings.showWebcamPreview}
        opacity={settings.webcamOpacity}
        isMirrored={settings.isMirrored}
      />

      {/* Main View Port - Hugs top directly under camera with ZERO top navbar obstruction */}
      <main className="flex-1 flex flex-col relative z-10">
        {currentMode === 'presentation' && (
          <PresentationView
            lines={lines}
            currentLineIndex={currentLineIndex}
            onLineChange={setCurrentLineIndex}
            isPlaying={isPlaying}
            onTogglePlay={handleTogglePlay}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onOpenConfig={() => setCurrentMode('config')}
          />
        )}

        {currentMode === 'preview' && (
          <PreviewView
            rawContent={rawScript}
            onRawContentChange={(newContent) => {
              setRawScript(newContent);
              setCurrentLineIndex(0);
            }}
            lines={lines}
            currentLineIndex={currentLineIndex}
            onSelectLine={(index) => {
              setCurrentLineIndex(index);
              setCurrentMode('presentation');
            }}
            onStartPresentation={() => {
              setCurrentMode('presentation');
              setIsPlaying(true);
            }}
            settings={settings}
          />
        )}

        {currentMode === 'config' && (
          <ConfigurationView
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onStartPresentation={() => {
              setCurrentMode('presentation');
            }}
          />
        )}
      </main>

      {/* Keypress Visual Feedback Toast */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-5 right-5 z-50 pointer-events-none transition-all duration-150"
        >
          <div className="px-3.5 py-1.5 rounded-xl bg-zinc-900/95 border border-zinc-700/90 text-white font-mono text-xs shadow-2xl backdrop-blur-md flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Global Navigation & Controls Bar - Pinned at the bottom around the focus of the app */}
      <BottomNav
        currentMode={currentMode}
        onModeChange={(mode) => {
          setCurrentMode(mode);
          if (mode !== 'presentation' && isPlaying) {
            setIsPlaying(false);
          }
        }}
        isPlaying={isPlaying}
        onTogglePlay={handleTogglePlay}
        currentLineIndex={currentLineIndex}
        totalLines={lines.length}
        remainingTimeSec={remainingTimeSec}
        onLineChange={setCurrentLineIndex}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        hasScript={lines.length > 0}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
      />

      {/* Shortcuts Help Modal */}
      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
}
