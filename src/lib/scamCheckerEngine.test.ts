import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateScamRisk } from './scamCheckerEngine';

test('returns Low risk when no red flags or suspicious text are provided', () => {
  const result = evaluateScamRisk({ selectedFlagIds: [] });
  assert.equal(result.score, 0);
  assert.equal(result.riskLevel, 'Low');
  assert.equal(result.triggeredFlags.length, 0);
});

test('escalates to Critical immediately when MoMo PIN or OTP is requested', () => {
  const result = evaluateScamRisk({
    selectedFlagIds: ['momo_pin_or_otp'],
  });
  assert.equal(result.riskLevel, 'Critical');
  assert.ok(result.score >= 45);
  assert.equal(result.triggeredFlags[0].id, 'momo_pin_or_otp');
});

test('computes High or Critical risk when multiple flags are combined', () => {
  const result = evaluateScamRisk({
    selectedFlagIds: ['wrong_transfer_reversal', 'extreme_urgency_or_threat'],
  });
  assert.equal(result.score, 55);
  assert.equal(result.riskLevel, 'High');
  assert.equal(result.triggeredFlags.length, 2);
});

test('detects suspicious text heuristics in pasted messages and caps score at 100', () => {
  const result = evaluateScamRisk({
    selectedFlagIds: ['guaranteed_high_returns', 'scholarship_or_job_fee'],
    messageText:
      'Urgent action! Send your 4 digit PIN and processing fee to double your cash at bit.ly/fake-claim',
  });
  assert.equal(result.score, 100);
  assert.equal(result.riskLevel, 'Critical');
  assert.ok(result.detectedTextPatterns.length >= 3);
});
