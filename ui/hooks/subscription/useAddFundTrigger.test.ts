import { act, waitFor } from '@testing-library/react';
import {
  PRODUCT_TYPES,
  PAYMENT_TYPES,
  RECURRING_INTERVALS,
  SUBSCRIPTION_STATUSES,
  CRYPTO_PAYMENT_METHOD_ERRORS,
  SubscriptionStatus,
} from '@metamask/subscription-controller';
import { cloneDeep } from 'lodash';
import { flushPromises } from '../../../test/lib/timer-helpers';
import { renderHookWithProvider } from '../../../test/lib/render-helpers';
import mockState from '../../../test/data/mock-state.json';
import * as actions from '../../store/actions';
import { MINUTE } from '../../../shared/constants/time';
import { AssetType } from '../../../shared/constants/transaction';
import * as subscriptionPricingHooks from './useSubscriptionPricing';
import * as subscriptionHooks from './useSubscription';
import { useShieldAddFundTrigger } from './useAddFundTrigger';

jest.mock('../../store/actions');
jest.mock('../../hooks/subscription/useSubscription');
jest.mock('../../hooks/subscription/useSubscriptionPricing');
jest.mock('loglevel');

const SHIELD_ADD_FUND_TRIGGER_THROTTLE_TIME = 5 * MINUTE;

const MOCK_ACCOUNT_ADDRESS = '0x1234567890123456789012345678901234567890';
const MOCK_CHAIN_ID = '0x1';
const MOCK_TOKEN_ADDRESS = '0x0000000000000000000000000000000000000000';
const MOCK_TOKEN_SYMBOL = 'usdc';
const MOCK_SUBSCRIPTION_ID = 'subscription-1';
const MOCK_APPROVAL_AMOUNT = '120000000';
const MOCK_SUFFICIENT_BALANCE = '200000000';
const MOCK_INSUFFICIENT_BALANCE = '50000000';

const MOCK_AVAILABLE_TOKEN = {
  address: MOCK_TOKEN_ADDRESS,
  symbol: MOCK_TOKEN_SYMBOL.toUpperCase(),
  decimals: 6,
  approvalAmount: {
    approveAmount: MOCK_APPROVAL_AMOUNT,
    chainId: MOCK_CHAIN_ID,
    paymentAddress: MOCK_ACCOUNT_ADDRESS,
    paymentTokenAddress: MOCK_TOKEN_ADDRESS,
  },
  type: AssetType.token,
  balance: MOCK_SUFFICIENT_BALANCE,
  string: MOCK_SUFFICIENT_BALANCE,
  image: '',
  chainId: MOCK_CHAIN_ID,
} satisfies subscriptionPricingHooks.TokenWithApprovalAmount;

describe('useShieldAddFundTrigger', () => {
  const useUserSubscriptionsMock = jest.mocked(
    subscriptionHooks.useUserSubscriptions,
  );
  const useUserSubscriptionByProductMock = jest.mocked(
    subscriptionHooks.useUserSubscriptionByProduct,
  );
  const useSubscriptionPricingMock = jest.mocked(
    subscriptionPricingHooks.useSubscriptionPricing,
  );
  const useSubscriptionProductPlansMock = jest.mocked(
    subscriptionPricingHooks.useSubscriptionProductPlans,
  );
  const useSubscriptionPaymentMethodsMock = jest.mocked(
    subscriptionPricingHooks.useSubscriptionPaymentMethods,
  );
  const useAvilableTokenBalancesMock = jest.mocked(
    subscriptionPricingHooks.useAvailableTokenBalances,
  );
  const getSubscriptionCryptoApprovalAmountMock = jest.mocked(
    actions.getSubscriptionCryptoApprovalAmount,
  );
  const updateSubscriptionCryptoPaymentMethodMock = jest.mocked(
    actions.updateSubscriptionCryptoPaymentMethod,
  );
  const getSubscriptionsMock = jest.mocked(actions.getSubscriptions);

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let state: any;

  function mockShieldSubscription(
    status: SubscriptionStatus = SUBSCRIPTION_STATUSES.paused,
    error: string | null = CRYPTO_PAYMENT_METHOD_ERRORS.INSUFFICIENT_BALANCE,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): any {
    return {
      id: MOCK_SUBSCRIPTION_ID,
      status,
      interval: RECURRING_INTERVALS.month,
      billingCycles: 1,
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date().toISOString(),
      paymentMethod: {
        type: PAYMENT_TYPES.byCrypto,
        crypto: {
          chainId: MOCK_CHAIN_ID,
          payerAddress: MOCK_ACCOUNT_ADDRESS,
          tokenSymbol: MOCK_TOKEN_SYMBOL,
          error,
        },
      },
      products: [{ name: PRODUCT_TYPES.SHIELD }],
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function mockSubscriptionPricing(): any {
    return {
      products: [],
      paymentMethods: [
        {
          type: PAYMENT_TYPES.byCrypto,
          chains: [
            {
              chainId: MOCK_CHAIN_ID,
              paymentAddress: MOCK_ACCOUNT_ADDRESS,
              tokens: [
                {
                  address: MOCK_TOKEN_ADDRESS,
                  symbol: MOCK_TOKEN_SYMBOL,
                  decimals: 6,
                },
              ],
            },
          ],
        },
      ],
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function mockProductPrice(): any {
    return {
      interval: RECURRING_INTERVALS.month,
      unitAmount: 120_000_000,
      unitDecimals: 6,
      currency: 'usd',
      trialPeriodDays: 0,
      minBillingCycles: 1,
    };
  }

  function mockApprovalAmount() {
    getSubscriptionCryptoApprovalAmountMock.mockResolvedValue({
      approveAmount: MOCK_APPROVAL_AMOUNT,
      chainId: MOCK_CHAIN_ID,
      paymentAddress: MOCK_ACCOUNT_ADDRESS,
      paymentTokenAddress: MOCK_TOKEN_ADDRESS,
    });
  }

  beforeEach(() => {
    jest.resetAllMocks();
    jest.useFakeTimers();

    process.env.METAMASK_SHIELD_ENABLED = 'true';

    state = cloneDeep(mockState);

    useAvilableTokenBalancesMock.mockReturnValue({
      availableTokenBalances: [MOCK_AVAILABLE_TOKEN],
      pending: false,
      error: undefined,
    });

    // Mock hooks
    useUserSubscriptionsMock.mockReturnValue({
      subscriptions: [],
      loading: false,
      error: undefined,
      customerId: undefined,
      trialedProducts: [],
    });
    useUserSubscriptionByProductMock.mockReturnValue(undefined);
    useSubscriptionPricingMock.mockReturnValue({
      subscriptionPricing: undefined,
      loading: false,
      error: undefined,
    });
    useSubscriptionProductPlansMock.mockReturnValue([]);
    useSubscriptionPaymentMethodsMock.mockReturnValue(undefined);

    // Mock actions
    mockApprovalAmount();
    updateSubscriptionCryptoPaymentMethodMock.mockImplementation(
      () => async () => Promise.resolve({}),
    );
    getSubscriptionsMock.mockImplementation(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      () => (() => Promise.resolve([])) as any,
    );
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('does not trigger subscription check when subscription is not paused', () => {
    const activeSubscription = mockShieldSubscription(
      SUBSCRIPTION_STATUSES.active,
    );
    useUserSubscriptionsMock.mockReturnValue({
      subscriptions: [activeSubscription],
      loading: false,
      error: undefined,
      customerId: undefined,
      trialedProducts: [],
    });
    useUserSubscriptionByProductMock.mockReturnValue(activeSubscription);

    renderHookWithProvider(() => useShieldAddFundTrigger(), state);

    act(() => {
      jest.advanceTimersByTime(SHIELD_ADD_FUND_TRIGGER_THROTTLE_TIME + 1000);
    });

    expect(updateSubscriptionCryptoPaymentMethodMock).not.toHaveBeenCalled();
    expect(getSubscriptionsMock).not.toHaveBeenCalled();
  });

  it('does not trigger subscription check when subscription is undefined', () => {
    useUserSubscriptionByProductMock.mockReturnValue(undefined);

    renderHookWithProvider(() => useShieldAddFundTrigger(), state);

    act(() => {
      jest.advanceTimersByTime(SHIELD_ADD_FUND_TRIGGER_THROTTLE_TIME);
    });

    expect(updateSubscriptionCryptoPaymentMethodMock).not.toHaveBeenCalled();
    expect(getSubscriptionsMock).not.toHaveBeenCalled();
  });

  it('does not trigger subscription check when there is no insufficient balance error', () => {
    const subscription = mockShieldSubscription(
      SUBSCRIPTION_STATUSES.paused,
      null,
    );
    useUserSubscriptionsMock.mockReturnValue({
      subscriptions: [subscription],
      loading: false,
      error: undefined,
      customerId: undefined,
      trialedProducts: [],
    });
    useUserSubscriptionByProductMock.mockReturnValue(subscription);

    renderHookWithProvider(() => useShieldAddFundTrigger(), state);

    act(() => {
      jest.advanceTimersByTime(SHIELD_ADD_FUND_TRIGGER_THROTTLE_TIME + 1000);
    });

    expect(updateSubscriptionCryptoPaymentMethodMock).not.toHaveBeenCalled();
    expect(getSubscriptionsMock).not.toHaveBeenCalled();
  });

  it('does not trigger subscription check when token balance is insufficient', () => {
    const subscription = mockShieldSubscription();
    useUserSubscriptionsMock.mockReturnValue({
      subscriptions: [subscription],
      loading: false,
      error: undefined,
      customerId: undefined,
      trialedProducts: [],
    });
    useUserSubscriptionByProductMock.mockReturnValue(subscription);

    // Set insufficient balance in state so the hook returns insufficient balance
    useAvilableTokenBalancesMock.mockReturnValue({
      availableTokenBalances: [
        {
          ...MOCK_AVAILABLE_TOKEN,
          balance: MOCK_INSUFFICIENT_BALANCE,
        },
      ],
      pending: false,
      error: undefined,
    });

    renderHookWithProvider(() => useShieldAddFundTrigger(), state);

    act(() => {
      jest.advanceTimersByTime(SHIELD_ADD_FUND_TRIGGER_THROTTLE_TIME);
    });

    expect(updateSubscriptionCryptoPaymentMethodMock).not.toHaveBeenCalled();
    expect(getSubscriptionsMock).not.toHaveBeenCalled();
  });

  it('triggers subscription check when all conditions are met', async () => {
    const subscription = mockShieldSubscription();
    useUserSubscriptionsMock.mockReturnValue({
      subscriptions: [subscription],
      loading: false,
      error: undefined,
      customerId: undefined,
      trialedProducts: [],
    });
    useUserSubscriptionByProductMock.mockReturnValue(subscription);

    // Mock subscription pricing to ensure selectedTokenPrice is defined
    const subscriptionPricing = mockSubscriptionPricing();
    useSubscriptionPricingMock.mockReturnValue({
      subscriptionPricing,
      loading: false,
      error: undefined,
    });
    useSubscriptionProductPlansMock.mockReturnValue([mockProductPrice()]);
    useSubscriptionPaymentMethodsMock.mockReturnValue(
      subscriptionPricing.paymentMethods[0],
    );

    // Clear any previous mock calls
    updateSubscriptionCryptoPaymentMethodMock.mockClear();
    getSubscriptionsMock.mockClear();

    renderHookWithProvider(() => useShieldAddFundTrigger(), state);

    // Advance timers by throttle interval to allow throttled value to update
    await act(async () => {
      jest.advanceTimersByTime(SHIELD_ADD_FUND_TRIGGER_THROTTLE_TIME);
    });

    // Flush promises to allow async dispatch actions to complete
    await flushPromises();

    // Wait for dispatch actions after throttle delay
    // The updateSubscriptionCryptoPaymentMethod and getSubscriptions are called asynchronously
    await waitFor(
      () => {
        expect(updateSubscriptionCryptoPaymentMethodMock).toHaveBeenCalled();
        expect(getSubscriptionsMock).toHaveBeenCalled();
      },
      { timeout: 3000 },
    );
  });

  it('handles errors when triggering subscription check', async () => {
    const subscription = mockShieldSubscription();
    useUserSubscriptionsMock.mockReturnValue({
      subscriptions: [subscription],
      loading: false,
      error: undefined,
      customerId: undefined,
      trialedProducts: [],
    });
    useUserSubscriptionByProductMock.mockReturnValue(subscription);

    // Mock subscription pricing to ensure selectedTokenPrice is defined
    const subscriptionPricing = mockSubscriptionPricing();
    useSubscriptionPricingMock.mockReturnValue({
      subscriptionPricing,
      loading: false,
      error: undefined,
    });
    useSubscriptionProductPlansMock.mockReturnValue([mockProductPrice()]);
    useSubscriptionPaymentMethodsMock.mockReturnValue(
      subscriptionPricing.paymentMethods[0],
    );

    // Mock actions to throw error
    updateSubscriptionCryptoPaymentMethodMock.mockImplementation(
      () => async () => Promise.reject(new Error('Failed to update')),
    );

    // Clear any previous mock calls
    updateSubscriptionCryptoPaymentMethodMock.mockClear();
    getSubscriptionsMock.mockClear();

    renderHookWithProvider(() => useShieldAddFundTrigger(), state);

    // Advance timers by throttle interval to allow throttled value to update
    await act(async () => {
      jest.advanceTimersByTime(SHIELD_ADD_FUND_TRIGGER_THROTTLE_TIME);
    });

    // Flush promises to allow async dispatch actions to complete
    await flushPromises();

    // Wait for dispatch action attempt after throttle delay
    // The error should be caught and logged, not thrown
    await waitFor(() => {
      expect(updateSubscriptionCryptoPaymentMethodMock).toHaveBeenCalled();
    });

    // Verify error was handled (no exception thrown, but action was attempted)
    expect(updateSubscriptionCryptoPaymentMethodMock).toHaveBeenCalled();
    // getSubscriptions should not be called if updateSubscriptionCryptoPaymentMethod fails
    expect(getSubscriptionsMock).not.toHaveBeenCalled();
  });
});
