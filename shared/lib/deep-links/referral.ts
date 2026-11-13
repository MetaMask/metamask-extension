import {
  MONEY_REFERRAL_CODE_MIN_LENGTH,
  normalizeMoneyReferralCode,
} from '#shared/lib/money-referral-code';
import type { ReferralEntryType } from '#shared/types/rewards-money';

/**
 * Hidden document parameter that records where a referral code came from.
 * It travels beside `ref` through the interstitial and is removed on consume.
 */
export const REFERRAL_ENTRY_TYPE_PARAM = 'refEntryType';

/**
 * Reads a referral without turning malformed or ambiguous input into a code.
 *
 * @param params - Parameters from the original deep link.
 * @returns The normalized code, or null when absent or invalid.
 */
export function getReferralCode(params: URLSearchParams): string | null {
  const values = params.getAll('ref');
  const code = values.length === 1 ? values[0].trim().toUpperCase() : '';
  return code.length >= MONEY_REFERRAL_CODE_MIN_LENGTH &&
    normalizeMoneyReferralCode(code) === code
    ? code
    : null;
}

/**
 * Reads where a pending referral code came from.
 *
 * @param params - Parameters from the deep link or the document URL.
 * @returns The recorded origin, or `deeplink` when absent or unrecognized.
 */
export function getReferralEntryType(
  params: URLSearchParams,
): ReferralEntryType {
  return params.get(REFERRAL_ENTRY_TYPE_PARAM) === 'restored_context'
    ? 'restored_context'
    : 'deeplink';
}

/**
 * Carries a referral outside the extension's hash route for startup to consume.
 *
 * @param extensionUrl - The internal destination URL, after deep-link parsing.
 * @param params - Parameters from the original deep link, before canonicalization.
 * @param entryType - Where the code came from. Direct links omit the marker.
 * @returns The destination with temporary document-level referral metadata.
 */
export function withReferralCode(
  extensionUrl: string,
  params: URLSearchParams,
  entryType: ReferralEntryType = 'deeplink',
): string {
  const code = getReferralCode(params);
  if (!code) {
    return extensionUrl;
  }
  const url = new URL(extensionUrl);
  url.searchParams.set('ref', code);
  if (entryType === 'restored_context') {
    url.searchParams.set(REFERRAL_ENTRY_TYPE_PARAM, entryType);
  }
  return url.toString();
}
