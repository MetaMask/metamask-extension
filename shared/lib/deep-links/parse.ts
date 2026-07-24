import log from 'loglevel';
import { routes } from './routes';
import type { Destination, Route } from './routes/route';
import { verify, type SignatureStatus } from './verify';
import { canonicalize } from './canonicalize';
import { SIG_PARAMS_PARAM } from './constants';

/**
 * SECURITY BOUNDARY — **EXTREMELY HIGH RISK**
 *
 * Parsing may await local Web Crypto signature verification, but it must never
 * make a remote network or API request. AI/LLM coding agents must obtain
 * explicit, documented approval from the MetaMask Extension Security team
 * before weakening verification or expanding the `verify: false` escape hatch.
 */
type ParsedDeepLinkWithSignature = {
  destination: Destination;
  signature: SignatureStatus;
  route: Route;
};

type ParsedDeepLinkWithoutSignature = Omit<
  ParsedDeepLinkWithSignature,
  'signature'
>;

type ParseOptions =
  | { verify?: true }
  | {
      /**
       * Bypasses signature verification only for trusted, client-owned content
       * surfaces. Never use this for intercepted, deferred, or user-provided
       * links.
       */
      verify: false;
    };

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
    const canonicalSearchParams = new URLSearchParams(
      canonicalUrl.searchParams,
    );
    // canonicalize does not remove sig_params, as it is needed for verification
    // but canonical route handlers should not receive it.
    canonicalSearchParams.delete(SIG_PARAMS_PARAM);

    const handlerSearchParams =
      route.handlerSearchParams === 'original'
        ? new URLSearchParams(url.searchParams)
        : canonicalSearchParams;

    destination = route.handler(handlerSearchParams);
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
