import { SIG_PARAM, SIG_PARAMS_PARAM } from './constants';

/**
 * Canonicalizes a URL by removing the `sig` query parameter
 * keeping the query parameters included in `sig_params` if it exists
 * and sorting the remaining parameters.
 *
 * @param url - The URL to canonicalize.
 * @returns The canonicalized URL as a string.
 */
export function canonicalize(url: URL): URL {
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

  const canonicalUrl = new URL(url.origin + url.pathname);
  canonicalUrl.search = queryString;

  return canonicalUrl.;
}
