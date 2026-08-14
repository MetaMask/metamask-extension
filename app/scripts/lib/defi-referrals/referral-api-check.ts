import { HYPERLIQUID_INFO_API_URL } from '../../../../shared/constants/defi-referrals';

/**
 * Checks if an address already has a referral code set on Hyperliquid.
 *
 * @param address - The address to check
 * @returns Whether the address already has a Hyperliquid referral code set
 */
export async function checkHyperliquidHasReferralCode(
  address: string,
): Promise<boolean> {
  try {
    const response = await fetch(HYPERLIQUID_INFO_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'referral', user: address }),
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();

    // `referredBy` is non-null when the user has already been referred
    return Boolean(data?.referredBy);
  } catch {
    // Network error or JSON parse failure — default to false
    return false;
  }
}
