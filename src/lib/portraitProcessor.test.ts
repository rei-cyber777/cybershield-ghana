import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  convertPixelToStudioMonochrome,
  processImageDataToMonochrome,
} from './portraitProcessor';

test('converts warm skin-tone and shirt pixels to pure grayscale (R === G === B)', () => {
  const skinPx = convertPixelToStudioMonochrome(162, 108, 78, 255, true);
  assert.equal(skinPx.r, skinPx.g);
  assert.equal(skinPx.g, skinPx.b);
  assert.equal(skinPx.a, 255);
  assert.ok(skinPx.r > 80 && skinPx.r < 160);
});

test('keys out bright chroma-green background pixels while keeping grayscale channels equal', () => {
  const greenScreenPx = convertPixelToStudioMonochrome(10, 252, 12, 255, true);
  assert.equal(greenScreenPx.r, greenScreenPx.g);
  assert.equal(greenScreenPx.g, greenScreenPx.b);
  assert.equal(greenScreenPx.a, 0);
});

test('retains full opacity in classic black-and-white mode when removeGreenScreen is false', () => {
  const buffer = new Uint8ClampedArray([10, 252, 12, 255, 180, 120, 95, 255]);
  processImageDataToMonochrome(buffer, false);
  assert.equal(buffer[0], buffer[1]);
  assert.equal(buffer[1], buffer[2]);
  assert.equal(buffer[3], 255);
  assert.equal(buffer[4], buffer[5]);
  assert.equal(buffer[5], buffer[6]);
  assert.equal(buffer[7], 255);
});
