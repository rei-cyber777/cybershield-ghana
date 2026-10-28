import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AWAY_FAVICON_HREF,
  AWAY_TAB_TITLE,
  DEFAULT_FAVICON_HREF,
  computeTabAppearance,
  initTabVisibilityListener,
} from './tabVisibility';

test('computeTabAppearance returns away title and away favicon when tab is hidden', () => {
  const result = computeTabAppearance(
    true,
    'CyberShield Ghana — Open-Source Cybersecurity Awareness & Scam Defense',
    'https://cybershield.gh/favicon.svg'
  );

  assert.equal(result.title, AWAY_TAB_TITLE);
  assert.equal(result.faviconHref, AWAY_FAVICON_HREF);
});

test('computeTabAppearance restores original title and original favicon when tab is visible', () => {
  const originalTitle = 'CyberShield Ghana — Open-Source Cybersecurity Awareness & Scam Defense';
  const originalFavicon = 'https://cybershield.gh/favicon.svg';

  const result = computeTabAppearance(false, originalTitle, originalFavicon);

  assert.equal(result.title, originalTitle);
  assert.equal(result.faviconHref, originalFavicon);
});

test('computeTabAppearance falls back to DEFAULT_FAVICON_HREF if originalFavicon is empty', () => {
  const result = computeTabAppearance(false, 'CyberShield Ghana', '');
  assert.equal(result.faviconHref, DEFAULT_FAVICON_HREF);
});

test('initTabVisibilityListener swaps title and favicon on visibilitychange and restores on return', () => {
  const listenerHolder: { current: (() => void) | null } = { current: null };
  const mockLink = {
    rel: 'icon',
    type: 'image/svg+xml',
    href: '/favicon.svg',
    getAttribute(attr: string) {
      return attr === 'href' ? this.href : null;
    },
  };

  const mockDoc = {
    title: 'CyberShield Ghana — Open-Source Cybersecurity Awareness & Scam Defense',
    hidden: false,
    head: {
      appendChild() {},
    },
    querySelector(selector: string) {
      if (selector === "link[rel*='icon']") {
        return mockLink;
      }
      return null;
    },
    createElement() {
      return mockLink;
    },
    addEventListener(event: string, cb: () => void) {
      if (event === 'visibilitychange') {
        listenerHolder.current = cb;
      }
    },
    removeEventListener(event: string, cb: () => void) {
      if (event === 'visibilitychange' && listenerHolder.current === cb) {
        listenerHolder.current = null;
      }
    },
  } as unknown as Document;

  const cleanup = initTabVisibilityListener(mockDoc);
  assert.ok(listenerHolder.current, 'visibilitychange listener should be registered');

  // Simulate user switching to another tab
  Object.defineProperty(mockDoc, 'hidden', { value: true, configurable: true });
  listenerHolder.current();
  assert.equal(mockDoc.title, 'Come back to CyberShield! 🛡️');
  assert.equal(mockLink.href, '/favicon-away.svg');

  // Simulate user returning to the CyberShield tab
  Object.defineProperty(mockDoc, 'hidden', { value: false, configurable: true });
  listenerHolder.current();
  assert.equal(
    mockDoc.title,
    'CyberShield Ghana — Open-Source Cybersecurity Awareness & Scam Defense'
  );
  assert.equal(mockLink.href, '/favicon.svg');

  // Cleanup removes listener and ensures original state
  Object.defineProperty(mockDoc, 'hidden', { value: true, configurable: true });
  listenerHolder.current();
  cleanup();
  assert.equal(listenerHolder.current, null);
  assert.equal(
    mockDoc.title,
    'CyberShield Ghana — Open-Source Cybersecurity Awareness & Scam Defense'
  );
  assert.equal(mockLink.href, '/favicon.svg');
});
