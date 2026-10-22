import { renderHook } from '@testing-library/react';
import { useSelector } from 'react-redux';
import { formatChainIdToCaip } from '@metamask/bridge-controller';
import { refreshAssetsForSelectedAccount } from '../store/actions';
import { getSelectedInternalAccount } from '../../shared/lib/selectors/accounts';
import { getEnabledChainIds } from '../selectors';
import { useDispatch } from '../store/hooks';
import { useAssetsUpdateAllAccountBalances } from './useAssetsUpdateAllAccountBalances';

jest.mock('../store/hooks', () => ({
  useDispatch: jest.fn(),
}));

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.mock('../store/actions', () => ({
  refreshAssetsForSelectedAccount: jest.fn(),
}));

jest.mock('../selectors', () => ({
  getEnabledChainIds: jest.fn(),
}));

jest.mock('../../shared/lib/selectors/accounts', () => ({
  getSelectedInternalAccount: jest.fn(),
}));

const mockUseSelector = useSelector as jest.MockedFunction<typeof useSelector>;
const mockUseAppDispatch = useDispatch as jest.MockedFunction<
  typeof useDispatch
>;
const mockRefreshAssetsForSelectedAccount =
  refreshAssetsForSelectedAccount as jest.MockedFunction<
    typeof refreshAssetsForSelectedAccount
  >;

const SELECTED_ACCOUNT = {
  id: 'account-1',
  address: '0xabc',
} as never;

describe('useAssetsUpdateAllAccountBalances', () => {
  let mockDispatch: jest.Mock;

  beforeEach(() => {
    mockDispatch = jest.fn().mockImplementation(() => Promise.resolve());
    mockUseAppDispatch.mockReturnValue(mockDispatch);
    mockRefreshAssetsForSelectedAccount.mockImplementation(
      () => () => Promise.resolve(),
    );

    jest.spyOn(console, 'warn').mockImplementation(() => ({}));

    mockUseSelector.mockImplementation((selector) => {
      if (selector === getEnabledChainIds) {
        return ['0x1', '0x89'];
      }
      if (selector === getSelectedInternalAccount) {
        return SELECTED_ACCOUNT;
      }
      return undefined;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('should return updateBalances function', () => {
    const { result } = renderHook(() => useAssetsUpdateAllAccountBalances());

    expect(result.current).toHaveProperty('updateBalances');
    expect(typeof result.current.updateBalances).toBe('function');
  });

  it('refreshes AssetsController for the selected account when chain ids exist', () => {
    renderHook(() => useAssetsUpdateAllAccountBalances());

    expect(mockRefreshAssetsForSelectedAccount).toHaveBeenCalledWith(
      [SELECTED_ACCOUNT],
      {
        chainIds: [formatChainIdToCaip('0x1'), formatChainIdToCaip('0x89')],
        assetTypes: ['token', 'price', 'metadata'],
      },
    );
    expect(mockDispatch).toHaveBeenCalledWith(expect.any(Function));
  });

  it('does not refresh when enabledChainIds is empty', () => {
    mockUseSelector.mockImplementation((selector) => {
      if (selector === getEnabledChainIds) {
        return [];
      }
      if (selector === getSelectedInternalAccount) {
        return SELECTED_ACCOUNT;
      }
      return undefined;
    });

    renderHook(() => useAssetsUpdateAllAccountBalances());

    expect(mockDispatch).not.toHaveBeenCalled();
    expect(mockRefreshAssetsForSelectedAccount).not.toHaveBeenCalled();
  });

  it('handles manual updateBalances call', async () => {
    const { result } = renderHook(() => useAssetsUpdateAllAccountBalances());

    mockDispatch.mockClear();
    mockRefreshAssetsForSelectedAccount.mockClear();

    await result.current.updateBalances();

    expect(mockRefreshAssetsForSelectedAccount).toHaveBeenCalledWith(
      [SELECTED_ACCOUNT],
      {
        chainIds: [formatChainIdToCaip('0x1'), formatChainIdToCaip('0x89')],
        assetTypes: ['token', 'price', 'metadata'],
      },
    );
    expect(mockDispatch).toHaveBeenCalledWith(expect.any(Function));
  });

  it('handles errors gracefully in updateBalances', async () => {
    const mockError = new Error('Failed to update balances');
    mockDispatch.mockRejectedValueOnce(mockError);

    const { result } = renderHook(() => useAssetsUpdateAllAccountBalances());

    mockDispatch.mockClear();
    mockRefreshAssetsForSelectedAccount.mockClear();
    mockDispatch.mockRejectedValueOnce(mockError);

    await expect(result.current.updateBalances()).resolves.not.toThrow();

    expect(console.warn).toHaveBeenCalledWith(
      'Error updating balances state for all accounts',
      mockError,
    );
  });
});
