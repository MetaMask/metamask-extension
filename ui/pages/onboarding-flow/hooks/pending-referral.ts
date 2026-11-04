import type { MoneyReferralContext } from '../../../../shared/lib/deep-links/money-referral';
import type { DeferredDeepLinkRoute } from '../../../../shared/lib/deep-links/types';

/**
 * A restored context is only usable when it still describes the deferred link
 * the normal deferred-link parser accepted. Keeping this decision in one place
 * stops onboarding and the install pipeline from drifting apart.
 *
 * @param pendingReferral - The context captured by the background.
 * @param deferredReferringLink - The referring link read from install attribution.
 * @param deferredResult - The result of the normal deferred-link parser.
 * @returns Whether the restored context may resume the flow.
 */
export function isDeferredReferralContextValid(
  pendingReferral: MoneyReferralContext | null,
  deferredReferringLink: string | undefined,
  deferredResult: DeferredDeepLinkRoute,
): boolean {
  return (
    pendingReferral?.entryType === 'restored_context' &&
    pendingReferral.url === deferredReferringLink &&
    Boolean(deferredResult)
  );
}
