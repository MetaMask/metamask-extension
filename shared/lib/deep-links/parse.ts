import log from 'loglevel';
import { DEEP_LINK_HOST, DEEP_LINK_MAX_LENGTH } from './constants';
import { routes } from './routes';
import { Destination } from './routes/route.type';
import { INVALID, MISSING, VALID, verify } from './verify';

export type ParsedDeepLink = {
  normalizedUrl: URL;
  destination: Destination;
  signed: boolean;
};

export async function parse(urlStr: string): Promise<ParsedDeepLink | false> {
  if (urlStr.length > DEEP_LINK_MAX_LENGTH) {
    log.debug('Url is too long, skipping deep link handling');
    return false;
  }

  const url = new URL(urlStr);
  const isLinkHost = url.host === DEEP_LINK_HOST;
  if (isLinkHost === false) {
    return false;
  }

  const route = routes.get(url.pathname.toLowerCase());
  if (!route) {
    log.debug('No handler found for the pathname:', url.pathname);
    return false;
  }

  const isValidSignature = await verify(url);
  if (isValidSignature === INVALID) {
    log.debug('Invalid signature for deep link url. Ignoring.', urlStr);
    return false;
  }

  let destination: Destination;
  try {
    destination = route.handler(url.searchParams);
  } catch (error) {
    // tab may have closed in the meantime, the searchParams may have
    // been rejected by the handler, etc.
    log.debug('Error handling deep link:', error);
    return false;
  }
  const signed = isValidSignature === VALID;

  if (signed || isValidSignature === MISSING) {
    return { normalizedUrl: url, destination, signed };
  }
  // ignore signed deep links that are not valid
  return false;
}
