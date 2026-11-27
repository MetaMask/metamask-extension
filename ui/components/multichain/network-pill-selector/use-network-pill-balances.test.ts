import { it } from '@jest/globals';
import { renderHook } from '@testing-library/react';
import { useSelector } from 'react-redux';
import type { MultichainNetworkConfiguration } from '@metamask/multichain-network-controller';
import {
  getAssetsBySelectedAccountGroup,
  selectAccountGroupBalanceForEmptyState,
  selectAccountGroupBalanceIsLoadedForEmptyState,
  selectAssetsHaveLoadedForSelectedAccountGroup,
  selectUnifiedBalanceGetterBySelectedAccountGroup,
} from '../../../selectors/assets';
import { useMarketStats } from '../../../hooks/assets/market-stats';
import { useAccountGroupBalanceDisplay } from '../../app/assets/account-group-balance-change/useAccountGroupBalanceDisplay';
import { useNetworkPillBalances } from './use-network-pill-balances';

jest.mock('react-redux', () => ({ useSelector: jest.fn() }));
jest.mock(
  '../../app/assets/account-group-balance-change/useAccountGroupBalanceDisplay',
);
jest.mock('../../../hooks/assets/market-stats', () => ({
  ...jest.requireActual('../../../hooks/assets/market-stats'),
  useMarketStats: jest.fn(),
}));

const ETH_NATIVE_ASSET_ID = 'eip155:1/slip44:60';

const ETHEREUM = {
  chainId: 'eip155:1',
  isEvm: true,
} as unknown as MultichainNetworkConfiguration;
const SOLANA = {
  chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
  isEvm: false,
} as unknown as MultichainNetworkConfiguration;

const mockState = ({
  getBalance,
  hasBalance = false,
  isLoaded = true,
  assetsHaveLoaded = true,
  isNetworkLoading = false,
  assetsByChain = {},
  livePrices = new Map(),
}: {
  getBalance: (map: Record<string, unknown>) => unknown;
  hasBalance?: boolean;
  isLoaded?: boolean;
  assetsHaveLoaded?: boolean;
  isNetworkLoading?: boolean;
  assetsByChain?: Record<string, unknown[]>;
  livePrices?: ReadonlyMap<string, { price: number }>;
}) => {
  jest.mocked(useAccountGroupBalanceDisplay).mockReturnValue({
    isLoading: isNetworkLoading,
  } as ReturnType<typeof useAccountGroupBalanceDisplay>);
  jest
    .mocked(useMarketStats)
    .mockReturnValue(livePrices as ReturnType<typeof useMarketStats>);
  jest.mocked(useSelector).mockImplementation((selector: unknown) => {
    const values = new Map<unknown, unknown>([
      [selectUnifiedBalanceGetterBySelectedAccountGroup, getBalance],
      [selectAccountGroupBalanceForEmptyState, hasBalance],
      [selectAccountGroupBalanceIsLoadedForEmptyState, isLoaded],
      [selectAssetsHaveLoadedForSelectedAccountGroup, assetsHaveLoaded],
      [getAssetsBySelectedAccountGroup, assetsByChain],
    ]);
    return values.get(selector);
  });
};

describe('useNetworkPillBalances', () => {
  it('calculates each network and the total with the selected account group balance', () => {
    const getBalance = jest.fn((map: Record<string, unknown>) => ({
      totalBalanceInUserCurrency: Object.keys(map).length * 10,
      userCurrency: 'usd',
    }));
    mockState({ getBalance });

    const { result } = renderHook(() =>
      useNetworkPillBalances([ETHEREUM, SOLANA]),
    );

    expect(getBalance).toHaveBeenCalledWith({ eip155: { '0x1': true } });
    expect(getBalance).toHaveBeenCalledWith({
      solana: { [SOLANA.chainId]: true },
    });
    expect(getBalance).toHaveBeenCalledWith({
      eip155: { '0x1': true },
      solana: { [SOLANA.chainId]: true },
    });
    expect(result.current).toStrictEqual({
      balanceByChainId: { 'eip155:1': 10, [SOLANA.chainId]: 10 },
      total: 20,
      currency: 'usd',
      isLoading: false,
    });
  });

  it('adds the streamed price change to the network and the total', () => {
    mockState({
      getBalance: () => ({
        totalBalanceInUserCurrency: 100,
        userCurrency: 'usd',
      }),
      assetsByChain: {
        '0x1': [
          {
            assetId: ETH_NATIVE_ASSET_ID,
            chainId: '0x1',
            isNative: true,
            balance: '2',
            fiat: { balance: 100 },
          },
        ],
      },
      livePrices: new Map([[ETH_NATIVE_ASSET_ID, { price: 55 }]]),
    });

    const { result } = renderHook(() => useNetworkPillBalances([ETHEREUM]));

    expect(result.current.balanceByChainId).toStrictEqual({
      'eip155:1': 110,
    });
    expect(result.current.total).toBe(110);
  });

  it('adds a streamed price change outside the pill networks to the total only', () => {
    mockState({
      getBalance: () => ({
        totalBalanceInUserCurrency: 100,
        userCurrency: 'usd',
      }),
      assetsByChain: {
        '0x1': [
          {
            assetId: ETH_NATIVE_ASSET_ID,
            chainId: '0x1',
            isNative: true,
            balance: '2',
            fiat: { balance: 100 },
          },
        ],
        '0x89': [
          {
            assetId:
              'eip155:137/erc20:0x0000000000000000000000000000000000000001',
            chainId: '0x89',
            isNative: false,
            address: '0x0000000000000000000000000000000000000001',
            balance: '1',
            fiat: { balance: 4 },
          },
        ],
      },
      livePrices: new Map([
        [ETH_NATIVE_ASSET_ID, { price: 55 }],
        [
          'eip155:137/erc20:0x0000000000000000000000000000000000000001',
          { price: 5 },
        ],
      ]),
    });

    const { result } = renderHook(() => useNetworkPillBalances([ETHEREUM]));

    expect(result.current.balanceByChainId).toStrictEqual({
      'eip155:1': 110,
    });
    expect(result.current.total).toBe(111);
  });

  it('keeps the polled balance for a network with no streamed price', () => {
    mockState({
      getBalance: () => ({
        totalBalanceInUserCurrency: 100,
        userCurrency: 'usd',
      }),
      assetsByChain: {
        '0x1': [
          {
            assetId: ETH_NATIVE_ASSET_ID,
            chainId: '0x1',
            isNative: true,
            balance: '2',
            fiat: { balance: 100 },
          },
        ],
      },
    });

    const { result } = renderHook(() => useNetworkPillBalances([ETHEREUM]));

    expect(result.current.balanceByChainId).toStrictEqual({
      'eip155:1': 100,
    });
    expect(result.current.total).toBe(100);
  });

  it('returns no balances when there is no selected account group', () => {
    mockState({ getBalance: () => null });

    const { result } = renderHook(() => useNetworkPillBalances([ETHEREUM]));

    expect(result.current).toStrictEqual({
      balanceByChainId: { 'eip155:1': undefined },
      total: undefined,
      currency: undefined,
      isLoading: false,
    });
  });

  it.each([
    ['the balance data has not loaded', { isLoaded: false }],
    ['the first asset load has not settled', { assetsHaveLoaded: false }],
    ['the networks are not available yet', { isNetworkLoading: true }],
  ])('returns no balances while %s', (_, state) => {
    mockState({
      getBalance: () => ({
        totalBalanceInUserCurrency: 0,
        userCurrency: 'usd',
      }),
      ...state,
    });

    const { result } = renderHook(() => useNetworkPillBalances([ETHEREUM]));

    expect(result.current.balanceByChainId).toStrictEqual({
      'eip155:1': undefined,
    });
    expect(result.current.total).toBeUndefined();
    expect(result.current.isLoading).toBe(true);
  });

  it('returns the balances while loading when the account has a balance', () => {
    mockState({
      getBalance: () => ({
        totalBalanceInUserCurrency: 5,
        userCurrency: 'usd',
      }),
      hasBalance: true,
      isLoaded: false,
    });

    const { result } = renderHook(() => useNetworkPillBalances([ETHEREUM]));

    expect(result.current.total).toBe(5);
  });
});
