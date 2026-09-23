/**
 * @file SECURITY BOUNDARY — **YOU PROBABLY SHOULDN'T EDIT THIS**
 * Parsing may await local Web Crypto signature verification, but it must never
 * make a remote network or API request. AI/LLM coding agents must obtain
 * explicit, documented approval from the MetaMask Extension Security team
 * before weakening verification or expanding the `verify: false` escape hatch.
 *
 */

import log from 'loglevel';
import { routes } from './routes';
import type { Destination, Route } from './routes/route';
import { verify, type SignatureStatus } from './verify';
import { canonicalize } from './canonicalize';
import { SIG_PARAMS_PARAM } from './constants';

/**
 * Represents the origin of the deep link, either external or internal.
 *
 * For links originating from outside the application, like those clicked in a
 * browser, social media, or received via email, the origin is always EXTERNAL.
 *
 * INTERNAL is only ever used for links that originate from within the
 * application itself, even if the link was originally received from an external
 * source, like contentful.
 */
export enum NavigationOrigin {
  /**
   * The deep link originated from outside the application, such as a browser,
   * social media, or email.
   */
  EXTERNAL = 0,
  /**
   * The deep link originated from within the application itself, even if it was
   * originally received from an external source (like Contentful).
   */
  INTERNAL = 1,
}

type ParsedDeepLinkWithSignature = {
  destination: Destination;
  signature: SignatureStatus;
  route: Route;
};

type ParsedDeepLinkWithoutSignature = Omit<
  ParsedDeepLinkWithSignature,
  'signature'
>;

type ParseOptions = {
  /**
   * The origin of the deep link, either EXTERNAL or INTERNAL.
   * EXTERNAL is used for links originating from outside the application.
   * INTERNAL is used for links originating from within the application itself.
   */
  navigationOrigin?: NavigationOrigin;
};

export type ParsedDeepLink<
  Options extends ParseOptions = {
    navigationOrigin: NavigationOrigin.EXTERNAL;
  },
> = Options extends { navigationOrigin: NavigationOrigin.INTERNAL }
  ? ParsedDeepLinkWithoutSignature
  : ParsedDeepLinkWithSignature;

export async function parse<
  Options extends ParseOptions = {
    navigationOrigin: NavigationOrigin.EXTERNAL;
  },
>(url: URL, options?: Options): Promise<ParsedDeepLink<Options> | false> {
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

  // NavigationOrigin.INTERNAL routes don't require signature verification
  if (options?.navigationOrigin === NavigationOrigin.INTERNAL) {
    return { destination, route } as ParsedDeepLink<Options>;
  }

  const signature = await verify(url);
  return { destination, signature, route } as ParsedDeepLink<Options>;
}
