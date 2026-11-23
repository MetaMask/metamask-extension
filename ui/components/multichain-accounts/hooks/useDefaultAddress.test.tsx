import React from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { act, renderHook } from '@testing-library/react';
import type { AccountGroupId } from '@metamask/account-api';
import { useDefaultAddress } from './useDefaultAddress';

const mockGetDefaultScopeAndAddressByAccountGroupId = jest.fn();

jest.mock('../../../selectors/multichain-accounts/account-tree', () => ({
  getDefaultScopeAndAddressByAccountGroupId: (...args: unknown[]) =>
    mockGetDefaultScopeAndAddressByAccountGroupId(...args),
}));

const GROUP_ID = 'entropy:test-wallet/0' as AccountGroupId;
const ADDRESS = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc';

const renderUseDefaultAddress = () => {
  const store = configureStore({
    reducer: (state: { updates: number } | undefined, action) => ({
      updates: (state?.updates ?? 0) + (action.type === 'unrelated' ? 1 : 0),
      metamask: {
        preferences: {
          showDefaultAddress: true,
          defaultAddressScope: 'eip155',
        },
      },
    }),
  });
  let renderCount = 0;
  const rendered = renderHook(
    () => {
      renderCount += 1;
      return useDefaultAddress(GROUP_ID);
    },
    {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    },
  );
  return {
    ...rendered,
    getRenderCount: () => renderCount,
    dispatchUnrelatedUpdate: () =>
      act(() => {
        store.dispatch({ type: 'unrelated' });
      }),
  };
};

describe('useDefaultAddress', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the default address and preferences for the group', () => {
    mockGetDefaultScopeAndAddressByAccountGroupId.mockReturnValue({
      defaultAddress: ADDRESS,
      defaultScopes: ['eip155:1'],
    });

    const { result } = renderUseDefaultAddress();

    expect(mockGetDefaultScopeAndAddressByAccountGroupId).toHaveBeenCalledWith(
      expect.anything(),
      GROUP_ID,
    );
    expect(result.current.defaultAddress).toBe(ADDRESS);
    expect(result.current.defaultAddressScope).toBe('eip155');
    expect(result.current.displayDefaultAddress).toBe(ADDRESS);
  });

  it('does not re-render on store updates when the selector recomputes an equal result', () => {
    // Mirrors an LRU cache eviction: a new object with the same address
    mockGetDefaultScopeAndAddressByAccountGroupId.mockImplementation(() => ({
      defaultAddress: ADDRESS,
      defaultScopes: ['eip155:1'],
    }));

    const { getRenderCount, dispatchUnrelatedUpdate } =
      renderUseDefaultAddress();
    const rendersBeforeUpdate = getRenderCount();
    const callsBeforeUpdate =
      mockGetDefaultScopeAndAddressByAccountGroupId.mock.calls.length;

    dispatchUnrelatedUpdate();

    expect(
      mockGetDefaultScopeAndAddressByAccountGroupId.mock.calls.length,
    ).toBeGreaterThan(callsBeforeUpdate);
    expect(getRenderCount()).toBe(rendersBeforeUpdate);
  });

  it('re-renders with the new address when the default address changes', () => {
    const otherAddress = '0x1111111111111111111111111111111111111111';
    mockGetDefaultScopeAndAddressByAccountGroupId.mockReturnValue({
      defaultAddress: ADDRESS,
      defaultScopes: ['eip155:1'],
    });
    const { result, dispatchUnrelatedUpdate } = renderUseDefaultAddress();

    mockGetDefaultScopeAndAddressByAccountGroupId.mockReturnValue({
      defaultAddress: otherAddress,
      defaultScopes: ['eip155:1'],
    });
    dispatchUnrelatedUpdate();

    expect(result.current.defaultAddress).toBe(otherAddress);
  });
});
