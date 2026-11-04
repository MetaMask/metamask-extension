import type { MoneyReferralContext } from '../../../../shared/lib/deep-links/money-referral';
import { DeferredDeepLinkRouteType } from '../../../../shared/lib/deep-links/types';
import { MISSING } from '../../../../shared/lib/deep-links/verify';
import { isDeferredReferralContextValid } from './pending-referral';

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
      isDeferredReferralContextValid(buildContext(), referringLink, deferredResult),
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
