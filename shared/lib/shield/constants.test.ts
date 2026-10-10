import { isNonUISubscriptionError, SHIELD_ERROR } from './constants';

describe('isNonUISubscriptionError', () => {
  it('returns true for tab action failed errors', () => {
    expect(
      isNonUISubscriptionError(new Error(SHIELD_ERROR.tabActionFailed)),
    ).toBe(true);
  });

  it('returns true when tab action failed is wrapped in a larger message', () => {
    expect(
      isNonUISubscriptionError(
        new Error(
          'Failed to start subscription with card, ' +
            SHIELD_ERROR.tabActionFailed,
        ),
      ),
    ).toBe(true);
  });

  it('returns true for stripe payment cancelled errors', () => {
    expect(
      isNonUISubscriptionError(new Error(SHIELD_ERROR.stripePaymentCancelled)),
    ).toBe(true);
  });

  it('returns false for unexpected subscription errors', () => {
    expect(
      isNonUISubscriptionError(new Error('Subscription already exists')),
    ).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isNonUISubscriptionError(undefined)).toBe(false);
  });
});
