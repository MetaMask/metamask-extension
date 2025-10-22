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
  // clone the searchParams so we don't edit the original URL when deleting `sig`
  const params = new URLSearchParams(url.searchParams);
  // remove the `sig` parameter if it exists, since we'll be adding our own later
  params.delete(SIG_PARAM);

  let queryString = '';

  if (params.has(SIG_PARAMS)) {
    const sigParamsStr = params.get(SIG_PARAMS);
    const allowedParams = sigParamsStr?.split(',') ?? [];
    const signedParams = new URLSearchParams();
    const seenParams = new Set<string>(); // Track which params we've already processed

    for (const param of allowedParams) {
      if (params.has(param) && !seenParams.has(param)) {
        const value = params.get(param);
        if (value !== null) {
          signedParams.set(param, value);
          seenParams.add(param); // Mark this param as processed
        }
      }
    }

    signedParams.sort();
    queryString = signedParams.toString();
  } else {
    // Backward compatibility: sign all params if no sig_params
    params.sort();
    queryString = params.toString();
  }

  return url.origin + url.pathname + (queryString ? `?${queryString}` : '');
}
