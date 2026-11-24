import { it } from '@jest/globals';
import {
  getDefaultSubscriptionControllerState,
  MoneyAccountFeature,
  PRODUCT_TYPES,
  SUBSCRIPTION_STATUSES,
  type Subscription,
} from '@metamask/subscription-controller';
import {
  getHasAnyMoneyAccountPlusEntitlement,
  getHasMoneyAccountPremiumApyEntitlement,
  getIsMoneyAccountPlusSubscriber,
  getLastSubscriptionByProduct,
  getLatestShieldSubscription,
  getShieldSubscriptionError,
  getSubscriptionByProduct,
} from './subscription';

const makeState = (overrides = {}) => ({
  metamask: {
    ...getDefaultSubscriptionControllerState(),
    showShieldEntryModalOnce: null,
    ...overrides,
  },
});

const shield = {
  products: [{ name: PRODUCT_TYPES.SHIELD }],
  status: SUBSCRIPTION_STATUSES.active,
} as Subscription;
const money = {
  products: [{ name: PRODUCT_TYPES.MONEY_ACCOUNT_PLUS }],
  status: SUBSCRIPTION_STATUSES.provisional,
} as Subscription;

describe('product subscription selectors', () => {
  it('separates current and last subscriptions by product', () => {
    const state = makeState({
      subscriptions: [money, shield],
      lastSubscription: money,
    });

    expect(getSubscriptionByProduct(state, PRODUCT_TYPES.SHIELD)).toBe(shield);
    expect(
      getSubscriptionByProduct(state, PRODUCT_TYPES.MONEY_ACCOUNT_PLUS),
    ).toBe(money);
    expect(
      getLastSubscriptionByProduct(state, PRODUCT_TYPES.SHIELD),
    ).toBeUndefined();
    expect(
      getLastSubscriptionByProduct(state, PRODUCT_TYPES.MONEY_ACCOUNT_PLUS),
    ).toBe(money);
    expect(getLatestShieldSubscription(state)).toBe(shield);
    expect(
      getLatestShieldSubscription(makeState({ lastSubscription: money })),
    ).toBeUndefined();
  });

  it('counts provisional Money Plus subscriptions but not active Shield subscriptions', () => {
    expect(
      getIsMoneyAccountPlusSubscriber(
        makeState({ subscriptions: [shield, money] }),
      ),
    ).toBe(true);
    expect(
      getIsMoneyAccountPlusSubscriber(makeState({ subscriptions: [shield] })),
    ).toBe(false);
  });

  it.each([{ productEntitlements: {} }, { productEntitlements: undefined }])(
    'fails closed with no Money Plus entitlements (%p)',
    (overrides) => {
      const state = makeState(overrides);
      expect(getHasAnyMoneyAccountPlusEntitlement(state)).toBe(false);
      expect(getHasMoneyAccountPremiumApyEntitlement(state)).toBe(false);
    },
  );

  it('reads the Money Plus premium APY entitlement without an active subscription', () => {
    const state = makeState({
      productEntitlements: {
        [PRODUCT_TYPES.MONEY_ACCOUNT_PLUS]: {
          entitlements: { [MoneyAccountFeature.PremiumApy]: true },
        },
      },
    });
    expect(getHasAnyMoneyAccountPlusEntitlement(state)).toBe(true);
    expect(getHasMoneyAccountPremiumApyEntitlement(state)).toBe(true);
    expect(getIsMoneyAccountPlusSubscriber(state)).toBe(false);
  });
});

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
