import React from 'react';
import { act } from '@testing-library/react';
import mockState from '../../../../test/data/mock-state.json';
import { renderHookWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { AccountTreeWallets } from '../../../selectors/multichain-accounts/account-tree.types';
import { useAccountListSearch } from './useAccountListSearch';

const mockWallets = mockState.metamask.accountTree
  .wallets as unknown as AccountTreeWallets;

describe('useAccountListSearch', () => {
  it('returns all wallets when search pattern is empty', () => {
    const { result } = renderHookWithProvider(
      () => useAccountListSearch(mockWallets),
      mockState,
    );

    expect(result.current.filteredWallets).toBe(mockWallets);
    expect(result.current.hasFilteredWallets).toBe(true);
    expect(result.current.isInSearchMode).toBe(false);
    expect(result.current.searchPattern).toBe('');
  });

  it('filters wallets when search pattern is updated', () => {
    const { result } = renderHookWithProvider(
      () => useAccountListSearch(mockWallets),
      mockState,
    );

    act(() => {
      result.current.onSearchBarChange({
        target: { value: 'account 2' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.isInSearchMode).toBe(true);
    expect(result.current.searchPattern).toBe('account 2');
    expect(Object.keys(result.current.filteredWallets).length).toBeLessThan(
      Object.keys(mockWallets).length,
    );
  });

  it('returns no wallets when search pattern matches nothing', () => {
    const { result } = renderHookWithProvider(
      () => useAccountListSearch(mockWallets),
      mockState,
    );

    act(() => {
      result.current.onSearchBarChange({
        target: { value: 'nonexistent account' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.hasFilteredWallets).toBe(false);
    expect(result.current.filteredWallets).toEqual({});
  });

  it('clears search when clearSearch is called', () => {
    const { result } = renderHookWithProvider(
      () => useAccountListSearch(mockWallets),
      mockState,
    );

    act(() => {
      result.current.onSearchBarChange({
        target: { value: 'account 2' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    act(() => {
      result.current.clearSearch();
    });

    expect(result.current.searchPattern).toBe('');
    expect(result.current.isInSearchMode).toBe(false);
    expect(result.current.filteredWallets).toBe(mockWallets);
  });
});
