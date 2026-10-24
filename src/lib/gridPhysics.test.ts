import test from 'node:test';
import assert from 'node:assert/strict';
import { computeGridFrameResponse } from './gridPhysics';

test('returns neutral transform when cursor is null or outside radius', () => {
  assert.deepEqual(computeGridFrameResponse(100, 100, null, null), {
    offsetX: 0,
    offsetY: 0,
    scale: 1,
    intensity: 0,
  });

  assert.deepEqual(computeGridFrameResponse(100, 100, 500, 500, 220), {
    offsetX: 0,
    offsetY: 0,
    scale: 1,
    intensity: 0,
  });
});

test('displaces and scales grid frames when cursor hovers nearby', () => {
  const response = computeGridFrameResponse(160, 100, 100, 100, 220, 12);
  assert.ok(response.intensity > 0.5, 'intensity should be high near cursor');
  assert.ok(response.offsetX > 0, 'frame to the right of cursor should shift along +X');
  assert.equal(response.offsetY, 0);
  assert.ok(response.scale > 1.05, 'frame near cursor should scale up');
});

test('reaches maximum glow intensity directly under the cursor', () => {
  const center = computeGridFrameResponse(200, 200, 200, 200, 220, 12);
  assert.equal(center.intensity, 1);
  assert.equal(center.scale, 1.14);
});
