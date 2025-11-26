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
import { toChecksumHexAddress } from '@metamask/controller-utils';
import { flushPromises } from '../../../test/lib/timer-helpers';
import { renderHookWithProvider } from '../../../test/lib/render-helpers';
import mockState from '../../../test/data/mock-state.json';
import * as actions from '../../store/actions';
import { useTokenBalances } from '../useTokenBalances';
import { MINUTE } from '../../../shared/constants/time';
import { getTokenBalancesEvm } from '../../selectors/assets';
import * as subscriptionPricingHooks from './useSubscriptionPricing';
import * as subscriptionHooks from './useSubscription';
import { useShieldAddFundTrigger } from './useAddFundTrigger';

jest.mock('../../store/actions');
jest.mock('../../hooks/subscription/useSubscription');
jest.mock('../../hooks/subscription/useSubscriptionPricing');
jest.mock('../../hooks/useTokenBalances', () => {
  const actual = jest.requireActual('../../hooks/useTokenBalances');
  return {
    ...actual,
    useTokenBalances: jest.fn(),
  };
});
// Mock assets selector before importing the hook
jest.mock('../../selectors/assets', () => {
  const actual = jest.requireActual('../../selectors/assets');
  return {
    ...actual,
    getTokenBalancesEvm: jest.fn(),
  };
});
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

// No need to mock hooks from the same file - we'll test the actual implementation

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
  const getTokenBalancesEvmMock = jest.mocked(getTokenBalancesEvm);

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

  function mockSelectedAccount() {
    return {
      address: MOCK_ACCOUNT_ADDRESS,
      id: 'account-1',
    };
  }

  beforeEach(() => {
    jest.resetAllMocks();
    jest.useFakeTimers();

    process.env.METAMASK_SHIELD_ENABLED = 'true';

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      state.metamask.allTokenBalances[MOCK_CHAIN_ID][selectedAccount.address] =
        {};
    }
    // Store balance as string value
    state.metamask.allTokenBalances[MOCK_CHAIN_ID][selectedAccount.address][
      MOCK_TOKEN_ADDRESS
    ] = MOCK_SUFFICIENT_BALANCE;

    // Setup tokenBalances for getTokenBalancesEvm selector
    // Structure: tokenBalances[accountAddress][chainId][tokenAddress] = hexBalance
    if (!state.metamask.tokenBalances) {
      state.metamask.tokenBalances = {};
    }
    if (!state.metamask.tokenBalances[selectedAccount.address]) {
      state.metamask.tokenBalances[selectedAccount.address] = {};
    }
    if (!state.metamask.tokenBalances[selectedAccount.address][MOCK_CHAIN_ID]) {
      state.metamask.tokenBalances[selectedAccount.address][MOCK_CHAIN_ID] = {};
    }
    // Convert string balance to hex format (e.g., "200000000" -> "0xbebc200")
    // Balance is in smallest unit (6 decimals), so 200000000 = 200 * 10^6
    const balanceInHex = `0x${BigInt(MOCK_SUFFICIENT_BALANCE).toString(16)}`;
    // Store balance with both checksum and original address format to ensure lookup works
    const checksumAddress = toChecksumHexAddress(MOCK_TOKEN_ADDRESS);
    state.metamask.tokenBalances[selectedAccount.address][MOCK_CHAIN_ID][
      checksumAddress
    ] = balanceInHex;
    // Also store with original address as fallback
    state.metamask.tokenBalances[selectedAccount.address][MOCK_CHAIN_ID][
      MOCK_TOKEN_ADDRESS
    ] = balanceInHex;

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
      state.metamask.accountsByChainId[MOCK_CHAIN_ID][selectedAccount.address] =
        {
          balance: '0x0',
        };
    }

    // Mock getTokenBalancesEvm selector
    getTokenBalancesEvmMock.mockImplementation(
      (implementationState, accountAddress) => {
        const { metamask } = implementationState;
        if (!metamask?.tokenBalances?.[accountAddress]) {
          return [];
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const balances: any[] = [];
        Object.entries(metamask.tokenBalances[accountAddress]).forEach(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ([chainId, chainBalances]: [string, any]) => {
            Object.entries(chainBalances).forEach(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ([tokenAddress, hexBalance]: [string, any]) => {
                if (hexBalance && hexBalance !== '0x0') {
                  // Find token info from allTokens
                  const tokenInfo = metamask?.allTokens?.[chainId]?.[
                    accountAddress
                  ]?.find(
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (t: any) =>
                      t.address === tokenAddress ||
                      t.address?.toLowerCase() === tokenAddress?.toLowerCase(),
                  );
                  if (tokenInfo) {
                    const balanceNum = parseInt(hexBalance, 16);
                    const divisor = Math.pow(10, tokenInfo.decimals || 6);
                    const balance = (balanceNum / divisor).toString();

                    balances.push({
                      chainId,
                      address: tokenAddress,
                      balance,
                      decimals: tokenInfo.decimals || 6,
                      symbol: tokenInfo.symbol,
                      name: tokenInfo.name,
                      isNative: false,
                    });
                  }
                }
              },
            );
          },
        );
        return balances;
      },
    );

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
    const selectedAccount = mockSelectedAccount();
    state.metamask.tokenBalances[selectedAccount.address][MOCK_CHAIN_ID][
      toChecksumHexAddress(MOCK_TOKEN_ADDRESS)
    ] = `0x${BigInt(MOCK_INSUFFICIENT_BALANCE).toString(16)}`;
    state.metamask.tokenBalances[selectedAccount.address][MOCK_CHAIN_ID][
      MOCK_TOKEN_ADDRESS
    ] = `0x${BigInt(MOCK_INSUFFICIENT_BALANCE).toString(16)}`;

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
