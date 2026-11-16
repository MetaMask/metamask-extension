import { getReferralCode } from '#shared/lib/deep-links/referral';
import { selectIsMoneyReferralInviteEnabled } from '#ui/ducks/rewards-money/selectors';
import type { DeepLinkNoticeResolver } from '#ui/pages/deep-link/types';
import { useAppSelector } from '#ui/store/hooks';

/**
 * Describes links that carry a valid referral code. Account eligibility needs
 * a server read, so it stays with the invite sheet: an already-referred user
 * may still see this copy.
 *
 * @param url - The canonical deep link URL.
 * @returns The referral notice, or null when the link has no valid code.
 */
export const getMoneyReferralLinkNotice: DeepLinkNoticeResolver = (url) =>
  getReferralCode(url.searchParams)
    ? {
        title: 'rewardsMoneyReferralLinkTitle',
        description: 'rewardsMoneyReferralLinkDescription',
      }
    : null;

/**
 * Supplies the referral notice to the deep link interstitial only while this
 * client can open the referral invite.
 *
 * @returns A stable resolver, or undefined when the invite is disabled.
 */
export function useMoneyReferralLinkNotice():
  | DeepLinkNoticeResolver
  | undefined {
  const enabled = useAppSelector(selectIsMoneyReferralInviteEnabled);
  return enabled ? getMoneyReferralLinkNotice : undefined;
}
