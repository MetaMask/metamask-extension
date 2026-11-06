import type { MoneyReferralContext } from '../../../../shared/lib/deep-links/money-referral';
import {
  DeferredDeepLinkRouteType,
  type DeferredDeepLinkRoute,
} from '../../../../shared/lib/deep-links/types';
import { buildInterstitialRoute } from '../../../../shared/lib/deep-links/utils';

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

export type PendingReferralResume =
  | { type: 'none' }
  | { type: 'drop'; id: string }
  | { type: 'interstitial'; route: string }
  | {
      type: 'handoff';
      context: MoneyReferralContext;
      continueFirst: boolean;
    };

/**
 * Decides what onboarding should do with a captured link. Direct links and
 * restored install contexts follow the same security rules as the intercepted
 * pipeline; a restored context the deferred parser rejected is dropped instead
 * of resurfacing later.
 *
 * @param options - The pending context and the deferred-link inputs.
 * @param options.pendingReferral - The context captured by the background.
 * @param options.deferredReferringLink - The referring link from install attribution.
 * @param options.deferredResult - The result of the normal deferred-link parser.
 * @returns The navigation plan for onboarding completion.
 */
export function getPendingReferralResume({
  pendingReferral,
  deferredReferringLink,
  deferredResult,
}: {
  pendingReferral: MoneyReferralContext | null;
  deferredReferringLink: string | undefined;
  deferredResult: DeferredDeepLinkRoute;
}): PendingReferralResume {
  if (!pendingReferral) {
    return { type: 'none' };
  }

  const deferredValid = isDeferredReferralContextValid(
    pendingReferral,
    deferredReferringLink,
    deferredResult,
  );
  if (pendingReferral.entryType === 'restored_context' && !deferredValid) {
    return { type: 'drop', id: pendingReferral.id };
  }

  if (pendingReferral.status === 'awaiting_continue') {
    if (
      pendingReferral.entryType === 'restored_context' &&
      deferredValid &&
      deferredResult?.type !== DeferredDeepLinkRouteType.Interstitial
    ) {
      return { type: 'handoff', context: pendingReferral, continueFirst: true };
    }
    const original = new URL(pendingReferral.url);
    return {
      type: 'interstitial',
      route: `${buildInterstitialRoute(original.pathname + original.search)}&referralContext=${encodeURIComponent(pendingReferral.id)}`,
    };
  }

  return { type: 'handoff', context: pendingReferral, continueFirst: false };
}
