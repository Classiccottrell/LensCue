export type LineType = 'text' | 'heading' | 'cue' | 'pause' | 'bullet';

export interface ScriptLine {
  id: string;
  text: string;
  raw: string;
  type: LineType;
  level?: number;
  wordCount: number;
  durationSec: number;
  pauseDuration?: number;
  cueNote?: string;
}

export type PrompterWidth = 'narrow' | 'medium' | 'wide' | 'full';
export type VisibleLinesCount = 1 | 3 | 5 | 7 | 99; // 99 represents continuous scroll
export type FontSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type AppMode = 'presentation' | 'preview' | 'config';

export interface PrompterSettings {
  wpm: number;
  visibleLinesCount: VisibleLinesCount;
  prompterWidth: PrompterWidth;
  fontSize: FontSize;
  align: 'center' | 'left';
  isMirrored: boolean;
  showCameraNotchGuide: boolean;
  showWebcamPreview: boolean;
  webcamOpacity: number; // 0.1 to 0.8
  countdownDuration: number; // 0, 3, 5
  dimPreviousLines: boolean;
  highlightCurrentLine: boolean;
  voiceFollowEnabled: boolean;
  autoAdvance: boolean;
}

export interface SampleScript {
  id: string;
  title: string;
  description: string;
  content: string;
}
