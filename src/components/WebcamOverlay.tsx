import React, { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, AlertCircle } from 'lucide-react';

interface WebcamOverlayProps {
  enabled: boolean;
  opacity: number;
  isMirrored: boolean;
}

export const WebcamOverlay: React.FC<WebcamOverlayProps> = ({
  enabled,
  opacity,
  isMirrored,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    let active = true;

    if (!enabled) {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }
      return;
    }

    async function startCamera() {
      setIsStarting(true);
      setError(null);
      try {
        const userStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user',
          },
          audio: false,
        });

        if (!active) {
          userStream.getTracks().forEach((t) => t.stop());
          return;
        }

        setStream(userStream);
        if (videoRef.current) {
          videoRef.current.srcObject = userStream;
          videoRef.current.play().catch(() => {});
        }
      } catch (err: any) {
        if (!active) return;
        setError(err?.message || 'Unable to access webcam. Please check permissions.');
      } finally {
        if (active) setIsStarting(false);
      }
    }

    startCamera();

    return () => {
      active = false;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [enabled]);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  }, [stream]);

  if (!enabled) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center overflow-hidden"
      aria-hidden="true"
    >
      {error ? (
        <div className="absolute top-16 right-4 p-3 bg-red-950/80 border border-red-800/80 rounded-lg text-red-200 text-xs flex items-center gap-2 max-w-xs shadow-lg backdrop-blur-md">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>Camera notice: {error}</span>
        </div>
      ) : isStarting ? (
        <div className="absolute top-16 right-4 p-2 bg-zinc-900/80 border border-zinc-800 rounded-lg text-zinc-400 text-xs flex items-center gap-2 backdrop-blur-md">
          <Camera className="w-3.5 h-3.5 animate-spin" />
          <span>Starting camera feed...</span>
        </div>
      ) : null}

      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          opacity: opacity,
          transform: isMirrored ? 'scaleX(-1)' : 'none',
        }}
        className="w-full h-full object-cover filter contrast-125 brightness-75 select-none transition-opacity duration-300"
      />
    </div>
  );
};
