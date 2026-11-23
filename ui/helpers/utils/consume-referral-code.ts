import { getReferralCode } from '#shared/lib/deep-links/referral';

/**
 * Captures temporary referral metadata before any routed screen mounts.
 *
 * @returns The pending code. Removes even invalid metadata from the URL.
 */
export function consumeReferralCode(): string | null {
  const url = new URL(window.location.href);
  if (url.searchParams.has('ref')) {
    const code = getReferralCode(url.searchParams);
    url.searchParams.delete('ref');
    window.history.replaceState(window.history.state, '', url);
    return code;
  }
  return null;
}
