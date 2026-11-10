import { ScriptLine, LineType, SampleScript } from '../types/prompter';

/**
 * Extracts clean words from a text string.
 */
export function extractWordCount(text: string): number {
  if (!text) return 0;
  // Remove markdown formatting like **bold**, *italic*, `code`, #, etc.
  const clean = text
    .replace(/[#*`_~\[\]()]/g, ' ')
    .trim();
  if (!clean) return 0;
  const words = clean.split(/\s+/).filter(Boolean);
  return words.length;
}

/**
 * Calculates line duration in seconds based on word count, punctuation, and WPM.
 */
export function calculateLineDuration(text: string, wpm: number, pauseSec: number = 0): number {
  if (pauseSec > 0) return pauseSec;
  const words = extractWordCount(text);
  if (words === 0) return 1.5; // Baseline pause for empty/transition lines

  // Baseline time per word in seconds
  const secondsPerWord = 60 / Math.max(60, wpm);
  let duration = words * secondsPerWord;

  // Natural punctuation pauses:
  // Periods, exclamation marks, question marks add ~0.35s
  // Commas, colons, semicolons, em-dashes add ~0.15s
  const endPunctuation = (text.match(/[.!?](\s|$)/g) || []).length;
  const midPunctuation = (text.match(/[,;:\u2014-](\s|$)/g) || []).length;

  duration += endPunctuation * 0.35;
  duration += midPunctuation * 0.15;

  // Minimum line duration is at least 1.0 second so it's readable
  return Math.max(1.0, Math.round(duration * 10) / 10);
}

/**
 * Parses raw script text (plain text or markdown) into structured ScriptLine objects.
 */
export function parseScript(content: string, wpm: number = 150): ScriptLine[] {
  if (!content || !content.trim()) {
    return [];
  }

  const rawLines = content.split(/\r?\n/);
  const result: ScriptLine[] = [];
  let lineIndex = 0;

  for (let i = 0; i < rawLines.length; i++) {
    const raw = rawLines[i];
    const trimmed = raw.trim();

    // Skip empty lines if previous was already empty, but preserve paragraph breathers
    if (!trimmed) {
      continue;
    }

    // Check for explicit pause directive e.g. [pause 3s] or (pause 2) or [pause]
    const pauseMatch = trimmed.match(/^\[(?:pause|wait)\s*(\d+(?:\.\d+)?)?s?\]/i) ||
                       trimmed.match(/^\((?:pause|wait)\s*(\d+(?:\.\d+)?)?s?\)/i);

    if (pauseMatch) {
      const sec = pauseMatch[1] ? parseFloat(pauseMatch[1]) : 2.0;
      result.push({
        id: `line-${lineIndex++}`,
        text: `[PAUSE ${sec}s]`,
        raw,
        type: 'pause',
        wordCount: 0,
        durationSec: sec,
        pauseDuration: sec,
        cueNote: `Pause speech for ${sec} seconds`,
      });
      continue;
    }

    // Check for stage cue directive e.g. [SMILE], [LOOK AT CAMERA], [SHOW SLIDE 3], (b-roll)
    const cueMatch = trimmed.match(/^\[(.*?)\]$/) || trimmed.match(/^\((.*?)\)$/);
    if (cueMatch && !trimmed.startsWith('[http')) {
      result.push({
        id: `line-${lineIndex++}`,
        text: trimmed,
        raw,
        type: 'cue',
        wordCount: 0,
        durationSec: 1.5,
        cueNote: cueMatch[1].trim(),
      });
      continue;
    }

    // Check for markdown heading: # Heading 1, ## Heading 2, etc.
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const cleanText = headingMatch[2].trim();
      const words = extractWordCount(cleanText);
      result.push({
        id: `line-${lineIndex++}`,
        text: cleanText,
        raw,
        type: 'heading',
        level,
        wordCount: words,
        durationSec: calculateLineDuration(cleanText, wpm) + 0.5, // Extra pause after heading
      });
      continue;
    }

    // Check for list bullet: - Item, * Item, 1. Item
    const bulletMatch = trimmed.match(/^([*\-+]|\d+\.)\s+(.*)$/);
    if (bulletMatch) {
      const cleanText = bulletMatch[2].trim();
      const words = extractWordCount(cleanText);
      result.push({
        id: `line-${lineIndex++}`,
        text: cleanText,
        raw,
        type: 'bullet',
        wordCount: words,
        durationSec: calculateLineDuration(cleanText, wpm),
      });
      continue;
    }

    // Standard speech text line
    // Strip bold/italics markers for clean display but keep readability
    const cleanText = trimmed
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/__(.*?)__/g, '$1')
      .replace(/_(.*?)_/g, '$1');

    const words = extractWordCount(cleanText);

    result.push({
      id: `line-${lineIndex++}`,
      text: cleanText,
      raw,
      type: 'text',
      wordCount: words,
      durationSec: calculateLineDuration(cleanText, wpm),
    });
  }

  return result;
}

/**
 * Calculates total estimated duration in seconds for all lines.
 */
export function calculateTotalDuration(lines: ScriptLine[]): number {
  return lines.reduce((total, line) => total + line.durationSec, 0);
}

/**
 * Calculates total word count for all speech lines.
 */
export function calculateTotalWords(lines: ScriptLine[]): number {
  return lines.reduce((total, line) => total + line.wordCount, 0);
}

/**
 * Formats a duration in seconds into MM:SS or HH:MM:SS.
 */
export function formatTime(seconds: number): string {
  const rounded = Math.max(0, Math.round(seconds));
  const hrs = Math.floor(rounded / 3600);
  const mins = Math.floor((rounded % 3600) / 60);
  const secs = rounded % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (hrs > 0) {
    return `${hrs}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
}

/**
 * Preloaded high-quality sample scripts.
 */
export const SAMPLE_SCRIPTS: SampleScript[] = [
  {
    id: 'product-keynote',
    title: 'Product Launch Keynote',
    description: 'Crisp, high-energy presentation script with cues and section headers.',
    content: `# Welcome to LensCue

[SMILE AND MAKE DIRECT EYE CONTACT]
Thank you everyone for joining us today.

For the past twelve months, our team asked one simple question:
Why does reading a script on video feel so unnatural?

[PAUSE 1.5s]

When your eyes dart back and forth across a screen,
your audience immediately senses the detachment.

They lose that spark of genuine connection.

[LOOK RIGHT INTO THE LENS]
That changes today.

With LensCue, your words sit directly below the camera lens.
Your gaze never wavers.

You're not just reciting text;
you are speaking directly to one person.

## The Three Core Modes

First, we designed Presentation Mode.
Pure black background. Ultra-crisp white text.
Zero distraction, zero clutter.

Second, Preview Mode lets you rehearse, jump lines,
and calculate your exact speaking duration down to the second.

And third, Configuration Mode puts total control in your hands:
Adjust your visible lines from a single laser-focused line
to a comfortable three-line window.

[PAUSE 2s]

Speed up or slow down your talking pace with a single tap.

Let's begin your first take.`,
  },
  {
    id: 'youtube-hook',
    title: 'YouTube Video Intro & Hook',
    description: 'Fast-paced, hook-driven intro script for content creators.',
    content: `# The 3-Second Rule

[HIGH ENERGY - LEAN IN SLIGHTLY]
If you lose your viewer in the first three seconds,
the algorithm won't save your video.

Here is the exact framework we used to double our retention.

[PAUSE 1s]

Point number one: Never start with a generic greeting.
Skip "Hey guys, welcome back to the channel."

Instead, jump straight into the burning problem.

[SHOW GRAPHIC ON SCREEN]
Show what they are missing out on.

Point number two: Deliver the first micro-win within thirty seconds.

And point number three: Maintain unwavering eye contact.

[SMILE]
When you look right down the barrel of the camera,
your authority increases instantly.

Let's break down the step-by-step breakdown.`,
  },
  {
    id: 'investor-pitch',
    title: '60-Second Investor Pitch',
    description: 'Concise executive summary pitch for founders.',
    content: `# The Executive Pitch

Good morning. My name is Alex, and I am the founder of LensCue.

Over 100 million video calls and presentations happen every single day.
Yet more than 80% of presenters struggle to maintain eye contact
while referencing their key talking points.

[PAUSE 1.5s]

Current teleprompters force wide eye travel,
making speakers look distracted and unprepared.

Our solution is a lightweight, camera-hugging teleprompter
that positions the active sentence directly below the camera notch.

In our closed beta with 400 executive users:
Confidence ratings increased by 44%,
and speech delivery pace stabilized within target cadence.

We are raising $1.5 million to scale desktop and mobile distribution.

We would love to welcome you to our journey.`,
  },
  {
    id: 'podcast-sponsor',
    title: 'Podcast Mid-Roll Sponsor Read',
    description: 'Natural conversational sponsor read with timing pauses.',
    content: `# Sponsor Break: Artisan Coffee

[CASUAL AND AUTHENTIC TONE]
Today's episode is brought to you by Artisan Coffee Roasters.

Now, you all know how much coffee powers our recording sessions here.
Most mornings, I brew a fresh pour-over before we hit record.

[PAUSE 1.5s]

What I love about Artisan is that they roast their beans to order
and ship them within 24 hours of roasting.

The flavor difference is immediately noticeable.
It's smooth, low acidity, with notes of dark chocolate and hazelnut.

Right now, our listeners can get 20% off their first order.
Just visit artisancoffee.com slash lenscue and use code LENSCUE at checkout.

[PAUSE 1s]

That's code LENSCUE for 20% off.
Now, back to the show.`,
  },
];
