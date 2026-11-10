import React from 'react';
import { Camera } from 'lucide-react';

interface CameraNotchGuideProps {
  showGuide: boolean;
  isMirrored?: boolean;
}

export const CameraNotchGuide: React.FC<CameraNotchGuideProps> = ({ showGuide }) => {
  if (!showGuide) return null;

  return (
    <div
      className="fixed top-0 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center pointer-events-none select-none"
      aria-hidden="true"
    >
      {/* Physical lens anchor simulation */}
      <div className="flex items-center gap-1.5 bg-black/95 px-3 py-1 rounded-b-lg border-x border-b border-zinc-800 shadow-[0_4px_12px_rgba(0,0,0,0.8)] backdrop-blur-md">
        <div className="relative flex items-center justify-center w-3.5 h-3.5 rounded-full bg-zinc-950 border border-zinc-700">
          <div className="w-1.5 h-1.5 rounded-full bg-sky-500/80 shadow-[0_0_6px_rgba(14,165,233,0.8)]" />
        </div>
        <span className="text-[9px] font-mono tracking-wider uppercase text-zinc-400 font-semibold">
          Camera Lens
        </span>
      </div>
      <div className="w-0.5 h-1.5 bg-gradient-to-b from-zinc-700 to-transparent" />
    </div>
  );
};
