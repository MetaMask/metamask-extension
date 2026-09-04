import { act, renderHook, waitFor } from '@testing-library/react';
import { useSelector } from 'react-redux';
import type { AccountGroupId } from '@metamask/account-api';
import type { InternalAccount } from '@metamask/keyring-internal-api';

import { getIsAssetsUnifyStateEnabled } from '../../../../selectors/assets-unify-state';
import { getAllMultichainNetworkConfigurations } from '../../../../selectors/multichain/networks';
import { getNetworkConfigurationsByChainId } from '../../../../../shared/lib/selectors/networks';
import { getInternalAccountsFromGroupById } from '../../../../selectors/multichain-accounts/account-tree';
import {
  refreshAssetsForSelectedAccount,
  updateBalancesFoAccounts,
} from '../../../../store/actions';
import { useDispatch } from '../../../../store/hooks';
import { resetAccountGroupAssetLoaderForTests } from '../../utils/account-group-asset-loader';
import { useEnsureAccountGroupAssets } from './useEnsureAccountGroupAssets';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));
jest.mock('../../../../selectors/assets-unify-state', () => ({
  getIsAssetsUnifyStateEnabled: jest.fn(),
}));
jest.mock('../../../../selectors/multichain/networks', () => ({
  getAllMultichainNetworkConfigurations: jest.fn(),
}));
jest.mock('../../../../../shared/lib/selectors/networks', () => ({
  getNetworkConfigurationsByChainId: jest.fn(),
}));
jest.mock('../../../../selectors/multichain-accounts/account-tree', () => ({
  getInternalAccountsFromGroupById: jest.fn(),
}));
jest.mock('../../../../store/actions', () => ({
  refreshAssetsForSelectedAccount: jest.fn(),
  updateBalancesFoAccounts: jest.fn(),
}));
jest.mock('../../../../store/hooks', () => ({
  useDispatch: jest.fn(),
}));

const GROUP_ID = 'entropy:1/0' as AccountGroupId;
const ACCOUNT = {
  id: 'account-1',
  address: '0xabc',
} as InternalAccount;

// Only the keys of these config maps matter — the hook derives its chain lists
// from Object.keys().
const MULTICHAIN_NETWORKS = { 'eip155:1': {} } as never;
const EVM_NETWORKS = { '0x1': {} } as never;

describe('useEnsureAccountGroupAssets', () => {
  const dispatchMock = jest.fn(async (action) =>
    typeof action === 'function' ? action() : action,
  );
  const useSelectorMock = jest.mocked(useSelector);
  const getIsAssetsUnifyStateEnabledMock = jest.mocked(
    getIsAssetsUnifyStateEnabled,
  );
  const getAllMultichainNetworkConfigurationsMock = jest.mocked(
    getAllMultichainNetworkConfigurations,
  );
  const getNetworkConfigurationsByChainIdMock = jest.mocked(
    getNetworkConfigurationsByChainId,
  );
  const getInternalAccountsFromGroupByIdMock = jest.mocked(
    getInternalAccountsFromGroupById,
  );
  const refreshAssetsForSelectedAccountMock = jest.mocked(
    refreshAssetsForSelectedAccount,
  );
  const updateBalancesFoAccountsMock = jest.mocked(updateBalancesFoAccounts);
  const useDispatchMock = jest.mocked(useDispatch);

  beforeEach(() => {
    jest.clearAllMocks();
    resetAccountGroupAssetLoaderForTests();

    useDispatchMock.mockReturnValue(dispatchMock as never);
    getIsAssetsUnifyStateEnabledMock.mockReturnValue(true);
    getAllMultichainNetworkConfigurationsMock.mockReturnValue(
      MULTICHAIN_NETWORKS,
    );
    getNetworkConfigurationsByChainIdMock.mockReturnValue(EVM_NETWORKS);
    getInternalAccountsFromGroupByIdMock.mockReturnValue([ACCOUNT]);
    refreshAssetsForSelectedAccountMock.mockReturnValue((() =>
      Promise.resolve()) as never);
    updateBalancesFoAccountsMock.mockReturnValue((() =>
      Promise.resolve()) as never);

    useSelectorMock.mockImplementation((selector) => {
      if (selector === getIsAssetsUnifyStateEnabled) {
        return getIsAssetsUnifyStateEnabledMock({} as never);
      }
      if (selector === getAllMultichainNetworkConfigurations) {
        return getAllMultichainNetworkConfigurationsMock({} as never);
      }
      if (selector === getNetworkConfigurationsByChainId) {
        return getNetworkConfigurationsByChainIdMock({} as never);
      }
      if (typeof selector === 'function') {
        return selector({} as never);
      }
      return undefined;
    });
  });

  afterEach(() => {
    resetAccountGroupAssetLoaderForTests();
  });

  it('loads assets across all networks via AssetsController when unify state is enabled', async () => {
    const { result } = renderHook(() => useEnsureAccountGroupAssets(GROUP_ID));

    expect(result.current).toBe(true);

    await waitFor(() => {
      expect(refreshAssetsForSelectedAccountMock).toHaveBeenCalledWith(
        [ACCOUNT],
        {
          chainIds: ['eip155:1'],
          assetTypes: ['fungible'],
        },
      );
    });

    await waitFor(() => {
      expect(result.current).toBe(false);
    });
  });

  it('falls back to updateBalances for all accounts when unify is disabled', async () => {
    getIsAssetsUnifyStateEnabledMock.mockReturnValue(false);

    renderHook(() => useEnsureAccountGroupAssets(GROUP_ID));

    await waitFor(() => {
      expect(updateBalancesFoAccountsMock).toHaveBeenCalledWith(['0x1'], true);
    });
    expect(refreshAssetsForSelectedAccountMock).not.toHaveBeenCalled();
  });

  it('does not load when account group id is missing', async () => {
    renderHook(() => useEnsureAccountGroupAssets(undefined));

    await act(async () => {
      await Promise.resolve();
    });

    expect(refreshAssetsForSelectedAccountMock).not.toHaveBeenCalled();
    expect(updateBalancesFoAccountsMock).not.toHaveBeenCalled();
  });

  it('does not request while networks are empty, then retries once they load (unify)', async () => {
    getAllMultichainNetworkConfigurationsMock.mockReturnValue({} as never);

    const { rerender } = renderHook(() =>
      useEnsureAccountGroupAssets(GROUP_ID),
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(refreshAssetsForSelectedAccountMock).not.toHaveBeenCalled();

    // Networks become available on a later render — the group must not have been
    // permanently deduped by the earlier no-chain render.
    getAllMultichainNetworkConfigurationsMock.mockReturnValue(
      MULTICHAIN_NETWORKS,
    );
    rerender();

    await waitFor(() => {
      expect(refreshAssetsForSelectedAccountMock).toHaveBeenCalledWith(
        [ACCOUNT],
        {
          chainIds: ['eip155:1'],
          assetTypes: ['fungible'],
        },
      );
    });
  });

  it('does not request while networks are empty, then retries once they load (legacy)', async () => {
    getIsAssetsUnifyStateEnabledMock.mockReturnValue(false);
    getNetworkConfigurationsByChainIdMock.mockReturnValue({} as never);

    const { rerender } = renderHook(() =>
      useEnsureAccountGroupAssets(GROUP_ID),
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(updateBalancesFoAccountsMock).not.toHaveBeenCalled();

    getNetworkConfigurationsByChainIdMock.mockReturnValue(EVM_NETWORKS);
    rerender();

    await waitFor(() => {
      expect(updateBalancesFoAccountsMock).toHaveBeenCalledWith(['0x1'], true);
    });
  });

  it('does not reload the same group twice in a session', async () => {
    const { rerender } = renderHook(() =>
      useEnsureAccountGroupAssets(GROUP_ID),
    );

    await waitFor(() => {
      expect(refreshAssetsForSelectedAccountMock).toHaveBeenCalledTimes(1);
    });

    rerender();

    await act(async () => {
      await Promise.resolve();
    });

    expect(refreshAssetsForSelectedAccountMock).toHaveBeenCalledTimes(1);
  });
});
