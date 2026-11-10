export interface ShortcutDefinition {
  key: string;
  label: string;
  description: string;
  category: 'playback' | 'navigation' | 'display' | 'view';
}

export const SHORTCUTS_LIST: ShortcutDefinition[] = [
  {
    key: 'Space',
    label: 'Space',
    description: 'Play / Pause prompter',
    category: 'playback',
  },
  {
    key: 'ArrowDown',
    label: '↓ or →',
    description: 'Advance to next line',
    category: 'navigation',
  },
  {
    key: 'ArrowUp',
    label: '↑ or ←',
    description: 'Go to previous line',
    category: 'navigation',
  },
  {
    key: 'Equal',
    label: '+ / =',
    description: 'Increase talking pace (+10 WPM)',
    category: 'playback',
  },
  {
    key: 'Minus',
    label: '- / _',
    description: 'Decrease talking pace (-10 WPM)',
    category: 'playback',
  },
  {
    key: 'KeyR',
    label: 'R / Home',
    description: 'Restart script from line 1',
    category: 'navigation',
  },
  {
    key: 'KeyF',
    label: 'F',
    description: 'Toggle Fullscreen mode',
    category: 'display',
  },
  {
    key: 'KeyM',
    label: 'M',
    description: 'Toggle Mirror mode (for teleprompter glass)',
    category: 'display',
  },
  {
    key: 'KeyL',
    label: 'L',
    description: 'Cycle visible lines (1 Line / 3 Lines / 5 Lines)',
    category: 'display',
  },
  {
    key: 'KeyC',
    label: 'C',
    description: 'Toggle Camera Notch Guide',
    category: 'display',
  },
  {
    key: 'KeyW',
    label: 'W',
    description: 'Toggle live Webcam mirror',
    category: 'display',
  },
  {
    key: 'KeyA',
    label: 'A',
    description: 'Toggle AI Script Doctor coach',
    category: 'view',
  },
  {
    key: 'Slash',
    label: '? / H',
    description: 'Toggle keyboard shortcuts help',
    category: 'view',
  },
  {
    key: 'Escape',
    label: 'Esc',
    description: 'Pause playback or close dialogs',
    category: 'view',
  },
];

/**
 * Checks if the event target is an active text input or editable element.
 */
export function isTextInputElement(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) {
    return false;
  }
  const tagName = target.tagName.toLowerCase();
  if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
    return true;
  }
  if (target.isContentEditable) {
    return true;
  }
  return false;
}
