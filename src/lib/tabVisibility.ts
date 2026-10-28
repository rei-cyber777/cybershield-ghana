export const DEFAULT_FAVICON_HREF = '/favicon.svg';
export const AWAY_FAVICON_HREF = '/favicon-away.svg';
export const AWAY_TAB_TITLE = 'Come back to CyberShield! 🛡️';

export interface TabAppearance {
  title: string;
  faviconHref: string;
}

export interface TabVisibilityOptions {
  awayTitle?: string;
  awayFavicon?: string;
  defaultFavicon?: string;
}

/**
 * Pure helper that determines the target document title and favicon URL
 * based on whether the browser tab is hidden (`document.hidden`).
 */
export function computeTabAppearance(
  isHidden: boolean,
  originalTitle: string,
  originalFavicon: string,
  options?: TabVisibilityOptions
): TabAppearance {
  const awayTitle = options?.awayTitle ?? AWAY_TAB_TITLE;
  const awayFavicon = options?.awayFavicon ?? AWAY_FAVICON_HREF;
  const fallbackFavicon = options?.defaultFavicon ?? DEFAULT_FAVICON_HREF;

  if (isHidden) {
    return {
      title: awayTitle,
      faviconHref: awayFavicon,
    };
  }

  return {
    title: originalTitle,
    faviconHref: originalFavicon || fallbackFavicon,
  };
}

/**
 * Ensures a `<link rel="icon">` element exists in `document.head` and returns it.
 */
export function ensureFaviconElement(
  doc: Document,
  defaultHref: string = DEFAULT_FAVICON_HREF
): HTMLLinkElement {
  const existing = doc.querySelector<HTMLLinkElement>("link[rel*='icon']");
  if (existing) {
    if (!existing.getAttribute('href')) {
      existing.href = defaultHref;
    }
    return existing;
  }

  const link = doc.createElement('link');
  link.rel = 'icon';
  link.type = 'image/svg+xml';
  link.href = defaultHref;
  doc.head?.appendChild(link);
  return link;
}

/**
 * Attaches a `visibilitychange` listener that swaps the tab title and favicon
 * when the user switches away from the CyberShield tab and restores the original
 * title and favicon when they return.
 *
 * Returns a cleanup function that removes the listener and restores the original state.
 */
export function initTabVisibilityListener(
  doc?: Document,
  options?: TabVisibilityOptions
): () => void {
  const targetDoc = doc ?? (typeof document !== 'undefined' ? document : undefined);
  if (!targetDoc) {
    return () => {};
  }

  const defaultFavicon = options?.defaultFavicon ?? DEFAULT_FAVICON_HREF;
  const initialFaviconEl = ensureFaviconElement(targetDoc, defaultFavicon);

  // Store the original favicon URL and tab title
  const originalFavicon = initialFaviconEl.href || defaultFavicon;
  const originalTitle = targetDoc.title;

  const handleVisibilityChange = () => {
    const faviconLink = ensureFaviconElement(targetDoc, originalFavicon);
    const next = computeTabAppearance(
      Boolean(targetDoc.hidden),
      originalTitle,
      originalFavicon,
      options
    );

    faviconLink.href = next.faviconHref;
    targetDoc.title = next.title;
  };

  targetDoc.addEventListener('visibilitychange', handleVisibilityChange);

  return () => {
    targetDoc.removeEventListener('visibilitychange', handleVisibilityChange);
    const faviconLink = targetDoc.querySelector<HTMLLinkElement>("link[rel*='icon']");
    if (faviconLink) {
      faviconLink.href = originalFavicon;
    }
    targetDoc.title = originalTitle;
  };
}
