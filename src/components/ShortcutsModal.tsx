import React from 'react';
import { X, Keyboard, Command } from 'lucide-react';
import { SHORTCUTS_LIST } from '../utils/shortcuts';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const categories = [
    { id: 'playback', title: 'Playback & Pacing' },
    { id: 'navigation', title: 'Line Navigation' },
    { id: 'display', title: 'Display & Glass Optics' },
    { id: 'view', title: 'General & View' },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl p-6 text-white max-h-[85vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center">
              <Keyboard className="w-4 h-4 text-zinc-300" />
            </div>
            <div>
              <h2 id="shortcuts-title" className="text-base font-bold text-white">
                Presenter Keyboard Shortcuts
              </h2>
              <p className="text-xs text-zinc-400">
                Control LensCue effortlessly without touching your mouse or trackpad.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
            aria-label="Close shortcuts modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-5">
          {categories.map((cat) => {
            const items = SHORTCUTS_LIST.filter((s) => s.category === cat.id);
            if (items.length === 0) return null;

            return (
              <div key={cat.id}>
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2.5">
                  {cat.title}
                </h3>
                <div className="space-y-1.5">
                  {items.map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-zinc-900/40 border border-zinc-800/60"
                    >
                      <span className="text-xs text-zinc-300">{item.description}</span>
                      <kbd className="px-2 py-1 text-xs font-mono font-semibold bg-zinc-900 border border-zinc-700 rounded-md text-white shadow-sm">
                        {item.label}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 pt-4 border-t border-zinc-900 flex items-center justify-between text-xs text-zinc-500">
          <span>Press <kbd className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 font-mono text-[11px] text-zinc-400">Esc</kbd> anytime to close</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 bg-white text-black font-semibold rounded-lg hover:bg-zinc-200 transition-colors text-xs"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
