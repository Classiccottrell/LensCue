import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractWordCount,
  calculateLineDuration,
  parseScript,
  calculateTotalDuration,
  calculateTotalWords,
  formatTime,
} from './scriptParser';

test('extractWordCount correctly counts words and strips markdown', () => {
  assert.equal(extractWordCount('Hello world'), 2);
  assert.equal(extractWordCount('**Bold statement** with *italic* words'), 5);
  assert.equal(extractWordCount(''), 0);
  assert.equal(extractWordCount('   # Title with   spaces   '), 3);
});

test('calculateLineDuration computes realistic duration with punctuation', () => {
  // At 150 WPM, 1 word = 0.4s
  // 5 words without punctuation = 5 * 0.4 = 2.0s
  const durationSimple = calculateLineDuration('one two three four five', 150);
  assert.equal(durationSimple, 2.0);

  // With a period at the end: 2.0 + 0.35 = 2.35 -> rounded to 2.4
  const durationPunct = calculateLineDuration('one two three four five.', 150);
  assert.equal(durationPunct, 2.4);

  // Minimum duration check for short words
  const durationShort = calculateLineDuration('Hi', 150);
  assert.ok(durationShort >= 1.0);
});

test('parseScript parses headings, cues, pauses, bullets, and plain text', () => {
  const markdown = `
# Main Header

[SMILE AND BREATHE]

[PAUSE 2.5s]

- First bullet point of talk.
- Second bullet point.

Here is regular speech text with great enthusiasm!
`;

  const lines = parseScript(markdown, 150);
  assert.equal(lines.length, 6);

  assert.equal(lines[0].type, 'heading');
  assert.equal(lines[0].text, 'Main Header');
  assert.equal(lines[0].level, 1);

  assert.equal(lines[1].type, 'cue');
  assert.equal(lines[1].cueNote, 'SMILE AND BREATHE');

  assert.equal(lines[2].type, 'pause');
  assert.equal(lines[2].pauseDuration, 2.5);
  assert.equal(lines[2].durationSec, 2.5);

  assert.equal(lines[3].type, 'bullet');
  assert.equal(lines[3].text, 'First bullet point of talk.');

  assert.equal(lines[4].type, 'bullet');
  assert.equal(lines[4].text, 'Second bullet point.');

  assert.equal(lines[5].type, 'text');
  assert.equal(lines[5].text, 'Here is regular speech text with great enthusiasm!');
});

test('formatTime formats seconds cleanly into MM:SS or HH:MM:SS', () => {
  assert.equal(formatTime(0), '00:00');
  assert.equal(formatTime(65), '01:05');
  assert.equal(formatTime(3665), '1:01:05');
});

test('calculateTotalWords and calculateTotalDuration sum accurately', () => {
  const content = `Line one has four words.
Line two has four words.`;
  const lines = parseScript(content, 150);
  assert.equal(calculateTotalWords(lines), 10);
  const totalDuration = calculateTotalDuration(lines);
  assert.ok(totalDuration > 0);
});
