import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildSubscriberInsertPayload,
  classifySupabaseSubscriberError,
} from './supabaseNewsletter';
import { getSupabaseEnvConfig } from './supabaseClient';

test('buildSubscriberInsertPayload writes ONLY email and interests columns', () => {
  const res = buildSubscriberInsertPayload('  Reindolf@Example.com ', 'Cybersecurity & Ghana Scam Alerts');
  assert.equal(res.ok, true);
  if (res.ok) {
    assert.deepEqual(Object.keys(res.payload).sort(), ['email', 'interests']);
    assert.equal(res.payload.email, 'reindolf@example.com');
    assert.equal(res.payload.interests, 'Cybersecurity & Ghana Scam Alerts');
  }
});

test('buildSubscriberInsertPayload rejects invalid email addresses clearly', () => {
  const res = buildSubscriberInsertPayload('not-an-email', 'Global Tech & AI News');
  assert.equal(res.ok, false);
  if (!res.ok) {
    assert.equal(res.error.kind, 'invalid_email');
    assert.ok(res.error.userMessage.includes('valid email address'));
  }
});

test('classifySupabaseSubscriberError maps Postgres 23505 to duplicate_email message', () => {
  const classified = classifySupabaseSubscriberError({
    code: '23505',
    message: 'duplicate key value violates unique constraint "subscribers_email_key"',
    details: 'Key (email)=(student@ug.edu.gh) already exists.',
  });
  assert.equal(classified.kind, 'duplicate_email');
  assert.equal(
    classified.userMessage,
    'This email address is already subscribed to CyberShield Ghana updates.'
  );
});

test('classifySupabaseSubscriberError maps TypeError Failed to fetch to network_failure', () => {
  const err = new TypeError('Failed to fetch');
  const classified = classifySupabaseSubscriberError(err);
  assert.equal(classified.kind, 'network_failure');
  assert.ok(classified.userMessage.includes('Network error'));
});

test('getSupabaseEnvConfig reads NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://rtkbfrvlvwtyinmfvyvs.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY =
    'sb_publishable_ncN6cv7CqjBYxZ4I1WpK3A_VCVLpfG1';
  const cfg = getSupabaseEnvConfig();
  assert.equal(cfg.isConfigured, true);
  assert.equal(cfg.supabaseUrl, 'https://rtkbfrvlvwtyinmfvyvs.supabase.co');
  assert.equal(cfg.supabaseAnonKey, 'sb_publishable_ncN6cv7CqjBYxZ4I1WpK3A_VCVLpfG1');
});

