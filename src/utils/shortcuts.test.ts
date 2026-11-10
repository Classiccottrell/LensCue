import test from 'node:test';
import assert from 'node:assert/strict';
import { SHORTCUTS_LIST, isTextInputElement } from './shortcuts';

test('SHORTCUTS_LIST contains essential presenter keys', () => {
  const keys = SHORTCUTS_LIST.map((s) => s.key);
  assert.ok(keys.includes('Space'));
  assert.ok(keys.includes('ArrowDown'));
  assert.ok(keys.includes('ArrowUp'));
  assert.ok(keys.includes('Equal'));
  assert.ok(keys.includes('Minus'));
  assert.ok(keys.includes('KeyF'));
  assert.ok(keys.includes('KeyM'));
  assert.ok(keys.includes('KeyR'));
});

test('isTextInputElement handles null and non-elements safely', () => {
  assert.equal(isTextInputElement(null), false);
  assert.equal(isTextInputElement(undefined as any), false);
});
