import log from 'loglevel';
import { routes } from './routes';
import type { Destination } from './routes/route';
import { VALID, verify } from './verify';

export type ParsedDeepLink = {
  normalizedUrl: URL;
  destination: Destination;
  signed: boolean;
};

export async function parse(urlStr: string): Promise<ParsedDeepLink | false> {
  const url = new URL(urlStr);
  const route = routes.get(url.pathname.toLowerCase());
  if (!route) {
    log.debug('No handler found for the pathname:', url.pathname);
    return false;
  }

  const isValidSignature = await verify(url);

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

  return { normalizedUrl: url, destination, signed };
}
