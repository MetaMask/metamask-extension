import type { MarketInsightsSource } from '@metamask/ai-controllers';

const SAFE_URL_SCHEMES = ['https:'];

/**
 * Builds a Google favicon service URL for a source domain.
 *
 * Falls back to the text before the first slash when the source is not a
 * parseable URL.
 *
 * @param source - Source name or URL.
 * @returns Favicon URL.
 */
export const getFaviconUrl = (source: string): string => {
  const trimmedSource = source.trim();

  try {
    const normalizedSource = trimmedSource.includes('://')
      ? trimmedSource
      : `https://${trimmedSource}`;
    const domain = new URL(normalizedSource).hostname;
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(
      domain,
    )}&sz=32`;
  } catch {
    const fallbackDomain = trimmedSource.split('/')[0];
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(
      fallbackDomain,
    )}&sz=32`;
  }
};

/**
 * Prefixes an author handle with `@`, collapsing any leading `@`s.
 *
 * @param author - Author handle (e.g. `saylordocs` or `@saylordocs`).
 * @returns Normalized handle (e.g. `@saylordocs`).
 */
export const getNormalizedHandle = (author: string): string =>
  `@${author.replace(/^@+/u, '')}`;

/**
 * Whether a source is an X (Twitter) URL or the literal source names `x` or
 * `twitter`.
 *
 * @param source - Source name or URL.
 * @returns True when the source resolves to x.com or twitter.com.
 */
export const isXSourceUrl = (source: string): boolean => {
  const trimmedSource = source.trim();
  const normalized = trimmedSource.toLowerCase();

  if (normalized === 'x' || normalized === 'twitter') {
    return true;
  }

  try {
    const normalizedSource = trimmedSource.includes('://')
      ? trimmedSource
      : `https://${trimmedSource}`;
    const hostname = new URL(normalizedSource).hostname
      .replace(/^www\./u, '')
      .toLowerCase();
    return (
      hostname === 'x.com' ||
      hostname.endsWith('.x.com') ||
      hostname === 'twitter.com' ||
      hostname.endsWith('.twitter.com')
    );
  } catch {
    return false;
  }
};

/**
 * Whether a URL is safe to open (http or https only).
 *
 * @param url - URL to validate.
 * @returns True when the URL parses with a safe scheme.
 */
export const isSafeUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return SAFE_URL_SCHEMES.includes(parsed.protocol);
  } catch {
    return false;
  }
};

/**
 * Deduplicates sources by favicon URL so a trend row shows one logo per domain.
 *
 * @param sources - Sources to deduplicate.
 * @returns Sources with unique favicon URLs, in original order.
 */
export const getUniqueSourcesByFavicon = (
  sources: MarketInsightsSource[],
): MarketInsightsSource[] => {
  const seenFaviconUrls = new Set<string>();

  return sources.filter((source) => {
    const faviconUrl = getFaviconUrl(source.url);
    if (seenFaviconUrls.has(faviconUrl)) {
      return false;
    }
    seenFaviconUrls.add(faviconUrl);
    return true;
  });
};
