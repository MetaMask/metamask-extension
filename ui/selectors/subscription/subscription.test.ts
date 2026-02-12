import { getShieldSubscriptionError } from './subscription';

describe('getShieldSubscriptionError', () => {
  it('returns the error object when set', () => {
    const state = {
      metamask: {
        shieldSubscriptionError: {
          message: 'payer address is already used by another customer',
          code: 'payer_address_already_used',
        },
      },
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = getShieldSubscriptionError(state as any);
    expect(result).toStrictEqual({
      message: 'payer address is already used by another customer',
      code: 'payer_address_already_used',
    });
  });

  it('returns error object without code', () => {
    const state = {
      metamask: {
        shieldSubscriptionError: {
          message: 'some error',
        },
      },
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = getShieldSubscriptionError(state as any);
    expect(result).toStrictEqual({ message: 'some error' });
  });

  it('returns null when no error is set', () => {
    const state = {
      metamask: {
        shieldSubscriptionError: null,
      },
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = getShieldSubscriptionError(state as any);
    expect(result).toBeNull();
  });

  it('returns null when shieldSubscriptionError is undefined', () => {
    const state = {
      metamask: {},
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = getShieldSubscriptionError(state as any);
    expect(result).toBeNull();
  });
});
