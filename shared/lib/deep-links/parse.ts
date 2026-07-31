import log from 'loglevel';
import { routes } from './routes';
import type { Destination, Route } from './routes/route';
import { verify, type SignatureStatus } from './verify';
import { canonicalize } from './canonicalize';
import { SIG_PARAMS_PARAM } from './constants';

type ParsedDeepLinkWithSignature = {
  destination: Destination;
  signature: SignatureStatus;
  route: Route;
};

type ParsedDeepLinkWithoutSignature = Omit<
  ParsedDeepLinkWithSignature,
  'signature'
>;

type ParseOptions = { verify?: true } | { verify: false };

export type ParsedDeepLink<Options extends ParseOptions = { verify: true }> =
  Options extends { verify: false }
    ? ParsedDeepLinkWithoutSignature
    : ParsedDeepLinkWithSignature;

export async function parse<Options extends ParseOptions = { verify: true }>(
  url: URL,
  options?: Options,
): Promise<ParsedDeepLink<Options> | false> {
  const route = routes.get(url.pathname.toLowerCase());
  if (!route) {
    log.debug('No handler found for the pathname:', url.pathname);
    return false;
  }

  let destination: Destination;
  try {
    const canonicalUrl = new URL(canonicalize(url));
    // canonicalize does not remove sig_params, as it is needed for verification
    // but we do not want to pass it to the route handler, so we remove it
    canonicalUrl.searchParams.delete(SIG_PARAMS_PARAM);
    destination = route.handler(canonicalUrl.searchParams);
  } catch (error) {
    // tab may have closed in the meantime, the searchParams may have
    // been rejected by the handler, etc.
    log.debug('Error handling deep link:', error);
    return false;
  }

  if (options?.verify === false) {
    return { destination, route } as ParsedDeepLink<Options>;
  }

  const signature = await verify(url);
  return { destination, signature, route } as ParsedDeepLink<Options>;
}
