import {
  CANONICAL_DEEP_LINK_HOST,
  DEEP_LINK_HOSTS,
  SIG_PARAM,
  SIG_PARAMS_PARAM,
} from './constants';

/**
 * Canonicalizes a URL for signature verification by replacing configured
 * alternate deep-link origins with the canonical HTTPS signing origin,
 * selecting the parameters named by `sig_params` when present (or removing
 * `sig` otherwise), and sorting the resulting parameters.
 *
 * @param url - The URL to canonicalize.
 * @returns The canonicalized URL as a string.
 */
export function canonicalize(url: URL): string {
  const isAlternateDeepLinkHost =
    url.hostname !== CANONICAL_DEEP_LINK_HOST &&
    DEEP_LINK_HOSTS.includes(url.hostname);
  const signingOrigin = isAlternateDeepLinkHost
    ? `https://${CANONICAL_DEEP_LINK_HOST}`
    : url.origin;
  let queryString: string | undefined;

  const sigParams = url.searchParams.get(SIG_PARAMS_PARAM);

  if (typeof sigParams === 'string') {
    const signedParams = new URLSearchParams();
    // sigParams might be "" (empty), in which case we
    // don't need to split and search
    if (sigParams) {
      const allowedParams = sigParams.split(',');

      for (const allowedParam of allowedParams) {
        const values = url.searchParams.getAll(allowedParam);
        for (const value of values) {
          signedParams.append(allowedParam, value);
        }
      }
    }

    signedParams.append(SIG_PARAMS_PARAM, sigParams);

    signedParams.sort();
    queryString = signedParams.toString();
  } else {
    // Backward compatibility: sign all params if there are no sig_params
    // clone the searchParams so we don't edit the original URL when deleting `sig`
    const params = new URLSearchParams(url.searchParams);
    params.delete(SIG_PARAM);
    params.sort();
    queryString = params.toString();
  }

  return signingOrigin + url.pathname + (queryString ? `?${queryString}` : '');
}
