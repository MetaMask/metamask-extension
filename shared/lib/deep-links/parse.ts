import log from 'loglevel';
import { routes } from './routes';
import type { Destination, Route } from './routes/route';
import { MISSING, VALID, verify, type SignatureStatus } from './verify';
import { canonicalize } from './canonicalize';
import { SIG_PARAMS_PARAM, TRACKING_PARAMETERS } from './constants';

export type ParsedDeepLink = {
  destination: Destination;
  signature: SignatureStatus;
  route: Route;
};

export async function parse(url: URL): Promise<ParsedDeepLink | false> {
  const route = routes.get(url.pathname.toLowerCase());
  if (!route) {
    log.debug('No handler found for the pathname:', url.pathname);
    return false;
  }

  const canonicalUrl = canonicalize(url);
  const signature = await verify(canonicalUrl);
  let destination: Destination;
  try {
    // canonicalize does not remove sig_params, as it is needed for verification
    // but we do not want to pass it to the route handler, so we remove it
    canonicalUrl.searchParams.delete(SIG_PARAMS_PARAM);

    // We always make UTM params available to the route handler.
    // UTM params and attribution params _do NOT need to be signed_, however
    // if we have signed UTM/attribute params, they cannot be overwritten by
    // unsigned params.
    if (signature === MISSING || signature === VALID) {
      const sigParams =
        signature === VALID ? url.searchParams.get(SIG_PARAMS_PARAM) : null;
      const sigParamsSplit = sigParams ? sigParams.split(',') : [];
      // add to the canonicalUrl's searchParams
      TRACKING_PARAMETERS.forEach((param) => {
        // if it is already in sigParams, its already in the url, so we must
        // skip it to avoid duplication
        if (typeof sigParams === 'string' && sigParamsSplit.includes(param)) {
          return;
        }
        url.searchParams.getAll(param).forEach((value) => {
          canonicalUrl.searchParams.append(param, value);
        });
      });
    } else {
      // an invalid signature doesn't receive utm params as we can't decipher
      // which values for the UTM params are legitimate and which have been
      // tampered with; so we just skip adding them
    }

    destination = route.handler(canonicalUrl.searchParams);
  } catch (error) {
    // tab may have closed in the meantime, the searchParams may have
    // been rejected by the handler, etc.
    log.debug('Error handling deep link:', error);
    return false;
  }

  return { destination, signature, route };
}
