import { renderHook, cleanup } from '@testing-library/react';
import { CaipAssetId } from '@metamask/keyring-api';
import { InternalAccount } from '@metamask/keyring-internal-api';
import type { CaipChainId } from '@metamask/utils';
import { MultichainNetworks } from '../../../../shared/constants/multichain/networks';
import { TRON_SPECIAL_ASSET_CAIP_TYPES } from '../../../../shared/constants/multichain/assets';
import * as assetsSelectors from '../../../selectors/assets';
import { useTronResources } from './useTronResources';

jest.mock('../../../selectors/assets', () => ({
  ...jest.requireActual('../../../selectors/assets'),
  getAssetsBalance: jest.fn(),
}));

jest.mock('react-redux', () => ({
  useSelector: <State, Result>(selector: (state: State) => Result): Result =>
    selector({} as State),
}));

const renderTronResourcesHook = (
  account: InternalAccount | undefined,
  chainId: CaipChainId,
) => renderHook(() => useTronResources(account, chainId));

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

  const chainId = MultichainNetworks.TRON as CaipChainId;

  const specialAssetIds = {
    energy: `${chainId}/${TRON_SPECIAL_ASSET_CAIP_TYPES.ENERGY}` as CaipAssetId,
    maxEnergy:
      `${chainId}/${TRON_SPECIAL_ASSET_CAIP_TYPES.MAXIMUM_ENERGY}` as CaipAssetId,
    bandwidth:
      `${chainId}/${TRON_SPECIAL_ASSET_CAIP_TYPES.BANDWIDTH}` as CaipAssetId,
    maxBandwidth:
      `${chainId}/${TRON_SPECIAL_ASSET_CAIP_TYPES.MAXIMUM_BANDWIDTH}` as CaipAssetId,
    stakedForEnergy:
      `${chainId}/${TRON_SPECIAL_ASSET_CAIP_TYPES.STAKED_FOR_ENERGY}` as CaipAssetId,
    readyForWithdrawal:
      `${chainId}/${TRON_SPECIAL_ASSET_CAIP_TYPES.READY_FOR_WITHDRAWAL}` as CaipAssetId,
    stakingRewards:
      `${chainId}/${TRON_SPECIAL_ASSET_CAIP_TYPES.STAKING_REWARDS}` as CaipAssetId,
    inLockPeriod:
      `${chainId}/${TRON_SPECIAL_ASSET_CAIP_TYPES.IN_LOCK_PERIOD}` as CaipAssetId,
  };

  const nativeAssetId = `${chainId}/slip44:195` as CaipAssetId;

  const mockAssetsBalance = (
    assetsControllerBalances: Record<
      string,
      Record<string, Record<string, unknown>>
    > = {},
  ) => {
    (assetsSelectors.getAssetsBalance as jest.Mock).mockReturnValue(
      assetsControllerBalances,
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('when reading resources from TRX balance metadata', () => {
    it('returns energy and bandwidth from the metadata path', () => {
      mockAssetsBalance({
        [mockAccount.id]: {
          [nativeAssetId]: {
            amount: '583379269',
            metadata: {
              bandwidth: { limit: '34851', available: '34851' },
              energy: { limit: '422103', available: '422103' },
            },
          },
        },
      });

      const { result } = renderTronResourcesHook(mockAccount, chainId);

      expect(result.current.dataState).toBe('available');
      expect(result.current.energy).toEqual({
        type: 'energy',
        current: 422103,
        max: 422103,
        percentage: 100,
      });
      expect(result.current.bandwidth).toEqual({
        type: 'bandwidth',
        current: 34851,
        max: 34851,
        percentage: 100,
      });
    });

    it('keeps real zero values from metadata distinct from unavailable values', () => {
      mockAssetsBalance({
        [mockAccount.id]: {
          [nativeAssetId]: {
            amount: '0',
            metadata: {
              bandwidth: { limit: '34851', available: '0' },
              energy: { limit: '422103', available: '0' },
            },
          },
        },
      });

      const { result } = renderTronResourcesHook(mockAccount, chainId);

      expect(result.current.dataState).toBe('available');
      expect(result.current.energy).toEqual({
        type: 'energy',
        current: 0,
        max: 422103,
        percentage: 0,
      });
      expect(result.current.bandwidth).toEqual({
        type: 'bandwidth',
        current: 0,
        max: 34851,
        percentage: 0,
      });
    });

    it('reports unavailable when a metadata value is null', () => {
      mockAssetsBalance({
        [mockAccount.id]: {
          [nativeAssetId]: {
            amount: '0',
            metadata: {
              bandwidth: { limit: '34851', available: null },
              energy: { limit: '422103', available: '422103' },
            },
          },
        },
      });

      const { result } = renderTronResourcesHook(mockAccount, chainId);

      expect(result.current.dataState).toBe('unavailable');
    });

    it('reports unavailable when a metadata value is malformed', () => {
      mockAssetsBalance({
        [mockAccount.id]: {
          [nativeAssetId]: {
            amount: '0',
            metadata: {
              bandwidth: { limit: '34851', available: 'invalid' },
              energy: { limit: '422103', available: '422103' },
            },
          },
        },
      });

      const { result } = renderTronResourcesHook(mockAccount, chainId);

      expect(result.current.dataState).toBe('unavailable');
    });

    it('reports loading when the TRX balance exists without resource metadata yet', () => {
      mockAssetsBalance({
        [mockAccount.id]: {
          [nativeAssetId]: {
            amount: '583379269',
          },
        },
      });

      const { result } = renderTronResourcesHook(mockAccount, chainId);

      expect(result.current.dataState).toBe('loading');
    });

    it('falls back to special-asset balances for values the metadata lacks', () => {
      mockAssetsBalance({
        [mockAccount.id]: {
          [nativeAssetId]: {
            amount: '0',
            metadata: {
              bandwidth: { limit: '34851', available: '34851' },
            },
          },
          [specialAssetIds.energy]: { amount: '500' },
          [specialAssetIds.maxEnergy]: { amount: '1000' },
        },
      });

      const { result } = renderTronResourcesHook(mockAccount, chainId);

      expect(result.current.dataState).toBe('available');
      expect(result.current.energy).toEqual({
        type: 'energy',
        current: 500,
        max: 1000,
        percentage: 50,
      });
      expect(result.current.bandwidth).toEqual({
        type: 'bandwidth',
        current: 34851,
        max: 34851,
        percentage: 100,
      });
    });

    it('prefers metadata values over special-asset balances', () => {
      mockAssetsBalance({
        [mockAccount.id]: {
          [nativeAssetId]: {
            amount: '0',
            metadata: {
              energy: { limit: '422103', available: '422103' },
            },
          },
          [specialAssetIds.energy]: { amount: '500' },
          [specialAssetIds.maxEnergy]: { amount: '1000' },
        },
      });

      const { result } = renderTronResourcesHook(mockAccount, chainId);

      expect(result.current.energy).toEqual({
        type: 'energy',
        current: 422103,
        max: 422103,
        percentage: 100,
      });
    });
  });

  describe('when reading resources from special-asset balances', () => {
    it('returns energy and bandwidth resources with correct percentages', () => {
      mockAssetsBalance({
        [mockAccount.id]: {
          [specialAssetIds.energy]: { amount: '500' },
          [specialAssetIds.maxEnergy]: { amount: '1000' },
          [specialAssetIds.bandwidth]: { amount: '300' },
          [specialAssetIds.maxBandwidth]: { amount: '600' },
        },
      });

      const { result } = renderTronResourcesHook(mockAccount, chainId);

      expect(result.current.dataState).toBe('available');
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

    it('reports unavailable when only current values exist without max values', () => {
      mockAssetsBalance({
        [mockAccount.id]: {
          [specialAssetIds.energy]: { amount: '250' },
          [specialAssetIds.bandwidth]: { amount: '150' },
        },
      });

      const { result } = renderTronResourcesHook(mockAccount, chainId);

      expect(result.current.dataState).toBe('unavailable');
      expect(result.current.energy.current).toBe(250);
      expect(result.current.energy.max).toBe(0);
    });

    it('reports unavailable when only max values exist without current values', () => {
      mockAssetsBalance({
        [mockAccount.id]: {
          [specialAssetIds.maxEnergy]: { amount: '2000' },
          [specialAssetIds.maxBandwidth]: { amount: '1500' },
        },
      });

      const { result } = renderTronResourcesHook(mockAccount, chainId);

      expect(result.current.dataState).toBe('unavailable');
      expect(result.current.energy.current).toBe(0);
      expect(result.current.energy.max).toBe(2000);
    });

    it('reports unavailable when a balance amount is malformed', () => {
      mockAssetsBalance({
        [mockAccount.id]: {
          [specialAssetIds.energy]: { amount: 'invalid' },
        },
      });

      const { result } = renderTronResourcesHook(mockAccount, chainId);

      expect(result.current.dataState).toBe('unavailable');
      expect(result.current.energy.current).toBe(0);
    });

    it('ignores non-resource asset balances when computing resources', () => {
      mockAssetsBalance({
        [mockAccount.id]: {
          [specialAssetIds.energy]: { amount: '100' },
          [specialAssetIds.maxEnergy]: { amount: '200' },
          [specialAssetIds.bandwidth]: { amount: '50' },
          [specialAssetIds.maxBandwidth]: { amount: '100' },
          [`${chainId}/trc20:TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t` as CaipAssetId]:
            {
              amount: '1000',
            },
        },
      });

      const { result } = renderTronResourcesHook(mockAccount, chainId);

      expect(result.current.dataState).toBe('available');
      expect(result.current.energy.current).toBe(100);
      expect(result.current.bandwidth.current).toBe(50);
    });

    it('ignores staking state assets when computing resources', () => {
      mockAssetsBalance({
        [mockAccount.id]: {
          [specialAssetIds.energy]: { amount: '500' },
          [specialAssetIds.maxEnergy]: { amount: '1000' },
          [specialAssetIds.bandwidth]: { amount: '300' },
          [specialAssetIds.maxBandwidth]: { amount: '600' },
          [specialAssetIds.readyForWithdrawal]: { amount: '100' },
          [specialAssetIds.stakingRewards]: { amount: '50' },
          [specialAssetIds.inLockPeriod]: { amount: '200' },
        },
      });

      const { result } = renderTronResourcesHook(mockAccount, chainId);

      expect(result.current.dataState).toBe('available');
      expect(result.current.energy.current).toBe(500);
      expect(result.current.bandwidth.current).toBe(300);
    });

    it('calculates percentage correctly with full resources', () => {
      mockAssetsBalance({
        [mockAccount.id]: {
          [specialAssetIds.energy]: { amount: '1000' },
          [specialAssetIds.maxEnergy]: { amount: '1000' },
          [specialAssetIds.bandwidth]: { amount: '800' },
          [specialAssetIds.maxBandwidth]: { amount: '800' },
        },
      });

      const { result } = renderTronResourcesHook(mockAccount, chainId);

      expect(result.current.dataState).toBe('available');
      expect(result.current.energy.percentage).toBe(100);
      expect(result.current.bandwidth.percentage).toBe(100);
    });
  });

  describe('data state', () => {
    it('reports loading when no balances exist', () => {
      mockAssetsBalance({ [mockAccount.id]: {} });

      const { result } = renderTronResourcesHook(mockAccount, chainId);

      expect(result.current.dataState).toBe('loading');
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

    it('reports loading when the account balances entry is missing', () => {
      mockAssetsBalance({});

      const { result } = renderTronResourcesHook(mockAccount, chainId);

      expect(result.current.dataState).toBe('loading');
    });

    it('reports loading when the account is undefined', () => {
      mockAssetsBalance({});

      const { result } = renderTronResourcesHook(undefined, chainId);

      expect(result.current.dataState).toBe('loading');
    });

    it('reports loading when the chainId is empty', () => {
      mockAssetsBalance({ [mockAccount.id]: {} });

      const { result } = renderTronResourcesHook(
        mockAccount,
        '' as CaipChainId,
      );

      expect(result.current.dataState).toBe('loading');
    });
  });
});
