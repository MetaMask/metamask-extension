import { act, waitFor } from '@testing-library/react';
import {
  PRODUCT_TYPES,
  PAYMENT_TYPES,
  RECURRING_INTERVALS,
  SUBSCRIPTION_STATUSES,
  CRYPTO_PAYMENT_METHOD_ERRORS,
} from '@metamask/subscription-controller';
import { cloneDeep } from 'lodash';
import { renderHookWithProvider } from '../../../test/lib/render-helpers';
import mockState from '../../../test/data/mock-state.json';
import { useShieldAddFundTrigger } from './useAddFundTrigger';
import * as actions from '../../store/actions';
import * as subscriptionHooks from '../../hooks/subscription/useSubscription';
import * as subscriptionPricingHooks from '../../hooks/subscription/useSubscriptionPricing';
import { useTokenBalances } from '../../hooks/useTokenBalances';
import { MINUTE } from '../../../shared/constants/time';

jest.mock('../../store/actions');
jest.mock('../../hooks/subscription/useSubscription');
jest.mock('../../hooks/subscription/useSubscriptionPricing');
jest.mock('../../hooks/useTokenBalances');
jest.mock('loglevel');

const SHIELD_ADD_FUND_TRIGGER_INTERVAL = 5 * MINUTE;

const MOCK_ACCOUNT_ADDRESS = '0x1234567890123456789012345678901234567890';
const MOCK_CHAIN_ID = '0x1';
const MOCK_TOKEN_ADDRESS = '0x0000000000000000000000000000000000000000';
const MOCK_TOKEN_SYMBOL = 'usdc';
const MOCK_SUBSCRIPTION_ID = 'subscription-1';
const MOCK_APPROVAL_AMOUNT = '120000000';
const MOCK_SUFFICIENT_BALANCE = '200000000';
const MOCK_INSUFFICIENT_BALANCE = '50000000';

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
    status = SUBSCRIPTION_STATUSES.paused,
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

  function mockEvmBalances(balance: string) {
    return [
      {
        chainId: MOCK_CHAIN_ID,
        address: MOCK_TOKEN_ADDRESS,
        balance,
        decimals: 6,
      },
    ];
  }

  function mockApprovalAmount() {
    getSubscriptionCryptoApprovalAmountMock.mockResolvedValue({
      approveAmount: MOCK_APPROVAL_AMOUNT,
      chainId: MOCK_CHAIN_ID,
      paymentAddress: MOCK_ACCOUNT_ADDRESS,
      paymentTokenAddress: MOCK_TOKEN_ADDRESS,
    });
  }

  function mockSelectedAccount() {
    return {
      address: MOCK_ACCOUNT_ADDRESS,
      id: 'account-1',
    };
  }

  beforeEach(() => {
    jest.resetAllMocks();
    jest.useFakeTimers();

    state = cloneDeep(mockState);

    const selectedAccount = mockSelectedAccount();

    // Setup state for selectors to work properly
    if (!state.metamask.internalAccounts) {
      state.metamask.internalAccounts = {
        accounts: {},
        selectedAccount: '',
      };
    }
    state.metamask.internalAccounts.accounts[selectedAccount.id] = {
      id: selectedAccount.id,
      address: selectedAccount.address,
      type: 'eip155:eoa',
      scopes: ['eip155:1'],
      metadata: {
        name: 'Test Account',
        keyring: {
          type: 'HD Key Tree',
        },
      },
    };
    state.metamask.internalAccounts.selectedAccount = selectedAccount.id;

    // Setup token balances for getTokenBalancesEvm selector
    // First, set up allTokens with token metadata (required by getTokensAcrossChainsByAccountAddressSelector)
    if (!state.metamask.allTokens) {
      state.metamask.allTokens = {};
    }
    if (!state.metamask.allTokens[MOCK_CHAIN_ID]) {
      state.metamask.allTokens[MOCK_CHAIN_ID] = {};
    }
    if (!state.metamask.allTokens[MOCK_CHAIN_ID][selectedAccount.address]) {
      state.metamask.allTokens[MOCK_CHAIN_ID][selectedAccount.address] = [];
    }

    // Add token to allTokens array if it doesn't exist
    const tokenExists = state.metamask.allTokens[MOCK_CHAIN_ID][
      selectedAccount.address
    ].some((t: any) => t.address === MOCK_TOKEN_ADDRESS);
    if (!tokenExists) {
      state.metamask.allTokens[MOCK_CHAIN_ID][selectedAccount.address].push({
        address: MOCK_TOKEN_ADDRESS,
        symbol: MOCK_TOKEN_SYMBOL.toUpperCase(),
        decimals: 6,
        name: `${MOCK_TOKEN_SYMBOL.toUpperCase()} Token`,
        isERC721: false,
      });
    }

    // Setup allTokenBalances - stores balance as string value (not object)
    if (!state.metamask.allTokenBalances) {
      state.metamask.allTokenBalances = {};
    }
    if (!state.metamask.allTokenBalances[MOCK_CHAIN_ID]) {
      state.metamask.allTokenBalances[MOCK_CHAIN_ID] = {};
    }
    if (
      !state.metamask.allTokenBalances[MOCK_CHAIN_ID][selectedAccount.address]
    ) {
      state.metamask.allTokenBalances[MOCK_CHAIN_ID][
        selectedAccount.address
      ] = {};
    }
    // Store balance as string value
    state.metamask.allTokenBalances[MOCK_CHAIN_ID][selectedAccount.address][
      MOCK_TOKEN_ADDRESS
    ] = MOCK_SUFFICIENT_BALANCE;

    // Setup accountsByChainId for native balance (required by selector chain)
    if (!state.metamask.accountsByChainId) {
      state.metamask.accountsByChainId = {};
    }
    if (!state.metamask.accountsByChainId[MOCK_CHAIN_ID]) {
      state.metamask.accountsByChainId[MOCK_CHAIN_ID] = {};
    }
    if (
      !state.metamask.accountsByChainId[MOCK_CHAIN_ID][selectedAccount.address]
    ) {
      state.metamask.accountsByChainId[MOCK_CHAIN_ID][
        selectedAccount.address
      ] = {
        balance: '0x0',
      };
    }

    // Mock hooks
    useUserSubscriptionsMock.mockReturnValue({
      subscriptions: [],
      loading: false,
      error: undefined,
      customerId: undefined,
      trialedProducts: [],
    } as any);
    useUserSubscriptionByProductMock.mockReturnValue(undefined);
    useSubscriptionPricingMock.mockReturnValue({
      subscriptionPricing: undefined,
      loading: false,
      error: undefined,
    });
    useSubscriptionProductPlansMock.mockReturnValue([]);
    useSubscriptionPaymentMethodsMock.mockReturnValue(undefined);
    (useTokenBalances as jest.Mock).mockReturnValue({});

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
      SUBSCRIPTION_STATUSES.active as any,
    );
    useUserSubscriptionsMock.mockReturnValue({
      subscriptions: [activeSubscription],
      loading: false,
      error: undefined,
      customerId: undefined,
      trialedProducts: [],
    } as any);
    useUserSubscriptionByProductMock.mockReturnValue(activeSubscription);

    renderHookWithProvider(() => useShieldAddFundTrigger(), state);

    act(() => {
      jest.advanceTimersByTime(SHIELD_ADD_FUND_TRIGGER_INTERVAL + 1000);
    });

    expect(updateSubscriptionCryptoPaymentMethodMock).not.toHaveBeenCalled();
    expect(getSubscriptionsMock).not.toHaveBeenCalled();
  });

  it('does not trigger subscription check when subscription is undefined', () => {
    useUserSubscriptionByProductMock.mockReturnValue(undefined);

    renderHookWithProvider(() => useShieldAddFundTrigger(), state);

    act(() => {
      jest.advanceTimersByTime(SHIELD_ADD_FUND_TRIGGER_INTERVAL);
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
    } as any);
    useUserSubscriptionByProductMock.mockReturnValue(subscription);

    renderHookWithProvider(() => useShieldAddFundTrigger(), state);

    act(() => {
      jest.advanceTimersByTime(SHIELD_ADD_FUND_TRIGGER_INTERVAL + 1000);
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
    } as any);
    useUserSubscriptionByProductMock.mockReturnValue(subscription);

    const subscriptionPricing = mockSubscriptionPricing();
    useSubscriptionPricingMock.mockReturnValue({
      subscriptionPricing,
      loading: false,
      error: undefined,
    } as any);
    useSubscriptionProductPlansMock.mockReturnValue([mockProductPrice()]);
    useSubscriptionPaymentMethodsMock.mockReturnValue(
      subscriptionPricing.paymentMethods[0],
    );

    // Update state with insufficient balance
    const selectedAccount = mockSelectedAccount();
    state.metamask.allTokenBalances[MOCK_CHAIN_ID][selectedAccount.address][
      MOCK_TOKEN_ADDRESS
    ] = MOCK_INSUFFICIENT_BALANCE;

    renderHookWithProvider(() => useShieldAddFundTrigger(), state);

    act(() => {
      jest.advanceTimersByTime(SHIELD_ADD_FUND_TRIGGER_INTERVAL);
    });

    expect(updateSubscriptionCryptoPaymentMethodMock).not.toHaveBeenCalled();
    expect(getSubscriptionsMock).not.toHaveBeenCalled();
  });

  it.only('triggers subscription check when all conditions are met', async () => {
    const subscription = mockShieldSubscription();
    useUserSubscriptionsMock.mockReturnValue({
      subscriptions: [subscription],
      loading: false,
      error: undefined,
      customerId: undefined,
      trialedProducts: [],
    });
    useUserSubscriptionByProductMock.mockReturnValue(subscription);

    const subscriptionPricing = mockSubscriptionPricing();
    useSubscriptionPricingMock.mockReturnValue({
      subscriptionPricing,
      loading: false,
      error: undefined,
    } as any);
    useSubscriptionProductPlansMock.mockReturnValue([mockProductPrice()]);
    useSubscriptionPaymentMethodsMock.mockReturnValue(
      subscriptionPricing.paymentMethods[0],
    );

    renderHookWithProvider(() => useShieldAddFundTrigger(), state);

    await waitFor(() => {
      expect(getSubscriptionCryptoApprovalAmountMock).toHaveBeenCalled();
    });

    act(() => {
      jest.advanceTimersByTime(SHIELD_ADD_FUND_TRIGGER_INTERVAL);
    });

    await waitFor(() => {
      expect(updateSubscriptionCryptoPaymentMethodMock).toHaveBeenCalledWith({
        subscriptionId: subscription.id,
        paymentType: PAYMENT_TYPES.byCrypto,
        recurringInterval: subscription.interval,
        chainId: subscription.paymentMethod.crypto.chainId,
        payerAddress: subscription.paymentMethod.crypto.payerAddress,
        tokenSymbol: subscription.paymentMethod.crypto.tokenSymbol,
        billingCycles: subscription.billingCycles,
        rawTransaction: undefined,
      });
    });

    expect(getSubscriptionsMock).toHaveBeenCalled();
  });

  it('handles errors when triggering subscription check', async () => {
    const subscription = mockShieldSubscription();
    useUserSubscriptionsMock.mockReturnValue({
      subscriptions: [subscription],
      loading: false,
      error: undefined,
      customerId: undefined,
      trialedProducts: [],
    } as any);
    useUserSubscriptionByProductMock.mockReturnValue(subscription);

    const subscriptionPricing = mockSubscriptionPricing();
    useSubscriptionPricingMock.mockReturnValue({
      subscriptionPricing,
      loading: false,
      error: undefined,
    } as any);
    useSubscriptionProductPlansMock.mockReturnValue([mockProductPrice()]);
    useSubscriptionPaymentMethodsMock.mockReturnValue(
      subscriptionPricing.paymentMethods[0],
    );

    updateSubscriptionCryptoPaymentMethodMock.mockImplementation(
      () => async () => Promise.reject(new Error('Failed to update')),
    );

    renderHookWithProvider(() => useShieldAddFundTrigger(), state);

    await waitFor(() => {
      expect(getSubscriptionCryptoApprovalAmountMock).toHaveBeenCalled();
    });

    act(() => {
      jest.advanceTimersByTime(SHIELD_ADD_FUND_TRIGGER_INTERVAL);
    });

    await waitFor(() => {
      expect(updateSubscriptionCryptoPaymentMethodMock).toHaveBeenCalled();
    });

    expect(getSubscriptionsMock).not.toHaveBeenCalled();
  });
});
