import React from 'react';
import { renderHook, cleanup } from '@testing-library/react-hooks';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CaipAssetId } from '@metamask/keyring-api';
import { Asset } from '@metamask/assets-controllers';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { MultichainNetworks } from '../../../../shared/constants/multichain/networks';
import { TRON_SPECIAL_ASSET_CAIP_TYPES } from '../../../../shared/constants/multichain/assets';
import * as assetsSelectors from '../../../selectors/assets';
import * as multichainSelectors from '../../../selectors/multichain';
import * as assetsUnifyStateSelectors from '../../../selectors/assets-unify-state';
import { useTronResources } from './useTronResources';

const mockGetAccountBalances = jest.fn();

jest.mock('@metamask/keyring-snap-client', () => ({
  KeyringClient: jest.fn().mockImplementation(() => ({
    getAccountBalances: mockGetAccountBalances,
  })),
}));

jest.mock('../../../hooks/accounts/useMultichainWalletSnapSender', () => ({
  MultichainWalletSnapSender: jest.fn(),
}));

// Mock the selectors
jest.mock('../../../selectors/assets', () => ({
  ...jest.requireActual('../../../selectors/assets'),
  getAssetsBySelectedAccountGroupWithTronSpecialAssets: jest.fn(),
}));

jest.mock('../../../selectors/multichain', () => ({
  ...jest.requireActual('../../../selectors/multichain'),
  getMultichainBalances: jest.fn(),
}));

jest.mock('../../../selectors/assets-unify-state', () => ({
  ...jest.requireActual('../../../selectors/assets-unify-state'),
  getIsAssetsUnifyStateEnabled: jest.fn(),
}));

jest.mock('react-redux', () => ({
  useSelector: <State, Result>(selector: (state: State) => Result): Result =>
    selector({} as State),
}));

let queryClient: QueryClient;

const createWrapper = () => {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

const renderTronResourcesHook = (
  account: InternalAccount | undefined,
  chainId: string,
) =>
  renderHook(() => useTronResources(account, chainId), {
    wrapper: createWrapper(),
  });

describe('useTronResources', () => {
  const mockAccount: InternalAccount = {
    id: 'test-account-id',
    address: 'TTestAddress123',
    type: 'tron:account',
    scopes: [MultichainNetworks.TRON],
    metadata: {
      name: 'Test Account',
      keyring: { type: 'HD Key Tree' },
    },
    methods: [],
  } as unknown as InternalAccount;

  const mockSnapAccount: InternalAccount = {
    ...mockAccount,
    metadata: {
      ...mockAccount.metadata,
      snap: {
        id: 'npm:@metamask/tron-wallet-snap',
        enabled: true,
        name: 'Tron',
      },
    },
  } as unknown as InternalAccount;

  const chainId = MultichainNetworks.TRON;

  const createTronSpecialAsset = (
    symbol: string,
    assetId: CaipAssetId,
  ): Asset =>
    ({
      assetId,
      symbol,
      name: symbol,
      decimals: 0,
      image: '',
      isNative: false,
    }) as Asset;

  const mockSelector = (
    assets: Record<string, Asset[]>,
    balances: Record<string, Record<string, { amount: string; unit: string }>>,
    isAssetsUnifyStateEnabled = false,
  ) => {
    (
      assetsSelectors.getAssetsBySelectedAccountGroupWithTronSpecialAssets as unknown as jest.Mock
    ).mockReturnValue(assets);

    (multichainSelectors.getMultichainBalances as jest.Mock).mockReturnValue(
      balances,
    );

    (
      assetsUnifyStateSelectors.getIsAssetsUnifyStateEnabled as unknown as jest.Mock
    ).mockReturnValue(isAssetsUnifyStateEnabled);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAccountBalances.mockReset();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
      logger: {
        log: () => undefined,
        warn: () => undefined,
        // Silence expected error output from rejected snap queries.
        error: () => undefined,
      },
    });
  });

  afterEach(() => {
    cleanup();
    queryClient.clear();
  });

  describe('when account and chainId are provided', () => {
    it('returns energy and bandwidth resources with correct percentages', () => {
      const energyAssetId =
        `${chainId}/${TRON_SPECIAL_ASSET_CAIP_TYPES.ENERGY}` as CaipAssetId;
      const maxEnergyAssetId =
        `${chainId}/${TRON_SPECIAL_ASSET_CAIP_TYPES.MAXIMUM_ENERGY}` as CaipAssetId;
      const bandwidthAssetId =
        `${chainId}/${TRON_SPECIAL_ASSET_CAIP_TYPES.BANDWIDTH}` as CaipAssetId;
      const maxBandwidthAssetId =
        `${chainId}/${TRON_SPECIAL_ASSET_CAIP_TYPES.MAXIMUM_BANDWIDTH}` as CaipAssetId;

      mockSelector(
        {
          [chainId]: [
            createTronSpecialAsset('energy', energyAssetId),
            createTronSpecialAsset('maximum-energy', maxEnergyAssetId),
            createTronSpecialAsset('bandwidth', bandwidthAssetId),
            createTronSpecialAsset('maximum-bandwidth', maxBandwidthAssetId),
          ],
        },
        {
          [mockAccount.id]: {
            [energyAssetId]: { amount: '500', unit: 'energy' },
            [maxEnergyAssetId]: { amount: '1000', unit: 'energy' },
            [bandwidthAssetId]: { amount: '300', unit: 'bandwidth' },
            [maxBandwidthAssetId]: { amount: '600', unit: 'bandwidth' },
          },
        },
      );

      const { result } = renderTronResourcesHook(mockAccount, chainId);

      expect(result.current.energy).toEqual({
        type: 'energy',
        current: 500,
        max: 1000,
        percentage: 50,
      });

      expect(result.current.bandwidth).toEqual({
        type: 'bandwidth',
        current: 300,
        max: 600,
        percentage: 50,
      });
    });

    it('returns zero values with max of 0 when no balances exist', () => {
      const energyAssetId =
        `${chainId}/${TRON_SPECIAL_ASSET_CAIP_TYPES.ENERGY}` as CaipAssetId;
      const bandwidthAssetId =
        `${chainId}/${TRON_SPECIAL_ASSET_CAIP_TYPES.BANDWIDTH}` as CaipAssetId;

      mockSelector(
        {
          [chainId]: [
            createTronSpecialAsset('energy', energyAssetId),
            createTronSpecialAsset('bandwidth', bandwidthAssetId),
          ],
        },
        { [mockAccount.id]: {} },
      );

      const { result } = renderTronResourcesHook(mockAccount, chainId);

      expect(result.current.energy).toEqual({
        type: 'energy',
        current: 0,
        max: 0,
        percentage: 0,
      });

      expect(result.current.bandwidth).toEqual({
        type: 'bandwidth',
        current: 0,
        max: 0,
        percentage: 0,
      });
    });

    it('handles only current values without max values', () => {
      const energyAssetId =
        `${chainId}/${TRON_SPECIAL_ASSET_CAIP_TYPES.ENERGY}` as CaipAssetId;
      const bandwidthAssetId =
        `${chainId}/${TRON_SPECIAL_ASSET_CAIP_TYPES.BANDWIDTH}` as CaipAssetId;

      mockSelector(
        {
          [chainId]: [
            createTronSpecialAsset('energy', energyAssetId),
            createTronSpecialAsset('bandwidth', bandwidthAssetId),
          ],
        },
        {
          [mockAccount.id]: {
            [energyAssetId]: { amount: '250', unit: 'energy' },
            [bandwidthAssetId]: { amount: '150', unit: 'bandwidth' },
          },
        },
      );

      const { result } = renderTronResourcesHook(mockAccount, chainId);

      expect(result.current.energy).toEqual({
        type: 'energy',
        current: 250,
        max: 0,
        percentage: 25000, // 250 / 1 * 100 (divisor is Math.max(1, 0) = 1)
      });

      expect(result.current.bandwidth).toEqual({
        type: 'bandwidth',
        current: 150,
        max: 0,
        percentage: 15000,
      });
    });

    it('handles only max values without current values', () => {
      const maxEnergyAssetId =
        `${chainId}/${TRON_SPECIAL_ASSET_CAIP_TYPES.MAXIMUM_ENERGY}` as CaipAssetId;
      const maxBandwidthAssetId =
        `${chainId}/${TRON_SPECIAL_ASSET_CAIP_TYPES.MAXIMUM_BANDWIDTH}` as CaipAssetId;

      mockSelector(
        {
          [chainId]: [
            createTronSpecialAsset('maximum-energy', maxEnergyAssetId),
            createTronSpecialAsset('maximum-bandwidth', maxBandwidthAssetId),
          ],
        },
        {
          [mockAccount.id]: {
            [maxEnergyAssetId]: { amount: '2000', unit: 'energy' },
            [maxBandwidthAssetId]: { amount: '1500', unit: 'bandwidth' },
          },
        },
      );

      const { result } = renderTronResourcesHook(mockAccount, chainId);

      expect(result.current.energy).toEqual({
        type: 'energy',
        current: 0,
        max: 2000,
        percentage: 0,
      });

      expect(result.current.bandwidth).toEqual({
        type: 'bandwidth',
        current: 0,
        max: 1500,
        percentage: 0,
      });
    });

    it('filters out non-special Tron assets', () => {
      const energyAssetId =
        `${chainId}/${TRON_SPECIAL_ASSET_CAIP_TYPES.ENERGY}` as CaipAssetId;
      const tokenAssetId =
        `${chainId}/trc20:TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t` as CaipAssetId;

      mockSelector(
        {
          [chainId]: [
            createTronSpecialAsset('energy', energyAssetId),
            {
              assetId: tokenAssetId,
              symbol: 'USDT',
              name: 'Tether USD',
              decimals: 6,
              image: '',
              isNative: false,
            } as Asset,
          ],
        },
        {
          [mockAccount.id]: {
            [energyAssetId]: { amount: '100', unit: 'energy' },
            [tokenAssetId]: { amount: '1000', unit: 'USDT' },
          },
        },
      );

      const { result } = renderTronResourcesHook(mockAccount, chainId);

      expect(result.current.energy).toEqual({
        type: 'energy',
        current: 100,
        max: 0,
        percentage: 10000,
      });

      expect(result.current.bandwidth).toEqual({
        type: 'bandwidth',
        current: 0,
        max: 0,
        percentage: 0,
      });
    });

    it('ignores staking state assets when computing resources', () => {
      const energyAssetId =
        `${chainId}/${TRON_SPECIAL_ASSET_CAIP_TYPES.ENERGY}` as CaipAssetId;
      const readyForWithdrawalId =
        `${chainId}/${TRON_SPECIAL_ASSET_CAIP_TYPES.READY_FOR_WITHDRAWAL}` as CaipAssetId;
      const stakingRewardsId =
        `${chainId}/${TRON_SPECIAL_ASSET_CAIP_TYPES.STAKING_REWARDS}` as CaipAssetId;
      const inLockPeriodId =
        `${chainId}/${TRON_SPECIAL_ASSET_CAIP_TYPES.IN_LOCK_PERIOD}` as CaipAssetId;

      mockSelector(
        {
          [chainId]: [
            createTronSpecialAsset('energy', energyAssetId),
            createTronSpecialAsset(
              '195-ready-for-withdrawal',
              readyForWithdrawalId,
            ),
            createTronSpecialAsset('195-staking-rewards', stakingRewardsId),
            createTronSpecialAsset('195-in-lock-period', inLockPeriodId),
          ],
        },
        {
          [mockAccount.id]: {
            [energyAssetId]: { amount: '500', unit: 'energy' },
            [readyForWithdrawalId]: { amount: '100', unit: 'TRX' },
            [stakingRewardsId]: { amount: '50', unit: 'TRX' },
            [inLockPeriodId]: { amount: '200', unit: 'TRX' },
          },
        },
      );

      const { result } = renderTronResourcesHook(mockAccount, chainId);

      // Staking state assets are included in the special assets filter
      // but should not affect energy/bandwidth output
      expect(result.current.energy).toEqual({
        type: 'energy',
        current: 500,
        max: 0,
        percentage: 50000,
      });

      expect(result.current.bandwidth).toEqual({
        type: 'bandwidth',
        current: 0,
        max: 0,
        percentage: 0,
      });
    });

    it('handles empty assets array', () => {
      mockSelector({ [chainId]: [] }, { [mockAccount.id]: {} });

      const { result } = renderTronResourcesHook(mockAccount, chainId);

      expect(result.current.energy).toEqual({
        type: 'energy',
        current: 0,
        max: 0,
        percentage: 0,
      });

      expect(result.current.bandwidth).toEqual({
        type: 'bandwidth',
        current: 0,
        max: 0,
        percentage: 0,
      });
    });

    it('handles chainId with no assets', () => {
      mockSelector({}, { [mockAccount.id]: {} });

      const { result } = renderTronResourcesHook(mockAccount, chainId);

      expect(result.current.energy).toEqual({
        type: 'energy',
        current: 0,
        max: 0,
        percentage: 0,
      });

      expect(result.current.bandwidth).toEqual({
        type: 'bandwidth',
        current: 0,
        max: 0,
        percentage: 0,
      });
    });

    it('calculates percentage correctly with full resources', () => {
      const energyAssetId =
        `${chainId}/${TRON_SPECIAL_ASSET_CAIP_TYPES.ENERGY}` as CaipAssetId;
      const maxEnergyAssetId =
        `${chainId}/${TRON_SPECIAL_ASSET_CAIP_TYPES.MAXIMUM_ENERGY}` as CaipAssetId;
      const bandwidthAssetId =
        `${chainId}/${TRON_SPECIAL_ASSET_CAIP_TYPES.BANDWIDTH}` as CaipAssetId;
      const maxBandwidthAssetId =
        `${chainId}/${TRON_SPECIAL_ASSET_CAIP_TYPES.MAXIMUM_BANDWIDTH}` as CaipAssetId;

      mockSelector(
        {
          [chainId]: [
            createTronSpecialAsset('energy', energyAssetId),
            createTronSpecialAsset('maximum-energy', maxEnergyAssetId),
            createTronSpecialAsset('bandwidth', bandwidthAssetId),
            createTronSpecialAsset('maximum-bandwidth', maxBandwidthAssetId),
          ],
        },
        {
          [mockAccount.id]: {
            [energyAssetId]: { amount: '1000', unit: 'energy' },
            [maxEnergyAssetId]: { amount: '1000', unit: 'energy' },
            [bandwidthAssetId]: { amount: '800', unit: 'bandwidth' },
            [maxBandwidthAssetId]: { amount: '800', unit: 'bandwidth' },
          },
        },
      );

      const { result } = renderTronResourcesHook(mockAccount, chainId);

      expect(result.current.energy.percentage).toBe(100);
      expect(result.current.bandwidth.percentage).toBe(100);
    });
  });

  describe('when account is undefined', () => {
    it('returns default values', () => {
      mockSelector({}, {});

      const { result } = renderTronResourcesHook(undefined, chainId);

      expect(result.current.energy).toEqual({
        type: 'energy',
        current: 0,
        max: 0,
        percentage: 0,
      });

      expect(result.current.bandwidth).toEqual({
        type: 'bandwidth',
        current: 0,
        max: 0,
        percentage: 0,
      });
    });
  });

  describe('when chainId is empty', () => {
    it('returns default values', () => {
      mockSelector({}, { [mockAccount.id]: {} });

      const { result } = renderTronResourcesHook(mockAccount, '');

      expect(result.current.energy).toEqual({
        type: 'energy',
        current: 0,
        max: 0,
        percentage: 0,
      });

      expect(result.current.bandwidth).toEqual({
        type: 'bandwidth',
        current: 0,
        max: 0,
        percentage: 0,
      });
    });
  });

  describe('when account balances are undefined', () => {
    it('returns default values', () => {
      const energyAssetId =
        `${chainId}/${TRON_SPECIAL_ASSET_CAIP_TYPES.ENERGY}` as CaipAssetId;
      const bandwidthAssetId =
        `${chainId}/${TRON_SPECIAL_ASSET_CAIP_TYPES.BANDWIDTH}` as CaipAssetId;

      mockSelector(
        {
          [chainId]: [
            createTronSpecialAsset('energy', energyAssetId),
            createTronSpecialAsset('bandwidth', bandwidthAssetId),
          ],
        },
        {},
      );

      const { result } = renderTronResourcesHook(mockAccount, chainId);

      expect(result.current.energy).toEqual({
        type: 'energy',
        current: 0,
        max: 0,
        percentage: 0,
      });

      expect(result.current.bandwidth).toEqual({
        type: 'bandwidth',
        current: 0,
        max: 0,
        percentage: 0,
      });
    });
  });

  describe('when balance amount is invalid', () => {
    it('handles NaN values gracefully', () => {
      const energyAssetId =
        `${chainId}/${TRON_SPECIAL_ASSET_CAIP_TYPES.ENERGY}` as CaipAssetId;

      mockSelector(
        {
          [chainId]: [createTronSpecialAsset('energy', energyAssetId)],
        },
        {
          [mockAccount.id]: {
            [energyAssetId]: { amount: 'invalid', unit: 'energy' },
          },
        },
      );

      const { result } = renderTronResourcesHook(mockAccount, chainId);

      expect(result.current.energy.current).toBeNaN();
      expect(result.current.energy.percentage).toBeNaN();
    });
  });

  describe('when the unified AssetsController state is enabled', () => {
    const energyAssetId =
      `${chainId}/${TRON_SPECIAL_ASSET_CAIP_TYPES.ENERGY}` as CaipAssetId;
    const maxEnergyAssetId =
      `${chainId}/${TRON_SPECIAL_ASSET_CAIP_TYPES.MAXIMUM_ENERGY}` as CaipAssetId;
    const bandwidthAssetId =
      `${chainId}/${TRON_SPECIAL_ASSET_CAIP_TYPES.BANDWIDTH}` as CaipAssetId;
    const maxBandwidthAssetId =
      `${chainId}/${TRON_SPECIAL_ASSET_CAIP_TYPES.MAXIMUM_BANDWIDTH}` as CaipAssetId;

    it('falls back to fetching balances directly from the snap', async () => {
      // Redux state is empty because the new AssetsController strips assets
      // without metadata. The hook should still surface values fetched from
      // the snap directly.
      mockSelector({}, {}, true);

      mockGetAccountBalances.mockResolvedValue({
        [energyAssetId]: { amount: '500', unit: 'energy' },
        [maxEnergyAssetId]: { amount: '1000', unit: 'energy' },
        [bandwidthAssetId]: { amount: '300', unit: 'bandwidth' },
        [maxBandwidthAssetId]: { amount: '600', unit: 'bandwidth' },
      });

      const { result, waitFor } = renderTronResourcesHook(
        mockSnapAccount,
        chainId,
      );

      await waitFor(() => expect(result.current.energy.current).toBe(500));

      expect(mockGetAccountBalances).toHaveBeenCalledWith(mockSnapAccount.id, [
        energyAssetId,
        maxEnergyAssetId,
        bandwidthAssetId,
        maxBandwidthAssetId,
      ]);

      expect(result.current.energy).toEqual({
        type: 'energy',
        current: 500,
        max: 1000,
        percentage: 50,
      });

      expect(result.current.bandwidth).toEqual({
        type: 'bandwidth',
        current: 300,
        max: 600,
        percentage: 50,
      });
    });

    it('does not call the snap when the account has no snap metadata', () => {
      mockSelector({}, {}, true);

      renderTronResourcesHook(mockAccount, chainId);

      expect(mockGetAccountBalances).not.toHaveBeenCalled();
    });

    it('returns zero values when the snap call fails', async () => {
      mockSelector({}, {}, true);

      mockGetAccountBalances.mockRejectedValue(new Error('snap blew up'));

      const { result, waitFor } = renderTronResourcesHook(
        mockSnapAccount,
        chainId,
      );

      await waitFor(() => expect(mockGetAccountBalances).toHaveBeenCalled());

      expect(result.current.energy).toEqual({
        type: 'energy',
        current: 0,
        max: 0,
        percentage: 0,
      });

      expect(result.current.bandwidth).toEqual({
        type: 'bandwidth',
        current: 0,
        max: 0,
        percentage: 0,
      });
    });

    it('does not call the snap when the feature flag is disabled', () => {
      mockSelector({}, {}, false);

      renderTronResourcesHook(mockSnapAccount, chainId);

      expect(mockGetAccountBalances).not.toHaveBeenCalled();
    });

    it('does not call the snap when the chainId is not a Tron chain', () => {
      mockSelector({}, {}, true);

      renderTronResourcesHook(
        mockSnapAccount,
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
      );

      expect(mockGetAccountBalances).not.toHaveBeenCalled();
    });

    it('does not call the snap when the chainId is empty', () => {
      mockSelector({}, {}, true);

      renderTronResourcesHook(mockSnapAccount, '');

      expect(mockGetAccountBalances).not.toHaveBeenCalled();
    });
  });
});
