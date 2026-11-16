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
 * `twitter`. Intended for source-name classification such as logo display; use
 * isXHostUrl to gate link opening.
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
 * Whether a URL is safe to open (https only; http is excluded because AI-sourced
 * links must not open over plaintext).
 *
 * @param url - URL to validate.
 * @returns True when the URL parses with the https scheme.
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
 * Whether a parseable https URL points at x.com or twitter.com. Unlike
 * isXSourceUrl this never accepts bare source names, so it is safe to use as
 * a navigation gate for social post links.
 *
 * @param url - URL to validate.
 * @returns True when the URL is an https x.com or twitter.com URL.
 */
export const isXHostUrl = (url: string): boolean => {
  if (!isSafeUrl(url)) {
    return false;
  }
  const hostname = new URL(url).hostname.replace(/^www\./u, '').toLowerCase();
  return (
    hostname === 'x.com' ||
    hostname.endsWith('.x.com') ||
    hostname === 'twitter.com' ||
    hostname.endsWith('.twitter.com')
  );
};

/**
 * The single URL-open policy for insights sources: articles may open any https
 * URL, while social posts must additionally resolve to x.com or twitter.com.
 * Use the result both to decide whether a row renders as pressable and inside
 * press handlers, so the enabled state can never disagree with the policy.
 *
 * @param url - Source URL from the digest report.
 * @param kind - Whether the URL belongs to an article or a social post.
 * @returns The URL when it may be opened, otherwise null.
 */
export const getOpenableSourceUrl = (
  url: string,
  kind: 'article' | 'tweet',
): string | null => {
  if (!isSafeUrl(url)) {
    return null;
  }
  return kind === 'tweet' && !isXHostUrl(url) ? null : url;
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

export { formatRelativeTime } from '../../hooks/useMarketInsights';
