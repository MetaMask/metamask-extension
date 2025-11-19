/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderHook } from '@testing-library/react-hooks';
import { CaipAssetId } from '@metamask/keyring-api';
import { Asset } from '@metamask/assets-controllers';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { MultichainNetworks } from '../../../../shared/constants/multichain/networks';
import { TRON_RESOURCE } from '../../../../shared/constants/multichain/assets';
import * as assetsSelectors from '../../../selectors/assets';
import * as multichainSelectors from '../../../selectors/multichain';
import { useTronResources } from './useTronResources';

// Mock the selectors
jest.mock('../../../selectors/assets', () => ({
  ...jest.requireActual('../../../selectors/assets'),
  getAssetsBySelectedAccountGroup: jest.fn(),
}));

jest.mock('../../../selectors/multichain', () => ({
  ...jest.requireActual('../../../selectors/multichain'),
  getMultichainBalances: jest.fn(),
}));

// Mock react-redux
jest.mock('react-redux', () => ({
  useSelector: (selector: any) => selector(),
}));

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

  const createTronResourceAsset = (
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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when account and chainId are provided', () => {
    it('returns energy and bandwidth resources with correct percentages', () => {
      const energyAssetId = `${chainId}/resource:energy` as CaipAssetId;
      const maxEnergyAssetId = `${chainId}/resource:max-energy` as CaipAssetId;
      const bandwidthAssetId = `${chainId}/resource:bandwidth` as CaipAssetId;
      const maxBandwidthAssetId =
        `${chainId}/resource:max-bandwidth` as CaipAssetId;

      (
        assetsSelectors.getAssetsBySelectedAccountGroup as unknown as jest.Mock
      ).mockReturnValue({
        [chainId]: [
          createTronResourceAsset(TRON_RESOURCE.ENERGY, energyAssetId),
          createTronResourceAsset(TRON_RESOURCE.MAX_ENERGY, maxEnergyAssetId),
          createTronResourceAsset(TRON_RESOURCE.BANDWIDTH, bandwidthAssetId),
          createTronResourceAsset(
            TRON_RESOURCE.MAX_BANDWIDTH,
            maxBandwidthAssetId,
          ),
        ],
      });

      (multichainSelectors.getMultichainBalances as jest.Mock).mockReturnValue({
        [mockAccount.id]: {
          [energyAssetId]: { amount: '500', unit: 'energy' },
          [maxEnergyAssetId]: { amount: '1000', unit: 'energy' },
          [bandwidthAssetId]: { amount: '300', unit: 'bandwidth' },
          [maxBandwidthAssetId]: { amount: '600', unit: 'bandwidth' },
        },
      });

      const { result } = renderHook(() =>
        useTronResources(mockAccount, chainId),
      );

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

    it('returns zero values with default max of 1 when no balances exist', () => {
      const energyAssetId = `${chainId}/resource:energy` as CaipAssetId;
      const bandwidthAssetId = `${chainId}/resource:bandwidth` as CaipAssetId;

      (
        assetsSelectors.getAssetsBySelectedAccountGroup as unknown as jest.Mock
      ).mockReturnValue({
        [chainId]: [
          createTronResourceAsset(TRON_RESOURCE.ENERGY, energyAssetId),
          createTronResourceAsset(TRON_RESOURCE.BANDWIDTH, bandwidthAssetId),
        ],
      });

      (multichainSelectors.getMultichainBalances as jest.Mock).mockReturnValue({
        [mockAccount.id]: {},
      });

      const { result } = renderHook(() =>
        useTronResources(mockAccount, chainId),
      );

      expect(result.current.energy).toEqual({
        type: 'energy',
        current: 0,
        max: 1,
        percentage: 0,
      });

      expect(result.current.bandwidth).toEqual({
        type: 'bandwidth',
        current: 0,
        max: 1,
        percentage: 0,
      });
    });

    it('handles only current values without max values', () => {
      const energyAssetId = `${chainId}/resource:energy` as CaipAssetId;
      const bandwidthAssetId = `${chainId}/resource:bandwidth` as CaipAssetId;

      (
        assetsSelectors.getAssetsBySelectedAccountGroup as unknown as jest.Mock
      ).mockReturnValue({
        [chainId]: [
          createTronResourceAsset(TRON_RESOURCE.ENERGY, energyAssetId),
          createTronResourceAsset(TRON_RESOURCE.BANDWIDTH, bandwidthAssetId),
        ],
      });

      (multichainSelectors.getMultichainBalances as jest.Mock).mockReturnValue({
        [mockAccount.id]: {
          [energyAssetId]: { amount: '250', unit: 'energy' },
          [bandwidthAssetId]: { amount: '150', unit: 'bandwidth' },
        },
      });

      const { result } = renderHook(() =>
        useTronResources(mockAccount, chainId),
      );

      expect(result.current.energy).toEqual({
        type: 'energy',
        current: 250,
        max: 1, // Defaults to 1 when max is 0
        percentage: 25000, // 250 / 1 * 100
      });

      expect(result.current.bandwidth).toEqual({
        type: 'bandwidth',
        current: 150,
        max: 1,
        percentage: 15000,
      });
    });

    it('handles only max values without current values', () => {
      const maxEnergyAssetId = `${chainId}/resource:max-energy` as CaipAssetId;
      const maxBandwidthAssetId =
        `${chainId}/resource:max-bandwidth` as CaipAssetId;

      (
        assetsSelectors.getAssetsBySelectedAccountGroup as unknown as jest.Mock
      ).mockReturnValue({
        [chainId]: [
          createTronResourceAsset(TRON_RESOURCE.MAX_ENERGY, maxEnergyAssetId),
          createTronResourceAsset(
            TRON_RESOURCE.MAX_BANDWIDTH,
            maxBandwidthAssetId,
          ),
        ],
      });

      (multichainSelectors.getMultichainBalances as jest.Mock).mockReturnValue({
        [mockAccount.id]: {
          [maxEnergyAssetId]: { amount: '2000', unit: 'energy' },
          [maxBandwidthAssetId]: { amount: '1500', unit: 'bandwidth' },
        },
      });

      const { result } = renderHook(() =>
        useTronResources(mockAccount, chainId),
      );

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

    it('filters out non-Tron resource assets', () => {
      const energyAssetId = `${chainId}/resource:energy` as CaipAssetId;
      const tokenAssetId =
        `${chainId}/token:TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t` as CaipAssetId;

      (
        assetsSelectors.getAssetsBySelectedAccountGroup as unknown as jest.Mock
      ).mockReturnValue({
        [chainId]: [
          createTronResourceAsset(TRON_RESOURCE.ENERGY, energyAssetId),
          {
            assetId: tokenAssetId,
            symbol: 'USDT',
            name: 'Tether USD',
            decimals: 6,
            image: '',
            isNative: false,
          } as Asset,
        ],
      });

      (multichainSelectors.getMultichainBalances as jest.Mock).mockReturnValue({
        [mockAccount.id]: {
          [energyAssetId]: { amount: '100', unit: 'energy' },
          [tokenAssetId]: { amount: '1000', unit: 'USDT' },
        },
      });

      const { result } = renderHook(() =>
        useTronResources(mockAccount, chainId),
      );

      // Should only process the energy resource, not the USDT token
      expect(result.current.energy).toEqual({
        type: 'energy',
        current: 100,
        max: 1,
        percentage: 10000,
      });

      // Bandwidth should be zero since no bandwidth assets exist
      expect(result.current.bandwidth).toEqual({
        type: 'bandwidth',
        current: 0,
        max: 1,
        percentage: 0,
      });
    });

    it('handles empty assets array', () => {
      (
        assetsSelectors.getAssetsBySelectedAccountGroup as unknown as jest.Mock
      ).mockReturnValue({
        [chainId]: [],
      });

      (multichainSelectors.getMultichainBalances as jest.Mock).mockReturnValue({
        [mockAccount.id]: {},
      });

      const { result } = renderHook(() =>
        useTronResources(mockAccount, chainId),
      );

      expect(result.current.energy).toEqual({
        type: 'energy',
        current: 0,
        max: 1,
        percentage: 0,
      });

      expect(result.current.bandwidth).toEqual({
        type: 'bandwidth',
        current: 0,
        max: 1,
        percentage: 0,
      });
    });

    it('handles chainId with no assets', () => {
      (
        assetsSelectors.getAssetsBySelectedAccountGroup as unknown as jest.Mock
      ).mockReturnValue({});

      (multichainSelectors.getMultichainBalances as jest.Mock).mockReturnValue({
        [mockAccount.id]: {},
      });

      const { result } = renderHook(() =>
        useTronResources(mockAccount, chainId),
      );

      expect(result.current.energy).toEqual({
        type: 'energy',
        current: 0,
        max: 1,
        percentage: 0,
      });

      expect(result.current.bandwidth).toEqual({
        type: 'bandwidth',
        current: 0,
        max: 1,
        percentage: 0,
      });
    });

    it('calculates percentage correctly with full resources', () => {
      const energyAssetId = `${chainId}/resource:energy` as CaipAssetId;
      const maxEnergyAssetId = `${chainId}/resource:max-energy` as CaipAssetId;
      const bandwidthAssetId = `${chainId}/resource:bandwidth` as CaipAssetId;
      const maxBandwidthAssetId =
        `${chainId}/resource:max-bandwidth` as CaipAssetId;

      (
        assetsSelectors.getAssetsBySelectedAccountGroup as unknown as jest.Mock
      ).mockReturnValue({
        [chainId]: [
          createTronResourceAsset(TRON_RESOURCE.ENERGY, energyAssetId),
          createTronResourceAsset(TRON_RESOURCE.MAX_ENERGY, maxEnergyAssetId),
          createTronResourceAsset(TRON_RESOURCE.BANDWIDTH, bandwidthAssetId),
          createTronResourceAsset(
            TRON_RESOURCE.MAX_BANDWIDTH,
            maxBandwidthAssetId,
          ),
        ],
      });

      (multichainSelectors.getMultichainBalances as jest.Mock).mockReturnValue({
        [mockAccount.id]: {
          [energyAssetId]: { amount: '1000', unit: 'energy' },
          [maxEnergyAssetId]: { amount: '1000', unit: 'energy' },
          [bandwidthAssetId]: { amount: '800', unit: 'bandwidth' },
          [maxBandwidthAssetId]: { amount: '800', unit: 'bandwidth' },
        },
      });

      const { result } = renderHook(() =>
        useTronResources(mockAccount, chainId),
      );

      expect(result.current.energy.percentage).toBe(100);
      expect(result.current.bandwidth.percentage).toBe(100);
    });
  });

  describe('when account is undefined', () => {
    it('returns default values', () => {
      (
        assetsSelectors.getAssetsBySelectedAccountGroup as unknown as jest.Mock
      ).mockReturnValue({});

      (multichainSelectors.getMultichainBalances as jest.Mock).mockReturnValue(
        {},
      );

      const { result } = renderHook(() => useTronResources(undefined, chainId));

      expect(result.current.energy).toEqual({
        type: 'energy',
        current: 0,
        max: 1,
        percentage: 0,
      });

      expect(result.current.bandwidth).toEqual({
        type: 'bandwidth',
        current: 0,
        max: 1,
        percentage: 0,
      });
    });
  });

  describe('when chainId is empty', () => {
    it('returns default values', () => {
      (
        assetsSelectors.getAssetsBySelectedAccountGroup as unknown as jest.Mock
      ).mockReturnValue({});

      (multichainSelectors.getMultichainBalances as jest.Mock).mockReturnValue({
        [mockAccount.id]: {},
      });

      const { result } = renderHook(() => useTronResources(mockAccount, ''));

      expect(result.current.energy).toEqual({
        type: 'energy',
        current: 0,
        max: 1,
        percentage: 0,
      });

      expect(result.current.bandwidth).toEqual({
        type: 'bandwidth',
        current: 0,
        max: 1,
        percentage: 0,
      });
    });
  });

  describe('when account balances are undefined', () => {
    it('returns default values', () => {
      const energyAssetId = `${chainId}/resource:energy` as CaipAssetId;
      const bandwidthAssetId = `${chainId}/resource:bandwidth` as CaipAssetId;

      (
        assetsSelectors.getAssetsBySelectedAccountGroup as unknown as jest.Mock
      ).mockReturnValue({
        [chainId]: [
          createTronResourceAsset(TRON_RESOURCE.ENERGY, energyAssetId),
          createTronResourceAsset(TRON_RESOURCE.BANDWIDTH, bandwidthAssetId),
        ],
      });

      (multichainSelectors.getMultichainBalances as jest.Mock).mockReturnValue(
        {},
      );

      const { result } = renderHook(() =>
        useTronResources(mockAccount, chainId),
      );

      expect(result.current.energy).toEqual({
        type: 'energy',
        current: 0,
        max: 1,
        percentage: 0,
      });

      expect(result.current.bandwidth).toEqual({
        type: 'bandwidth',
        current: 0,
        max: 1,
        percentage: 0,
      });
    });
  });

  describe('when balance amount is invalid', () => {
    it('handles NaN values gracefully', () => {
      const energyAssetId = `${chainId}/resource:energy` as CaipAssetId;

      (
        assetsSelectors.getAssetsBySelectedAccountGroup as unknown as jest.Mock
      ).mockReturnValue({
        [chainId]: [
          createTronResourceAsset(TRON_RESOURCE.ENERGY, energyAssetId),
        ],
      });

      (multichainSelectors.getMultichainBalances as jest.Mock).mockReturnValue({
        [mockAccount.id]: {
          [energyAssetId]: { amount: 'invalid', unit: 'energy' },
        },
      });

      const { result } = renderHook(() =>
        useTronResources(mockAccount, chainId),
      );

      expect(result.current.energy.current).toBeNaN();
      expect(result.current.energy.percentage).toBeNaN();
    });
  });
});
