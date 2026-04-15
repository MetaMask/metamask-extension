import { PLATFORM_FIREFOX } from '../../../../shared/constants/app';
import {
  CLIENT_ID_EXTENSION_CHROME,
  CLIENT_ID_EXTENSION_FIREFOX,
} from '../../../../shared/constants/smartTransactions';
import { getPlatform } from '../util';

export const getClientForTransactionMetadata = (): string =>
  getPlatform() === PLATFORM_FIREFOX
    ? CLIENT_ID_EXTENSION_FIREFOX
    : CLIENT_ID_EXTENSION_CHROME;

/**
 * Sanitizes transaction origin for analytics.
 * - For URL origins (dApps): extracts hostname only for privacy
 * - For internal origins: returns as-is
 *
 * @param origin - The transaction origin to sanitize
 * @returns The sanitized origin (hostname for URLs, original value otherwise)
 */
export const sanitizeOrigin = (origin?: string): string | undefined => {
  if (!origin) {
    return undefined;
  }

  try {
    // Attempt to parse as URL - will throw for non-URL strings
    const url = new URL(origin);
    // If hostname is empty, the input wasn't a real URL (e.g., 'wc::', 'MMSDKREMOTE::')
    return url.hostname || origin;
  } catch {
    // Not a valid URL (internal origins like 'metamask', 'RAMPS_SEND')
    return origin;
  }
};
