import log from 'loglevel';
import browser from 'webextension-polyfill';
import {
  MetaMetricsUserTrait,
  type MetaMetricsUserTraits,
} from '../constants/metametrics';
import type { DeferredDeepLink } from './deep-links/types';

const METAMASK_IO_URL = 'https://metamask.io/';
const DEFERRED_DEEPLINK_COOKIE_NAME = 'deferred_deeplink';
const GOOGLE_ANALYTICS_COOKIE_NAME = '_ga';

type InstallAttributionCookie = {
  name: string;
  value: string;
};

export type InstallAttribution = {
  deferredDeepLink: DeferredDeepLink | null;
  traits: Partial<MetaMetricsUserTraits>;
};

/**
 * Maps MetaMask website cookies into install attribution details used by the
 * extension during the install flow.
 *
 * @param cookies - Raw cookies from the MetaMask cookie jar.
 * @returns Parsed install attribution details.
 */
export function getInstallAttributionFromCookies(
  cookies: InstallAttributionCookie[],
): InstallAttribution {
  let deferredDeepLink: DeferredDeepLink | null = null;
  let hasDeferredDeepLinkCookie = false;
  let hasGoogleAnalyticsCookie = false;
  const traits: Partial<MetaMetricsUserTraits> = {};

  for (const cookie of cookies) {
    if (
      !hasDeferredDeepLinkCookie &&
      cookie.name === DEFERRED_DEEPLINK_COOKIE_NAME
    ) {
      hasDeferredDeepLinkCookie = true;
      deferredDeepLink = parseDeferredDeepLinkCookieValue(cookie.value);
    } else if (
      !hasGoogleAnalyticsCookie &&
      cookie.name === GOOGLE_ANALYTICS_COOKIE_NAME
    ) {
      hasGoogleAnalyticsCookie = true;
      traits[MetaMetricsUserTrait.CookieId] = cookie.value;

      const gaClientId = parseGaClientIdFromCookieValue(cookie.value);

      if (gaClientId) {
        traits[MetaMetricsUserTrait.GaClientId] = gaClientId;
      } else {
        log.error('Invalid _ga cookie value.');
      }
    }

    if (hasDeferredDeepLinkCookie && hasGoogleAnalyticsCookie) {
      break;
    }
  }

  return {
    deferredDeepLink,
    traits,
  };
}

/**
 * Reads and parses install attribution cookies from the MetaMask website.
 *
 * @returns Parsed install attribution details.
 */
export async function getInstallAttribution(): Promise<InstallAttribution> {
  try {
    const cookies = await browser.cookies.getAll({
      url: METAMASK_IO_URL,
    });

    return getInstallAttributionFromCookies(cookies);
  } catch (error) {
    log.error(
      'Failed to use browser API for MetaMask install attribution cookies.',
      error,
    );

    return {
      deferredDeepLink: null,
      traits: {},
    };
  }
}

/**
 * Parses the deferred deep link cookie value.
 *
 * @param value - Raw cookie value.
 * @returns Parsed deferred deep link or null if invalid.
 */
function parseDeferredDeepLinkCookieValue(
  value: string,
): DeferredDeepLink | null {
  try {
    const cookieData = JSON.parse(value);

    if (
      !cookieData.referringLink ||
      typeof cookieData.referringLink !== 'string'
    ) {
      log.error('Invalid referringLink in deferred_deeplink cookie.');
      return null;
    }

    if (
      typeof cookieData.createdAt !== 'number' ||
      !Number.isFinite(cookieData.createdAt)
    ) {
      log.error('Invalid createdAt value in deferred_deeplink cookie.');
      return null;
    }

    return {
      createdAt: cookieData.createdAt,
      referringLink: cookieData.referringLink,
    };
  } catch (error) {
    log.error('Failed to parse deferred_deeplink cookie.', error);
    return null;
  }
}

/**
 * Parses the client identifier from a Google Analytics cookie value.
 *
 * @param value - Raw `_ga` cookie value.
 * @returns The last two dot-separated sections or null if invalid.
 */
function parseGaClientIdFromCookieValue(value: string): string | null {
  const lastDotIndex = value.lastIndexOf('.');

  if (lastDotIndex <= 0 || lastDotIndex === value.length - 1) {
    return null;
  }

  const secondLastDotIndex = value.lastIndexOf('.', lastDotIndex - 1);

  if (secondLastDotIndex === lastDotIndex - 1) {
    return null;
  }

  return secondLastDotIndex === -1
    ? value
    : value.slice(secondLastDotIndex + 1);
}
