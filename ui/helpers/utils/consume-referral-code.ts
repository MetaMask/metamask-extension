import {
  getReferralCode,
  getReferralEntryType,
  REFERRAL_ENTRY_TYPE_PARAM,
} from '#shared/lib/deep-links/referral';
import type { PendingReferral } from '#shared/types/rewards-money';

/**
 * Captures temporary referral metadata before any routed screen mounts.
 *
 * @returns The pending code and where it came from. Removes even invalid
 * metadata from the URL.
 */
export function consumeReferralCode(): PendingReferral | null {
  const url = new URL(window.location.href);
  if (!url.searchParams.has('ref')) {
    return null;
  }
  const code = getReferralCode(url.searchParams);
  const entryType = getReferralEntryType(url.searchParams);
  url.searchParams.delete('ref');
  url.searchParams.delete(REFERRAL_ENTRY_TYPE_PARAM);
  window.history.replaceState(window.history.state, '', url);
  return code ? { code, entryType } : null;
}
