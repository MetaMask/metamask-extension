import {
  MONEY_REFERRAL_CODE_MIN_LENGTH,
  normalizeMoneyReferralCode,
} from '#shared/lib/money-referral-code';

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
 * Carries a referral outside the extension's hash route for startup to consume.
 *
 * @param extensionUrl - The internal destination URL, after deep-link parsing.
 * @param params - Parameters from the original deep link, before canonicalization.
 * @returns The destination with temporary document-level referral metadata.
 */
export function withReferralCode(
  extensionUrl: string,
  params: URLSearchParams,
): string {
  const code = getReferralCode(params);
  if (!code) {
    return extensionUrl;
  }
  const url = new URL(extensionUrl);
  url.searchParams.set('ref', code);
  return url.toString();
}
