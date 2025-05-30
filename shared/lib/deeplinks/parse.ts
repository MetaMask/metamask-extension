import log from 'loglevel';
import { DEEP_LINK_HOST, DEEP_LINK_MAX_LENGTH } from './constants';
import { routes } from './routes';
import { Destination } from './routes/route.type';
import { INVALID, MISSING, VALID, verify } from './verify';

export async function parse(urlStr: string) {
  if (urlStr.length > DEEP_LINK_MAX_LENGTH) {
    log.debug('Url is too long, skipping deeplink handling');
    return false;
  }

  const url = new URL(urlStr);
  const isLinkHost = url.host === DEEP_LINK_HOST;
  if (isLinkHost === false) {
    return false;
  }

  const route = routes.get(url.pathname);
  if (!route) {
    log.debug('No handler found for the pathname:', url.pathname);
    return false;
  }

  const isValidSignature = await verify(url);
  if (isValidSignature === INVALID) {
    log.debug('Invalid signature for deeplink url. Ignoring.', urlStr);
    return false;
  }

  let destination: Destination;
  try {
    destination = route.handler(url.searchParams);
  } catch (error) {
    // tab may have closed in the meantime, the searchParams may have
    // been rejected by the handler, etc.
    log.debug('Error handling deeplink:', error);
    return false;
  }
  const signed = isValidSignature === VALID;

  if (!signed && isValidSignature !== MISSING) {
    return false;
  }
  return { url, destination, signed };
}
