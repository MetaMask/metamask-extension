export const MONEY_REFERRAL_CODE_MIN_LENGTH = 3;

/**
 * Cleans editable input, allowing partial codes while the user types.
 *
 * @param value - Raw text-field input.
 * @returns Uppercase letters and digits, capped at the supported length.
 */
export function normalizeMoneyReferralCode(value: string): string {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]/gu, '')
    .slice(0, 24);
}
