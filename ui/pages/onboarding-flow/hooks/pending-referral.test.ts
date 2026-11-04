import type { MoneyReferralContext } from '../../../../shared/lib/deep-links/money-referral';
import { DeferredDeepLinkRouteType } from '../../../../shared/lib/deep-links/types';
import { MISSING } from '../../../../shared/lib/deep-links/verify';
import {
  getPendingReferralResume,
  isDeferredReferralContextValid,
} from './pending-referral';

const referringLink = 'https://link.metamask.io/swap?ref=ABC';

function buildContext(
  overrides: Partial<MoneyReferralContext> = {},
): MoneyReferralContext {
  return {
    id: 'restored',
    url: referringLink,
    code: 'ABC',
    entryType: 'restored_context',
    status: 'authorized',
    ...overrides,
  };
}

const deferredResult = {
  type: DeferredDeepLinkRouteType.Navigate as const,
  route: '/bridge',
  signature: MISSING,
};

describe('isDeferredReferralContextValid', () => {
  it('accepts a restored context that matches the deferred link', () => {
    expect(
      isDeferredReferralContextValid(
        buildContext(),
        referringLink,
        deferredResult,
      ),
    ).toBe(true);
  });

  it('rejects a direct-link context', () => {
    expect(
      isDeferredReferralContextValid(
        buildContext({ entryType: 'deeplink' }),
        referringLink,
        deferredResult,
      ),
    ).toBe(false);
  });

  it('rejects a context for a different referring link', () => {
    expect(
      isDeferredReferralContextValid(
        buildContext(),
        'https://link.metamask.io/home?ref=ABC',
        deferredResult,
      ),
    ).toBe(false);
  });

  it('rejects a context when the deferred parser returned nothing', () => {
    expect(
      isDeferredReferralContextValid(buildContext(), referringLink, null),
    ).toBe(false);
  });
});

describe('getPendingReferralResume', () => {
  it('does nothing without a pending context', () => {
    expect(
      getPendingReferralResume({
        pendingReferral: null,
        deferredReferringLink: referringLink,
        deferredResult,
      }),
    ).toStrictEqual({ type: 'none' });
  });

  it('drops a restored context the deferred parser rejected', () => {
    expect(
      getPendingReferralResume({
        pendingReferral: buildContext(),
        deferredReferringLink: referringLink,
        deferredResult: null,
      }),
    ).toStrictEqual({ type: 'drop', id: 'restored' });
  });

  it('sends an unauthorized direct link back to the warning', () => {
    expect(
      getPendingReferralResume({
        pendingReferral: buildContext({
          entryType: 'deeplink',
          status: 'awaiting_continue',
        }),
        deferredReferringLink: undefined,
        deferredResult: null,
      }),
    ).toStrictEqual({
      type: 'interstitial',
      route: '/link?u=%2Fswap%3Fref%3DABC&referralContext=restored',
    });
  });

  it('sends an unauthorized restored link back to the warning when the parser asks for it', () => {
    expect(
      getPendingReferralResume({
        pendingReferral: buildContext({ status: 'awaiting_continue' }),
        deferredReferringLink: referringLink,
        deferredResult: {
          type: DeferredDeepLinkRouteType.Interstitial,
          urlPathAndQuery: '/swap?ref=ABC',
          signature: MISSING,
        },
      }),
    ).toStrictEqual({
      type: 'interstitial',
      route: '/link?u=%2Fswap%3Fref%3DABC&referralContext=restored',
    });
  });

  it('authorizes a restored link when the parser already allowed navigation', () => {
    const context = buildContext({ status: 'awaiting_continue' });
    expect(
      getPendingReferralResume({
        pendingReferral: context,
        deferredReferringLink: referringLink,
        deferredResult,
      }),
    ).toStrictEqual({
      type: 'handoff',
      context,
      continueFirst: true,
    });
  });

  it('hands off an already authorized context without continuing again', () => {
    const context = buildContext();
    expect(
      getPendingReferralResume({
        pendingReferral: context,
        deferredReferringLink: referringLink,
        deferredResult,
      }),
    ).toStrictEqual({
      type: 'handoff',
      context,
      continueFirst: false,
    });
  });
});
