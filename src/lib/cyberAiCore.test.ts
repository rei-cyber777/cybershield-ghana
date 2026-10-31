import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CYBER_AI_MODELS,
  CYBER_AI_ROLES,
  buildCyberAiSystemInstruction,
  sanitizeChatHistoryForGemini,
  validateCyberAiRequest,
} from './cyberAiCore';

test('CYBER_AI_MODELS includes gemini-3.1-flash-lite, gemini-3.8-flash, and gemini-4-argon', () => {
  const modelIds = CYBER_AI_MODELS.map((m) => m.id);
  assert.deepEqual(modelIds, [
    'gemini-3.1-flash-lite',
    'gemini-3.8-flash',
    'gemini-4-argon',
  ]);
});

test('buildCyberAiSystemInstruction embeds Cyber AI identity and role-specific instructions', () => {
  for (const role of CYBER_AI_ROLES) {
    const instruction = buildCyberAiSystemInstruction(role.id);
    assert.ok(instruction.includes('You are Cyber AI'));
    assert.ok(instruction.includes('292'));
    assert.ok(instruction.includes(role.title));
  }
});

test('sanitizeChatHistoryForGemini strips leading model greeting and enforces alternating turns', () => {
  const rawHistory = [
    { role: 'model', text: 'Welcome to Cyber AI! How can I help?' },
    { role: 'user', text: 'Someone asked for my MoMo PIN.' },
    { role: 'model', text: 'Never share your MoMo PIN. That is a scam.' },
  ];

  const sanitized = sanitizeChatHistoryForGemini(rawHistory);
  assert.equal(sanitized.length, 2);
  assert.equal(sanitized[0].role, 'user');
  assert.equal(sanitized[0].parts[0].text, 'Someone asked for my MoMo PIN.');
  assert.equal(sanitized[1].role, 'model');
  assert.equal(sanitized[1].parts[0].text, 'Never share your MoMo PIN. That is a scam.');
});

test('validateCyberAiRequest validates message, model, role, and history', () => {
  const emptyResult = validateCyberAiRequest({ message: '   ' });
  assert.equal(emptyResult.ok, false);
  assert.ok(emptyResult.error);

  const validResult = validateCyberAiRequest({
    message: 'Is this scholarship message legitimate?',
    model: 'gemini-4-argon',
    role: 'student_advisor',
    history: [
      { role: 'user', text: 'Hi Cyber AI' },
      { role: 'model', text: 'Hello! Paste the scholarship message.' },
    ],
  });

  assert.equal(validResult.ok, true);
  assert.equal(validResult.model, 'gemini-4-argon');
  assert.equal(validResult.role, 'student_advisor');
  assert.equal(validResult.history.length, 2);
});
