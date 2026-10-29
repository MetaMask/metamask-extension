import { it } from '@jest/globals';
import { renderHook } from '@testing-library/react';
import { useSelector } from 'react-redux';
import type { MultichainNetworkConfiguration } from '@metamask/multichain-network-controller';
import {
  selectAccountGroupBalanceForEmptyState,
  selectAccountGroupBalanceIsLoadedForEmptyState,
  selectIsAssetsLoadingForSelectedAccountGroup,
  selectUnifiedBalanceGetterBySelectedAccountGroup,
} from '../../../../selectors/assets';
import { useAccountGroupBalanceDisplay } from '../account-group-balance-change/useAccountGroupBalanceDisplay';
import { useNetworkPillBalances } from './use-network-pill-balances';

jest.mock('react-redux', () => ({ useSelector: jest.fn() }));
jest.mock('../account-group-balance-change/useAccountGroupBalanceDisplay');

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
  isAssetsLoading = false,
  isNetworkLoading = false,
}: {
  getBalance: (map: Record<string, unknown>) => unknown;
  hasBalance?: boolean;
  isLoaded?: boolean;
  isAssetsLoading?: boolean;
  isNetworkLoading?: boolean;
}) => {
  jest.mocked(useAccountGroupBalanceDisplay).mockReturnValue({
    isLoading: isNetworkLoading,
  } as ReturnType<typeof useAccountGroupBalanceDisplay>);
  jest.mocked(useSelector).mockImplementation((selector: unknown) => {
    const values = new Map<unknown, unknown>([
      [selectUnifiedBalanceGetterBySelectedAccountGroup, getBalance],
      [selectAccountGroupBalanceForEmptyState, hasBalance],
      [selectAccountGroupBalanceIsLoadedForEmptyState, isLoaded],
      [selectIsAssetsLoadingForSelectedAccountGroup, isAssetsLoading],
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
    });
  });

  it('returns no balances when there is no selected account group', () => {
    mockState({ getBalance: () => null });

    const { result } = renderHook(() => useNetworkPillBalances([ETHEREUM]));

    expect(result.current).toStrictEqual({
      balanceByChainId: { 'eip155:1': undefined },
      total: undefined,
      currency: undefined,
    });
  });

  it.each([
    ['the balance data has not loaded', { isLoaded: false }],
    ['the assets are still loading', { isAssetsLoading: true }],
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
