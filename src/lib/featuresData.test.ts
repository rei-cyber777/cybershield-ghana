import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CORE_FEATURES,
  FEATURE_GROUPS,
  SECURITY_PILLARS_OVERVIEW,
  calculateMiniDemoRisk,
  computeExplorationProgress,
} from './featuresData';

test('contains 3 core security pillars with beginner-friendly bullet points', () => {
  assert.equal(SECURITY_PILLARS_OVERVIEW.length, 3);
  const ids = SECURITY_PILLARS_OVERVIEW.map((p) => p.id);
  assert.deepEqual(ids, ['threat-detection', 'encryption', 'access-control']);
  for (const pillar of SECURITY_PILLARS_OVERVIEW) {
    assert.ok(pillar.bulletPoints.length >= 3);
  }
});

test('contains exactly 8 core features split evenly across 2 groups', () => {
  assert.equal(FEATURE_GROUPS.length, 2);
  assert.equal(CORE_FEATURES.length, 8);

  const group1 = CORE_FEATURES.filter((f) => f.groupId === 'scam_protection');
  const group2 = CORE_FEATURES.filter((f) => f.groupId === 'privacy_security');
  assert.equal(group1.length, 4);
  assert.equal(group2.length, 4);
});

test('calculates illustrative mini-demo risk level from Low to High', () => {
  assert.deepEqual(calculateMiniDemoRisk([]), { score: 0, level: 'Low' });
  assert.deepEqual(calculateMiniDemoRisk(['chip-money-first']), {
    score: 35,
    level: 'Moderate',
  });
  assert.deepEqual(
    calculateMiniDemoRisk(['chip-money-first', 'chip-too-good', 'chip-pressure']),
    {
      score: 100,
      level: 'High',
    }
  );
});

test('tracks feature exploration progress accurately up to 8 of 8', () => {
  const partial = computeExplorationProgress([
    'feat-scam-checker',
    'feat-red-flag-detection',
    'feat-easy-reporting',
  ]);
  assert.equal(partial.exploredCount, 3);
  assert.equal(partial.totalCount, 8);
  assert.equal(partial.isComplete, false);

  const allIds = CORE_FEATURES.map((f) => f.id);
  const full = computeExplorationProgress(allIds);
  assert.equal(full.exploredCount, 8);
  assert.equal(full.percentage, 100);
  assert.equal(full.isComplete, true);
});
