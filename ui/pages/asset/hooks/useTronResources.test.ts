import { renderHook, cleanup } from '@testing-library/react';
import { CaipAssetId } from '@metamask/keyring-api';
import { InternalAccount } from '@metamask/keyring-internal-api';
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
  chainId: string,
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

  const chainId = MultichainNetworks.TRON;

  const mockAssetsBalance = (
    assetsControllerBalances: Record<
      string,
      Record<string, { amount: string }>
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

      mockAssetsBalance({
        [mockAccount.id]: {
          [energyAssetId]: { amount: '500' },
          [maxEnergyAssetId]: { amount: '1000' },
          [bandwidthAssetId]: { amount: '300' },
          [maxBandwidthAssetId]: { amount: '600' },
        },
      });

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
      mockAssetsBalance({ [mockAccount.id]: {} });

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

      mockAssetsBalance({
        [mockAccount.id]: {
          [energyAssetId]: { amount: '250' },
          [bandwidthAssetId]: { amount: '150' },
        },
      });

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

      mockAssetsBalance({
        [mockAccount.id]: {
          [maxEnergyAssetId]: { amount: '2000' },
          [maxBandwidthAssetId]: { amount: '1500' },
        },
      });

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

    it('ignores non-resource asset balances when computing resources', () => {
      const energyAssetId =
        `${chainId}/${TRON_SPECIAL_ASSET_CAIP_TYPES.ENERGY}` as CaipAssetId;
      const tokenAssetId =
        `${chainId}/trc20:TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t` as CaipAssetId;

      mockAssetsBalance({
        [mockAccount.id]: {
          [energyAssetId]: { amount: '100' },
          [tokenAssetId]: { amount: '1000' },
        },
      });

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

      mockAssetsBalance({
        [mockAccount.id]: {
          [energyAssetId]: { amount: '500' },
          [readyForWithdrawalId]: { amount: '100' },
          [stakingRewardsId]: { amount: '50' },
          [inLockPeriodId]: { amount: '200' },
        },
      });

      const { result } = renderTronResourcesHook(mockAccount, chainId);

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

    it('handles empty account balances', () => {
      mockAssetsBalance({ [mockAccount.id]: {} });

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

    it('handles missing account balances entry', () => {
      mockAssetsBalance({});

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

      mockAssetsBalance({
        [mockAccount.id]: {
          [energyAssetId]: { amount: '1000' },
          [maxEnergyAssetId]: { amount: '1000' },
          [bandwidthAssetId]: { amount: '800' },
          [maxBandwidthAssetId]: { amount: '800' },
        },
      });

      const { result } = renderTronResourcesHook(mockAccount, chainId);

      expect(result.current.energy.percentage).toBe(100);
      expect(result.current.bandwidth.percentage).toBe(100);
    });
  });

  describe('when account is undefined', () => {
    it('returns default values', () => {
      mockAssetsBalance({});

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
      mockAssetsBalance({ [mockAccount.id]: {} });

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

  describe('when balance amount is invalid', () => {
    it('handles NaN values gracefully', () => {
      const energyAssetId =
        `${chainId}/${TRON_SPECIAL_ASSET_CAIP_TYPES.ENERGY}` as CaipAssetId;

      mockAssetsBalance({
        [mockAccount.id]: {
          [energyAssetId]: { amount: 'invalid' },
        },
      });

      const { result } = renderTronResourcesHook(mockAccount, chainId);

      expect(result.current.energy.current).toBeNaN();
      expect(result.current.energy.percentage).toBeNaN();
    });
  });
});
