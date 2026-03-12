import { act, waitFor } from '@testing-library/react';
import { cloneDeep } from 'lodash';
import { PAYMENT_TYPES } from '@metamask/subscription-controller';
import type { Hex } from '@metamask/utils';
import { addHexPrefix } from 'ethereumjs-util';
import { renderHookWithProvider } from '../../../test/lib/render-helpers-navigate';
import mockState from '../../../test/data/mock-state.json';
import { GasEstimateTypes } from '../../../shared/constants/gas';
import { decGWEIToHexWEI } from '../../../shared/lib/conversion.utils';
import * as actions from '../../store/actions';
import { useGasFeeEstimates } from '../useGasFeeEstimates';
import type { MetaMaskReduxState } from '../../store/store';
import { openWindow } from '../../helpers/utils/window';
import {
  useSubscriptionCryptoApprovalTransaction,
  useShieldRewards,
  useUserSubscriptions,
  useHandleSubscriptionSupportAction,
} from './useSubscription';
import * as subscriptionPricingHooks from './useSubscriptionPricing';
import type { TokenWithApprovalAmount } from './useSubscriptionPricing';

jest.mock('../useGasFeeEstimates');
jest.mock('./useSubscriptionPricing');
jest.mock('../../helpers/utils/window', () => ({
  openWindow: jest.fn(),
}));
jest.mock('../../store/actions', () => ({
  ...jest.requireActual('../../store/actions'),
  estimateGas: jest.fn().mockResolvedValue('0x5208'),
  addTransaction: jest.fn().mockResolvedValue({}),
  getSubscriptionPricing: jest.fn().mockResolvedValue({}),
  getRewardsSeasonMetadata: jest.fn(() => async () => null),
  estimateRewardsPoints: jest.fn(() => async () => null),
  getRewardsHasAccountOptedIn: jest.fn(() => async () => false),
  getSubscriptions: jest.fn(() => async () => []),
}));

const mockUseGasFeeEstimates = jest.mocked(useGasFeeEstimates);
const mockAddTransaction = jest.mocked(actions.addTransaction);
const mockUseSubscriptionPricing = jest.mocked(
  subscriptionPricingHooks.useSubscriptionPricing,
);
const mockOpenWindow = jest.mocked(openWindow);

const MOCK_SELECTED_TOKEN = {
  chainId: '0x1' as Hex,
  address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as Hex,
  approvalAmount: {
    approveAmount: '1000000',
    chainId: '0x1' as Hex,
    paymentAddress: '0x1234567890123456789012345678901234567890' as Hex,
    paymentTokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as Hex,
  },
} satisfies Pick<
  TokenWithApprovalAmount,
  'chainId' | 'address' | 'approvalAmount'
>;

/**
 * Helper to mock EIP-1559 fee market gas estimates
 *
 * @param lowPriorityFee
 * @param mediumPriorityFee
 * @param baseFee
 */
function mockFeeMarketGasEstimates(
  lowPriorityFee: string,
  mediumPriorityFee: string,
  baseFee: string,
) {
  mockUseGasFeeEstimates.mockReturnValue({
    gasFeeEstimates: {
      low: { suggestedMaxPriorityFeePerGas: lowPriorityFee },
      medium: { suggestedMaxPriorityFeePerGas: mediumPriorityFee },
      estimatedBaseFee: baseFee,
    },
    gasEstimateType: GasEstimateTypes.feeMarket,
    isGasEstimatesLoading: false,
    isGasEstimateLoading: false,
    isNetworkBusy: false,
  } as unknown as ReturnType<typeof useGasFeeEstimates>);
}

/**
 * Helper to mock legacy gas estimates (non-EIP-1559)
 *
 * @param gasPrice
 */
function mockLegacyGasEstimates(gasPrice: string) {
  mockUseGasFeeEstimates.mockReturnValue({
    gasFeeEstimates: { gasPrice },
    gasEstimateType: GasEstimateTypes.legacy,
    isGasEstimatesLoading: false,
    isGasEstimateLoading: false,
    isNetworkBusy: false,
  } as unknown as ReturnType<typeof useGasFeeEstimates>);
}

describe('useSubscriptionCryptoApprovalTransaction', () => {
  let state: MetaMaskReduxState;

  beforeEach(() => {
    jest.clearAllMocks();
    state = cloneDeep(mockState) as unknown as MetaMaskReduxState;

    // Mock network configuration
    (state.metamask.networkConfigurationsByChainId as Record<string, unknown>) =
      {
        '0x1': {
          chainId: '0x1',
          rpcEndpoints: [{ networkClientId: 'mainnet' }],
          defaultRpcEndpointIndex: 0,
        },
      };

    // Mock useSubscriptionPricing hook
    mockUseSubscriptionPricing.mockReturnValue({
      subscriptionPricing: {
        products: [],
        paymentMethods: [
          {
            type: PAYMENT_TYPES.byCrypto,
            chains: [
              {
                chainId: '0x1',
                paymentAddress: '0x1234567890123456789012345678901234567890',
                tokens: [],
              },
            ],
          },
        ],
      },
      loading: false,
      error: undefined,
    });
  });

  describe('gas fee optimization: min(2 * low, medium)', () => {
    it('uses 2 * low as priorityFee when 2 * low < medium', async () => {
      // low = 1.0, medium = 2.5 → min(2*1.0, 2.5) = min(2.0, 2.5) = 2.0
      mockFeeMarketGasEstimates('1.0', '2.5', '50.0');

      const { result } = renderHookWithProvider(
        () => useSubscriptionCryptoApprovalTransaction(MOCK_SELECTED_TOKEN),
        state,
      );

      await act(async () => {
        await result.current.execute();
      });

      await waitFor(() => {
        expect(mockAddTransaction).toHaveBeenCalled();
      });

      const [txParams] = mockAddTransaction.mock.calls[0];
      // priorityFee = min(2 * 1.0, 2.5) = 2.0 GWEI
      expect(txParams.maxPriorityFeePerGas).toBe(
        addHexPrefix(decGWEIToHexWEI(2.0)),
      );
      expect(txParams.maxFeePerGas).toBeUndefined();
    });

    it('uses medium as priorityFee when 2 * low > medium', async () => {
      // low = 2.0, medium = 2.5 → min(2*2.0, 2.5) = min(4.0, 2.5) = 2.5
      mockFeeMarketGasEstimates('2.0', '2.5', '50.0');

      const { result } = renderHookWithProvider(
        () => useSubscriptionCryptoApprovalTransaction(MOCK_SELECTED_TOKEN),
        state,
      );

      await act(async () => {
        await result.current.execute();
      });

      await waitFor(() => {
        expect(mockAddTransaction).toHaveBeenCalled();
      });

      const [txParams] = mockAddTransaction.mock.calls[0];
      // priorityFee = min(2 * 2.0, 2.5) = 2.5 GWEI
      expect(txParams.maxPriorityFeePerGas).toBe(
        addHexPrefix(decGWEIToHexWEI(2.5)),
      );
      expect(txParams.maxFeePerGas).toBeUndefined();
    });

    it('does not set gas fees on non-EIP-1559 networks', async () => {
      mockLegacyGasEstimates('20');

      const { result } = renderHookWithProvider(
        () => useSubscriptionCryptoApprovalTransaction(MOCK_SELECTED_TOKEN),
        state,
      );

      await act(async () => {
        await result.current.execute();
      });

      await waitFor(() => {
        expect(mockAddTransaction).toHaveBeenCalled();
      });

      const [txParams] = mockAddTransaction.mock.calls[0];
      // No EIP-1559 gas fees should be set
      expect(txParams.maxPriorityFeePerGas).toBeUndefined();
      expect(txParams.maxFeePerGas).toBeUndefined();
    });

    it('uses either value when 2 * low equals medium', async () => {
      // low = 1.5, medium = 3.0 → min(2*1.5, 3.0) = min(3.0, 3.0) = 3.0
      mockFeeMarketGasEstimates('1.5', '3.0', '50.0');

      const { result } = renderHookWithProvider(
        () => useSubscriptionCryptoApprovalTransaction(MOCK_SELECTED_TOKEN),
        state,
      );

      await act(async () => {
        await result.current.execute();
      });

      await waitFor(() => {
        expect(mockAddTransaction).toHaveBeenCalled();
      });

      const [txParams] = mockAddTransaction.mock.calls[0];
      // priorityFee = min(2 * 1.5, 3.0) = 3.0 GWEI
      expect(txParams.maxPriorityFeePerGas).toBe(
        addHexPrefix(decGWEIToHexWEI(3.0)),
      );
      expect(txParams.maxFeePerGas).toBeUndefined();
    });

    it('does not set gas fees when gas estimates are missing', async () => {
      mockUseGasFeeEstimates.mockReturnValue({
        gasFeeEstimates: {},
        gasEstimateType: GasEstimateTypes.feeMarket,
        isGasEstimatesLoading: false,
        isGasEstimateLoading: false,
        isNetworkBusy: false,
      } as unknown as ReturnType<typeof useGasFeeEstimates>);

      const { result } = renderHookWithProvider(
        () => useSubscriptionCryptoApprovalTransaction(MOCK_SELECTED_TOKEN),
        state,
      );

      await act(async () => {
        await result.current.execute();
      });

      await waitFor(() => {
        expect(mockAddTransaction).toHaveBeenCalled();
      });

      const [txParams] = mockAddTransaction.mock.calls[0];
      // No gas fees should be set when estimates are missing
      expect(txParams.maxPriorityFeePerGas).toBeUndefined();
      expect(txParams.maxFeePerGas).toBeUndefined();
    });

    it('does not set gas fees when parsed values are NaN', async () => {
      mockUseGasFeeEstimates.mockReturnValue({
        gasFeeEstimates: {
          low: { suggestedMaxPriorityFeePerGas: 'invalid' },
          medium: { suggestedMaxPriorityFeePerGas: '2.5' },
          estimatedBaseFee: '50.0',
        },
        gasEstimateType: GasEstimateTypes.feeMarket,
        isGasEstimatesLoading: false,
        isGasEstimateLoading: false,
        isNetworkBusy: false,
      } as unknown as ReturnType<typeof useGasFeeEstimates>);

      const { result } = renderHookWithProvider(
        () => useSubscriptionCryptoApprovalTransaction(MOCK_SELECTED_TOKEN),
        state,
      );

      await act(async () => {
        await result.current.execute();
      });

      await waitFor(() => {
        expect(mockAddTransaction).toHaveBeenCalled();
      });

      const [txParams] = mockAddTransaction.mock.calls[0];
      // No gas fees should be set when values can't be parsed
      expect(txParams.maxPriorityFeePerGas).toBeUndefined();
      expect(txParams.maxFeePerGas).toBeUndefined();
    });
  });
});

const mockGetRewardsSeasonMetadata =
  actions.getRewardsSeasonMetadata as jest.Mock;
const mockEstimateRewardsPoints = actions.estimateRewardsPoints as jest.Mock;
const mockGetSubscriptions = actions.getSubscriptions as jest.Mock;

describe('useShieldRewards', () => {
  let shieldState: MetaMaskReduxState;

  beforeEach(() => {
    jest.clearAllMocks();
    shieldState = cloneDeep(mockState) as unknown as MetaMaskReduxState;
    // Remove keyrings so caipAccountId is null (simplifies season-only tests)
    (shieldState.metamask as Record<string, unknown>).keyrings = [];
  });

  it('returns isRewardsSeason false when getRewardsSeasonMetadata throws "No valid season metadata" error', async () => {
    mockGetRewardsSeasonMetadata.mockImplementation(() => async () => {
      throw new Error(
        'No valid season metadata could be found for type: current',
      );
    });

    const { result, waitForNextUpdate } = renderHookWithProvider(
      () => useShieldRewards(),
      shieldState,
    );

    await waitForNextUpdate();

    expect(result.current.isRewardsSeason).toBe(false);
    expect(result.current.pending).toBe(false);
  });

  it('surfaces seasonError when getRewardsSeasonMetadata throws a non-season-metadata error', async () => {
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    mockGetRewardsSeasonMetadata.mockImplementation(() => async () => {
      throw new Error('Network error');
    });

    const { result, waitForNextUpdate } = renderHookWithProvider(
      () => useShieldRewards(),
      shieldState,
    );

    await waitForNextUpdate();

    // seasonError triggers the error fallback, returning default values
    expect(result.current.isRewardsSeason).toBe(false);
    expect(result.current.pointsMonthly).toBeNull();
    expect(result.current.pointsYearly).toBeNull();
    expect(result.current.hasAccountOptedIn).toBe(false);
    expect(result.current.pending).toBe(false);

    // Verify the error was logged
    expect(consoleSpy).toHaveBeenCalledWith(
      '[useShieldRewards error]:',
      expect.any(Error),
    );
    consoleSpy.mockRestore();
  });

  it('returns isRewardsSeason true when season metadata is valid and current time is within range', async () => {
    mockGetRewardsSeasonMetadata.mockImplementation(() => async () => ({
      id: 'season-1',
      name: 'Season 1',
      startDate: Date.now() - 1000,
      endDate: Date.now() + 100000,
      tiers: [],
    }));

    const { result, waitForNextUpdate } = renderHookWithProvider(
      () => useShieldRewards(),
      shieldState,
    );

    await waitForNextUpdate();

    expect(result.current.isRewardsSeason).toBe(true);
    expect(result.current.pending).toBe(false);
  });

  it('returns null points when estimateRewardsPoints throws', async () => {
    // Set up keyrings and accounts so caipAccountId is non-null and estimateRewardsPoints runs
    const stateWithKeyrings = cloneDeep(
      mockState,
    ) as unknown as MetaMaskReduxState;

    mockEstimateRewardsPoints.mockImplementation(() => async () => {
      throw new Error('Points estimation failed: 500');
    });

    const { result, waitForNextUpdate } = renderHookWithProvider(
      () => useShieldRewards(),
      stateWithKeyrings,
    );

    await waitForNextUpdate();

    // Points estimation error is caught gracefully, returning null values
    expect(result.current.pointsMonthly).toBeNull();
    expect(result.current.pointsYearly).toBeNull();
    expect(result.current.pending).toBe(false);
  });
});

describe('useUserSubscriptions', () => {
  let state: MetaMaskReduxState;

  beforeEach(() => {
    jest.clearAllMocks();
    state = cloneDeep(mockState) as unknown as MetaMaskReduxState;

    // Set up subscription state
    (state.metamask as Record<string, unknown>).customerId = 'test-customer-id';
    (state.metamask as Record<string, unknown>).subscriptions = [];
    (state.metamask as Record<string, unknown>).trialedProducts = [];
  });

  it('returns subscription data without refetching when refetch is false', async () => {
    const { result, waitForNextUpdate } = renderHookWithProvider(
      () => useUserSubscriptions({ refetch: false }),
      state,
    );

    await waitForNextUpdate();

    expect(result.current.customerId).toBe('test-customer-id');
    expect(result.current.subscriptions).toEqual([]);
    expect(result.current.trialedProducts).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(mockGetSubscriptions).not.toHaveBeenCalled();
  });

  it('returns subscription data without refetching when no options provided', async () => {
    const { result, waitForNextUpdate } = renderHookWithProvider(
      () => useUserSubscriptions(),
      state,
    );

    await waitForNextUpdate();

    expect(result.current.customerId).toBe('test-customer-id');
    expect(result.current.subscriptions).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(mockGetSubscriptions).not.toHaveBeenCalled();
  });

  it('refetches subscriptions when refetch is true', async () => {
    const mockSubscriptions = [
      {
        id: 'sub-1',
        products: [{ name: 'shield' }],
        status: 'active',
      },
    ];

    mockGetSubscriptions.mockImplementation(
      () => async () => mockSubscriptions,
    );

    const { result, waitForNextUpdate } = renderHookWithProvider(
      () => useUserSubscriptions({ refetch: true }),
      state,
    );

    // Initially loading
    expect(result.current.loading).toBe(true);

    await waitForNextUpdate();

    // After loading completes
    expect(result.current.loading).toBe(false);
    expect(mockGetSubscriptions).toHaveBeenCalled();
  });

  it('handles error during refetch', async () => {
    const mockError = new Error('Failed to fetch subscriptions');
    mockGetSubscriptions.mockImplementation(() => async () => {
      throw mockError;
    });

    const { result, waitForNextUpdate } = renderHookWithProvider(
      () => useUserSubscriptions({ refetch: true }),
      state,
    );

    await waitForNextUpdate();

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(mockError);
  });
});

describe('useHandleSubscriptionSupportAction', () => {
  let state: MetaMaskReduxState;
  const mockVersion = '11.0.0';

  beforeEach(() => {
    jest.clearAllMocks();
    state = cloneDeep(mockState) as unknown as MetaMaskReduxState;
    process.env.METAMASK_VERSION = mockVersion;

    // Set up state with profile and metrics IDs
    state.metamask = {
      ...state.metamask,
      metaMetricsId: 'test-metametrics-id',
      srpSessionData: {
        someKey: {
          token: {
            accessToken: 'test-access-token',
            expiresIn: 0,
            obtainedAt: 0,
          },
          profile: {
            identifierId: 'test-identifier-id',
            profileId: 'test-profile-id',
            metaMetricsId: 'test-metametrics-id',
          },
        },
      },
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('opens support link with all user data when available', () => {
    const { result } = renderHookWithProvider(
      () => useHandleSubscriptionSupportAction(),
      state,
    );

    act(() => {
      result.current.handleClickContactSupport();
    });

    const calledUrl = mockOpenWindow.mock.calls[0][0];
    expect(calledUrl).toContain('metamask_version=11.0.0');
    expect(calledUrl).toContain('metamask_profile_id=test-profile-id');
    expect(calledUrl).toContain('metamask_metametrics_id=test-metametrics-id');

    // Verify separator logic: should use correct separator based on SUPPORT_LINK content
    expect(mockOpenWindow).toHaveBeenCalledWith(
      expect.stringContaining('metamask_version='),
    );
  });

  it('includes shield customer ID when available', () => {
    const testState = {
      ...state,
      metamask: {
        ...state.metamask,
        customerId: 'test-shield-customer-id',
        subscriptions: [
          {
            customerId: 'test-shield-customer-id',
            status: 'active',
          },
        ],
      },
    };

    const { result } = renderHookWithProvider(
      () => useHandleSubscriptionSupportAction(),
      testState,
    );

    act(() => {
      result.current.handleClickContactSupport();
    });

    const calledUrl = mockOpenWindow.mock.calls[0][0];
    expect(calledUrl).toContain('shield_id=test-shield-customer-id');
  });

  it('opens support link without optional params when not available', () => {
    state.metamask = {
      ...state.metamask,
      metaMetricsId: null,
      srpSessionData: undefined,
    };

    const { result } = renderHookWithProvider(
      () => useHandleSubscriptionSupportAction(),
      state,
    );

    act(() => {
      result.current.handleClickContactSupport();
    });

    const calledUrl = mockOpenWindow.mock.calls[0][0];
    expect(calledUrl).toContain('metamask_version=11.0.0');
    // Should not include optional params
    expect(calledUrl).not.toContain('metamask_profile_id');
    expect(calledUrl).not.toContain('metamask_metametrics_id');
  });

  it('handles URL separator correctly when building query string', () => {
    const { result } = renderHookWithProvider(
      () => useHandleSubscriptionSupportAction(),
      state,
    );

    act(() => {
      result.current.handleClickContactSupport();
    });

    const calledUrl = mockOpenWindow.mock.calls[0][0];

    // Verify URL is properly formed (no double separators)
    expect(calledUrl).not.toContain('??');
    expect(calledUrl).not.toContain('&&');

    // Verify query params are present
    expect(calledUrl).toMatch(/[?&]metamask_version=11\.0\.0/u);
  });
});
