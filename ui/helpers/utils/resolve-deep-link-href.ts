import { DEEP_LINK_HOST } from '../../../shared/lib/deep-links/constants';
import { parse } from '../../../shared/lib/deep-links/parse';

export function isInternalRouteHref(href: string): boolean {
  return href.startsWith('/') && !href.startsWith('//');
}

function toInternalHref(path: string, query: URLSearchParams): string {
  const queryString = query.toString();
  return queryString ? `${path}?${queryString}` : path;
}

export async function resolveDeepLinkHref(href: string): Promise<string> {
  try {
    const url = new URL(href);

    if (url.hostname !== DEEP_LINK_HOST) {
      return href;
    }

    const parsed = await parse(url);

    if (!parsed) {
      // Unsupported MetaMask deep links intentionally fall back to the original
      // URL so Branch can apply its default handling.
      return href;
    }

    if ('redirectTo' in parsed.destination) {
      return parsed.destination.redirectTo.toString();
    }

    return toInternalHref(parsed.destination.path, parsed.destination.query);
  } catch {
    return href;
  }
}
