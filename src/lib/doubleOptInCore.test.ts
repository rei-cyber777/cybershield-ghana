import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  NEUTRAL_SUBSCRIBE_MESSAGE,
  buildConfirmationEmail,
  buildDigestEmail,
  checkServerIpRateLimit,
  generateSecureToken,
  isValidHexToken,
  resetServerIpRateLimits,
  validateSubscribeInput,
} from './doubleOptInCore';

test('validateSubscribeInput normalizes valid email and flags honeypot silently', () => {
  const valid = validateSubscribeInput({
    email: '  Student@UG.edu.gh ',
    interests: 'Cybersecurity & Ghana Scam Alerts',
    honeypot: '',
  });
  assert.equal(valid.ok, true);
  if (valid.ok) {
    assert.equal(valid.data.email, 'student@ug.edu.gh');
    assert.equal(valid.data.isHoneypotTriggered, false);
  }

  const bot = validateSubscribeInput({
    email: 'bot@spam.com',
    honeypot: 'http://spam-link.example',
  });
  assert.equal(bot.ok, true);
  if (bot.ok) {
    assert.equal(bot.data.isHoneypotTriggered, true);
  }

  const invalid = validateSubscribeInput({ email: 'not-an-email' });
  assert.equal(invalid.ok, false);
});

test('generateSecureToken produces 48-char hex tokens accepted by isValidHexToken', () => {
  const t1 = generateSecureToken();
  const t2 = generateSecureToken();
  assert.equal(t1.length, 48);
  assert.notEqual(t1, t2);
  assert.equal(isValidHexToken(t1), true);
  assert.equal(isValidHexToken('short'), false);
  assert.equal(isValidHexToken('not-hex-zzz!!'), false);
});

test('checkServerIpRateLimit enforces per-IP sliding window limit', () => {
  resetServerIpRateLimits();
  const now = 1_700_000_000_000;
  for (let i = 0; i < 5; i++) {
    const res = checkServerIpRateLimit('203.0.113.9', 5, 60_000, now + i * 100);
    assert.equal(res.allowed, true);
  }
  const blocked = checkServerIpRateLimit('203.0.113.9', 5, 60_000, now + 1000);
  assert.equal(blocked.allowed, false);
  assert.ok(blocked.retryAfterSeconds > 0);
});

test('buildConfirmationEmail and buildDigestEmail include confirm link, sender identity, and unsubscribe link in HTML and text', () => {
  assert.equal(NEUTRAL_SUBSCRIBE_MESSAGE, 'Check your inbox to confirm your subscription.');

  const confirmTok = generateSecureToken();
  const unsubTok = generateSecureToken();
  const email = buildConfirmationEmail({
    email: 'reindolf@example.com',
    interests: 'Cybersecurity & Ghana Scam Alerts',
    confirmToken: confirmTok,
    unsubscribeToken: unsubTok,
    siteUrl: 'https://cybershield-ghana.vercel.app/',
  });

  assert.equal(
    email.confirmUrl,
    `https://cybershield-ghana.vercel.app/api/confirm?token=${confirmTok}`
  );
  assert.equal(
    email.unsubscribeUrl,
    `https://cybershield-ghana.vercel.app/api/unsubscribe?token=${unsubTok}`
  );
  assert.ok(email.html.includes(email.confirmUrl));
  assert.ok(email.html.includes(email.unsubscribeUrl));
  assert.ok(email.html.includes('CyberShield Ghana'));
  assert.ok(email.text.includes(email.confirmUrl));
  assert.ok(email.text.includes(email.unsubscribeUrl));

  const digest = buildDigestEmail({
    items: [
      {
        id: 'news-1',
        title: 'How to Verify Mobile Money Balances Safely via Official USSD',
        category: 'Ghana Alerts',
        summary: 'Always check your wallet balance directly via official USSD before returning funds.',
        url: '/#threats',
        publishedAt: '2026-10-27',
      },
    ],
    unsubscribeToken: unsubTok,
    siteUrl: 'https://cybershield-ghana.vercel.app',
    dateLabel: '2026-10-27',
  });

  assert.ok(digest.html.includes(email.unsubscribeUrl));
  assert.ok(digest.text.includes(email.unsubscribeUrl));
  assert.ok(digest.html.includes('How to Verify Mobile Money Balances Safely via Official USSD'));
});
