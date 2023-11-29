import { DOMParser } from '@xmldom/xmldom';
import { isNumber } from 'lodash';

const protocolAndDomainRE = /^(?:\w+:)?\/\/(\S+)$/;

const localhostDomainRE = /^localhost[\:?\d]*(?:[^\:?\d]\S*)?$/;
const nonLocalhostDomainRE = /^[^\s\.]+\.\S{2,}$/;

/**
 * Loosely validate a URL `string`.
 *
 * @param {string} string
 * @returns {boolean}
 */

function isUrl(string) {
  if (typeof string !== 'string') {
    return false;
  }

  const match = string.match(protocolAndDomainRE);
  if (!match) {
    return false;
  }

  const everythingAfterProtocol = match[1];
  if (!everythingAfterProtocol) {
    return false;
  }

  if (
    localhostDomainRE.test(everythingAfterProtocol) ||
    nonLocalhostDomainRE.test(everythingAfterProtocol)
  ) {
    return true;
  }

  return false;
}

/**
 * Fetches the HTML source of the origin
 *
 * @param url - the origin URL
 * @returns the HTML source
 */
const fetchHtmlSource = async (url: URL) => {
  try {
    const response = await fetch(url);
    if (response?.ok) {
      return await response.text();
    }
  } catch (e) {
    console.log(`favicon fetchHtmlSource failed for ${url}`, e);
  }
};

const fetchFaviconDirectly = async (url: URL) => {
  try {
    const response = await fetch(url);
    if (response?.ok) {
      return await response.text();
    }
  } catch (e) {
    console.log(`favicon fetch failed for ${url}`, e);
  }
};

/**
 * Parses the HTML source into a DOM document
 *
 * @param htmlSource - the HTML source
 * @returns the DOM document
 */
const parseHtmlSource = async (htmlSource: string | undefined) => {
  if (htmlSource && htmlSource.length > 0) {
    // use a return statement for the error handler to avoid the console warning
    // as any error will result in fallback favicon
    return new DOMParser({
      errorHandler: (level, msg) => {
        if (level === 'error') {
          console.log(level, msg);
        }
      },
    }).parseFromString(htmlSource, 'text/html');
  }
};

/**
 * Returns the favicon URL from the HTML links collection
 *
 * @param links - the HTML links collection
 * @param origin - the origin URL to be used to build the favicon url
 * @returns the first found favicon URL or empty object if none found
 */
const getFaviconUrlFromLinks = (
  links: HTMLCollectionOf<Element> | undefined,
  origin: URL,
): URL | undefined => {
  let faviconURL;

  if (links && links.length > 0 && origin) {
    Array.from(links).every((link) => {
      const rel = link.getAttribute('rel');
      if (rel?.split(' ').includes('icon')) {
        const href = link.getAttribute('href');
        if (href) {
          faviconURL = new URL(href, origin);
          return false; // stop loop at first favicon found, same behaviour as browser extension
        }
      }
      return true;
    });
  }
  return faviconURL;
};

/**
 * Returns a URL object from the given origin even if it's not a valid URL
 *
 * @param origin - the origin string (ie: 'metamask.github.io' or full dapp URL 'https://metamask.github.io/test-dapp/')
 */
const originToUrl = (origin: string) => {
  if (origin) {
    try {
      // remove sdk origin prefix before conversion
      const originWithoutPrefix = origin;
      const originWithProtocol = isUrl(originWithoutPrefix)
        ? originWithoutPrefix
        : `https://${originWithoutPrefix}`;
      return new URL(originWithProtocol);
    } catch (e) {
      console.log(`Can not convert ${origin} origin to URL`, e);
    }
  }
};

const originToHost = (origin: string) => {
  const normalisedOrigin = originToUrl(origin);
  if (normalisedOrigin) {
    return normalisedOrigin.host;
  }
};

/**
 * Reads the favicon URL for the given origin from the browser state
 *
 * @param originUrl  -the origin used as cache key
 * @returns the favicon url or null if none found
 */
export const getFaviconFromCache = (originUrl: string): string | undefined => {
  const cacheKey = originToHost(originUrl);
  if (!cacheKey) {
    return;
  }
  const { browser } = store.getState();
  const cachedFavicon = browser.favicons.find(
    (favicon: { origin: string; url: string }) => favicon.origin === cacheKey,
  );
  return cachedFavicon?.url;
};

/**
 * Returns URL for the favicon of the given url
 *
 * @param origin - String corresponding to website url or domain
 * @returns URL corresponding to favicon url or empty string if none found
 */
export const getFaviconURLFromHtml = async (origin: string) => {
  // in case the url of origin can not be reached, state stores the 'null' string
  // which is not a valid url, so until we take the time to fix this, we return empty string
  if (!origin || origin === 'null') {
    return;
  }
  const url = originToUrl(origin);
  if (url) {
    const htmlSource = await fetchHtmlSource(url);
    const htmlDoc = await parseHtmlSource(htmlSource);
    const links = htmlDoc?.getElementsByTagName('link');
    const res = getFaviconUrlFromLinks(links, url);
    if (res) {
      return res;
    }
    const favicon = await fetchFaviconDirectly(`${url.origin}/favicon.ico`);
    console.log('favicon', favicon);
  }
};

/**
 * Returns the favicon URL from the image source if it is an SVG image
 *
 * @param imageSource - the image source
 */
export const isFaviconSVG = (imageSource: any) => {
  if (
    imageSource &&
    !isNumber(imageSource) &&
    'uri' in imageSource &&
    (imageSource.uri?.endsWith('.svg') ||
      imageSource.uri?.startsWith('data:image/svg+xml'))
  ) {
    return imageSource.uri;
  }
};
