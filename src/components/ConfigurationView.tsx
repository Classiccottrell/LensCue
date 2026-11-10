import React from 'react';
import {
  Sliders,
  Gauge,
  Type,
  Eye,
  Camera,
  Layers,
  ArrowRightLeft,
  Timer,
  Maximize2,
  Sparkles,
} from 'lucide-react';
import { PrompterSettings, VisibleLinesCount, PrompterWidth, FontSize } from '../types/prompter';

interface ConfigurationViewProps {
  settings: PrompterSettings;
  onUpdateSettings: (updates: Partial<PrompterSettings>) => void;
  onStartPresentation: () => void;
}

export const ConfigurationView: React.FC<ConfigurationViewProps> = ({
  settings,
  onUpdateSettings,
  onStartPresentation,
}) => {
  const pacePresets = [
    { label: 'Relaxed', wpm: 120, desc: 'Thoughtful pauses, storytelling' },
    { label: 'Conversational', wpm: 150, desc: 'Natural podcast & interview pace' },
    { label: 'Keynote', wpm: 180, desc: 'Dynamic tech presentations' },
    { label: 'Fast Pitch', wpm: 210, desc: 'Concise sales pitch or hook' },
    { label: 'Rapid', wpm: 260, desc: 'Fast-paced speed reading' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-10 pb-28 text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-zinc-400" />
            Teleprompter Configuration
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Customize visible text amount, camera notch width, and talking pace for natural delivery.
          </p>
        </div>

        <button
          type="button"
          onClick={onStartPresentation}
          className="px-4 py-2 text-xs font-semibold text-black bg-white hover:bg-zinc-200 rounded-lg transition-colors whitespace-nowrap shadow-sm self-start sm:self-auto"
        >
          Launch Presentation
        </button>
      </div>

      <div className="space-y-8 mt-6">
        {/* 1. Visible Text Amount (Show more or less text) */}
        <section className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800">
          <div className="flex items-center gap-2 mb-1">
            <Layers className="w-4 h-4 text-zinc-400" />
            <h2 className="text-base font-semibold text-white">Visible Text Amount</h2>
          </div>
          <p className="text-xs text-zinc-400 mb-4">
            Control how many lines appear simultaneously below your camera. 1 line offers maximum eye-contact focus.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {[
              { count: 1 as VisibleLinesCount, label: '1 Line', note: 'Max Eye Contact' },
              { count: 3 as VisibleLinesCount, label: '3 Lines', note: 'Balanced Triad' },
              { count: 5 as VisibleLinesCount, label: '5 Lines', note: 'Context Flow' },
              { count: 7 as VisibleLinesCount, label: '7 Lines', note: 'Extended' },
              { count: 99 as VisibleLinesCount, label: 'Continuous', note: 'Full Scroll' },
            ].map((option) => (
              <button
                key={option.count}
                type="button"
                onClick={() => onUpdateSettings({ visibleLinesCount: option.count })}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                  settings.visibleLinesCount === option.count
                    ? 'bg-zinc-800 border-white text-white shadow-lg'
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                }`}
              >
                <span className="text-sm font-bold block">{option.label}</span>
                <span className="text-[10px] text-zinc-500 block mt-0.5">{option.note}</span>
              </button>
            ))}
          </div>

          {/* Dim previous lines toggle */}
          <div className="mt-4 pt-4 border-t border-zinc-900 flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-zinc-300 block">Dim Previous Lines</span>
              <span className="text-[11px] text-zinc-500 block">
                Fades lines already spoken so your eye instinctively stays on the active sentence.
              </span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.dimPreviousLines}
              aria-label="Toggle Dim Previous Lines"
              onClick={() => onUpdateSettings({ dimPreviousLines: !settings.dimPreviousLines })}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                settings.dimPreviousLines ? 'bg-white' : 'bg-zinc-800'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full transition-transform ${
                  settings.dimPreviousLines ? 'translate-x-5 bg-black' : 'translate-x-0 bg-zinc-500'
                }`}
              />
            </button>
          </div>
        </section>

        {/* 2. Talking Pace (WPM) */}
        <section className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-zinc-400" />
              <h2 className="text-base font-semibold text-white">Talking Pace</h2>
            </div>
            <span className="text-lg font-bold font-mono text-white tabular-nums">
              {settings.wpm} <span className="text-xs text-zinc-500 font-normal">WPM</span>
            </span>
          </div>
          <p className="text-xs text-zinc-400 mb-4">
            Adjust how fast or slow the teleprompter guides you through each sentence.
          </p>

          {/* Slider */}
          <div className="space-y-2 mb-4">
            <input
              type="range"
              min={80}
              max={300}
              step={5}
              value={settings.wpm}
              onChange={(e) => onUpdateSettings({ wpm: parseInt(e.target.value, 10) })}
              className="w-full accent-white h-2 bg-zinc-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[11px] font-mono text-zinc-500">
              <span>80 WPM (Slow)</span>
              <span>150 WPM (Average)</span>
              <span>300 WPM (Brisk)</span>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {pacePresets.map((preset) => (
              <button
                key={preset.wpm}
                type="button"
                onClick={() => onUpdateSettings({ wpm: preset.wpm })}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  settings.wpm === preset.wpm
                    ? 'bg-zinc-800 border-zinc-500 text-white shadow-sm'
                    : 'bg-zinc-900/40 border-zinc-800/80 text-zinc-400 hover:text-white hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">{preset.label}</span>
                  <span className="text-[10px] font-mono text-zinc-400">{preset.wpm}</span>
                </div>
                <span className="text-[10px] text-zinc-500 line-clamp-1 mt-0.5">{preset.desc}</span>
              </button>
            ))}
          </div>
        </section>

        {/* 3. Camera Hugging & Viewport Geometry */}
        <section className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800">
          <div className="flex items-center gap-2 mb-1">
            <Camera className="w-4 h-4 text-zinc-400" />
            <h2 className="text-base font-semibold text-white">Camera Notch & Screen Placement</h2>
          </div>
          <p className="text-xs text-zinc-400 mb-4">
            Narrow layouts keep your gaze centered directly underneath your webcam lens.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
            {[
              { id: 'narrow' as PrompterWidth, label: 'Narrow Notch (~440px)', sub: 'Keeps eyes locked on lens' },
              { id: 'medium' as PrompterWidth, label: 'Medium (~580px)', sub: 'Comfortable balance' },
              { id: 'wide' as PrompterWidth, label: 'Wide (~780px)', sub: 'Tablet & desktop' },
              { id: 'full' as PrompterWidth, label: 'Full Width', sub: 'Spans full window' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onUpdateSettings({ prompterWidth: item.id })}
                className={`p-3 rounded-xl border text-left transition-all ${
                  settings.prompterWidth === item.id
                    ? 'bg-zinc-800 border-white text-white shadow-lg'
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                }`}
              >
                <span className="text-xs font-bold block">{item.label}</span>
                <span className="text-[10px] text-zinc-500 block mt-0.5">{item.sub}</span>
              </button>
            ))}
          </div>

          <div className="space-y-3 pt-3 border-t border-zinc-900">
            {/* Camera Notch Guide Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-zinc-300 block">Top Camera Notch Guide</span>
                <span className="text-[11px] text-zinc-500 block">
                  Renders a subtle lens alignment indicator at the very top center of your screen.
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.showCameraNotchGuide}
                aria-label="Toggle Camera Notch Guide"
                onClick={() =>
                  onUpdateSettings({ showCameraNotchGuide: !settings.showCameraNotchGuide })
                }
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  settings.showCameraNotchGuide ? 'bg-white' : 'bg-zinc-800'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full transition-transform ${
                    settings.showCameraNotchGuide ? 'translate-x-5 bg-black' : 'translate-x-0 bg-zinc-500'
                  }`}
                />
              </button>
            </div>

            {/* Webcam Live Preview Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-zinc-300 block">Live Webcam Feed Behind Text</span>
                <span className="text-[11px] text-zinc-500 block">
                  Project your own webcam feed behind the text to verify eye contact during rehearsal.
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.showWebcamPreview}
                aria-label="Toggle Live Webcam Feed"
                onClick={() =>
                  onUpdateSettings({ showWebcamPreview: !settings.showWebcamPreview })
                }
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  settings.showWebcamPreview ? 'bg-white' : 'bg-zinc-800'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full transition-transform ${
                    settings.showWebcamPreview ? 'translate-x-5 bg-black' : 'translate-x-0 bg-zinc-500'
                  }`}
                />
              </button>
            </div>
          </div>
        </section>

        {/* 4. Typography Scale & Mirroring */}
        <section className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800">
          <div className="flex items-center gap-2 mb-1">
            <Type className="w-4 h-4 text-zinc-400" />
            <h2 className="text-base font-semibold text-white">Typography & Alignment</h2>
          </div>
          <p className="text-xs text-zinc-400 mb-4">
            Select high-contrast text size for reading distance (seated vs standing).
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mb-4">
            {[
              { id: 'sm' as FontSize, label: 'Small', size: '24px' },
              { id: 'md' as FontSize, label: 'Medium', size: '30px' },
              { id: 'lg' as FontSize, label: 'Large', size: '36px' },
              { id: 'xl' as FontSize, label: 'X-Large', size: '44px' },
              { id: '2xl' as FontSize, label: 'Giant', size: '56px' },
            ].map((font) => (
              <button
                key={font.id}
                type="button"
                onClick={() => onUpdateSettings({ fontSize: font.id })}
                className={`p-3 rounded-xl border text-center transition-all ${
                  settings.fontSize === font.id
                    ? 'bg-zinc-800 border-white text-white shadow-lg'
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                }`}
              >
                <span className="text-xs font-bold block">{font.label}</span>
                <span className="text-[10px] text-zinc-500 block mt-0.5">{font.size}</span>
              </button>
            ))}
          </div>

          <div className="space-y-3 pt-3 border-t border-zinc-900">
            {/* Mirror / Flip mode */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-zinc-300 block">Mirror Text (Horizontal Flip)</span>
                <span className="text-[11px] text-zinc-500 block">
                  Flips text for reflection when using physical beam-splitter teleprompter glass rigs.
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.isMirrored}
                aria-label="Toggle Mirror Text"
                onClick={() => onUpdateSettings({ isMirrored: !settings.isMirrored })}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  settings.isMirrored ? 'bg-white' : 'bg-zinc-800'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full transition-transform ${
                    settings.isMirrored ? 'translate-x-5 bg-black' : 'translate-x-0 bg-zinc-500'
                  }`}
                />
              </button>
            </div>

            {/* Countdown Duration */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-zinc-300 block">Start Countdown</span>
                <span className="text-[11px] text-zinc-500 block">
                  Gives you a few seconds to fix your gaze on the camera before speech begins.
                </span>
              </div>
              <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                {[0, 3, 5].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => onUpdateSettings({ countdownDuration: sec })}
                    className={`px-2.5 py-1 text-xs rounded font-mono ${
                      settings.countdownDuration === sec
                        ? 'bg-zinc-800 text-white font-semibold'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {sec === 0 ? 'Off' : `${sec}s`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
