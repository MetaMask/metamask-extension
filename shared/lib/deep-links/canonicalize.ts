import { SIG_PARAM, SIG_PARAMS } from './constants';

/**
 * Canonicalizes a URL by removing the `sig` and `sig_params` query parameters and sorting the
 * remaining parameters.
 *
 * This is the same as the `canonicalize` function in the server side signing
 * application.
 *
 * @param url - The URL to canonicalize.
 * @returns The canonicalized URL as a string.
 */
export function canonicalize(url: URL): string {
  // clone the searchParams so we don't edit the original URL when deleting
  // `sig`
  const params = new URLSearchParams(url.searchParams);
  // remove the `sig` and `sig_params` parameters if they exist, since we'll be adding our own later
  params.delete(SIG_PARAM);
  params.delete(SIG_PARAMS);
  params.sort();
  const queryString = params.toString();
  const fullUrl =
    url.origin + url.pathname + (queryString ? `?${queryString}` : '');
  return fullUrl;
}
