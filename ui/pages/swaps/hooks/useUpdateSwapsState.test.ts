import { renderHook } from '@testing-library/react-hooks';
import { useDispatch, useSelector } from 'react-redux';
import { waitFor } from '@testing-library/react';
import {
  fetchTokens,
  fetchTopAssets,
  fetchAggregatorMetadata,
} from '../swaps.util';
import {
  fetchAndSetSwapsGasPriceInfo,
  prepareToLeaveSwaps,
  setAggregatorMetadata,
  setTopAssets,
} from '../../../ducks/swaps/swaps';
import { setSwapsTokens } from '../../../store/actions';
import { getCurrentChainId } from '../../../../shared/modules/selectors/networks';
import {
  checkNetworkAndAccountSupports1559,
  getIsSwapsChain,
  getUseExternalServices,
} from '../../../selectors';
import useUpdateSwapsState from './useUpdateSwapsState';

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));

jest.mock('../swaps.util', () => ({
  fetchTokens: jest.fn(),
  fetchTopAssets: jest.fn(),
  fetchAggregatorMetadata: jest.fn(),
}));

jest.mock('../../../ducks/swaps/swaps', () => ({
  fetchAndSetSwapsGasPriceInfo: jest
    .fn()
    .mockReturnValue('fetchAndSetSwapsGasPriceInfo'),
  prepareToLeaveSwaps: jest.fn().mockReturnValue('prepareToLeaveSwaps'),
  setAggregatorMetadata: jest.fn().mockReturnValue('setAggregatorMetadata'),
  setTopAssets: jest.fn().mockReturnValue('setTopAssets'),
}));

jest.mock('../../../store/actions', () => ({
  setSwapsTokens: jest.fn(),
}));

jest.mock('../../../selectors', () => ({
  checkNetworkAndAccountSupports1559: jest.fn(),
  getCurrentChainId: jest.fn(),
  getIsSwapsChain: jest.fn(),
  getUseExternalServices: jest.fn(),
}));

describe('useUpdateSwapsState', () => {
  const mockDispatch = jest.fn();
  const mockState = {
    getCurrentChainId: '1',
    getIsSwapsChain: true,
    checkNetworkAndAccountSupports1559: true,
    getUseExternalServices: true,
  };

  beforeEach(() => {
    (useDispatch as jest.Mock).mockReturnValue(mockDispatch);

    (useSelector as jest.Mock).mockImplementation((selector) => {
      if (selector === getCurrentChainId) {
        return mockState.getCurrentChainId;
      } else if (selector === getIsSwapsChain) {
        return mockState.getIsSwapsChain;
      } else if (selector === checkNetworkAndAccountSupports1559) {
        return mockState.checkNetworkAndAccountSupports1559;
      } else if (selector === getUseExternalServices) {
        return mockState.getUseExternalServices;
      }
      return undefined;
    });

    jest.clearAllMocks();
  });

  it('1559: should fetch tokens, top assets, and aggregator metadata on mount and dispatch respective actions, then refetch when they change', async () => {
    (fetchTokens as jest.Mock).mockResolvedValueOnce(['token1', 'token2']);
    (fetchTopAssets as jest.Mock).mockResolvedValueOnce(['asset1', 'asset2']);
    (fetchAggregatorMetadata as jest.Mock).mockResolvedValueOnce({
      metadata: 'someMetadata',
    });

    await renderHook(() => useUpdateSwapsState());

    expect(fetchTokens).toHaveBeenCalledWith(mockState.getCurrentChainId);
    expect(fetchTopAssets).toHaveBeenCalledWith(mockState.getCurrentChainId);
    expect(fetchAggregatorMetadata).toHaveBeenCalledWith(
      mockState.getCurrentChainId,
    );

    expect(mockDispatch).toHaveBeenCalledWith(
      // TODO: Replace `any` with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setSwapsTokens(['token1', 'token2'] as any),
    );
    expect(mockDispatch).toHaveBeenCalledWith(
      setTopAssets(['asset1', 'asset2']),
    );
    expect(mockDispatch).toHaveBeenCalledWith(
      setAggregatorMetadata({ metadata: 'someMetadata' }),
    );

    expect(mockDispatch).not.toHaveBeenCalledWith(
      fetchAndSetSwapsGasPriceInfo(),
    );

    expect(mockDispatch).not.toHaveBeenCalledWith(prepareToLeaveSwaps());

    expect(mockDispatch).toHaveBeenCalledTimes(3);
  });

  it('not-1559: should fetch tokens, top assets, non-1559 gas price info, and aggregator metadata on mount and dispatch respective actions, then refetch when they change', async () => {
    (fetchTokens as jest.Mock).mockResolvedValueOnce(['token1', 'token2']);
    (fetchTopAssets as jest.Mock).mockResolvedValueOnce(['asset1', 'asset2']);
    (fetchAggregatorMetadata as jest.Mock).mockResolvedValueOnce({
      metadata: 'someMetadata',
    });

    mockState.checkNetworkAndAccountSupports1559 = false;

    await renderHook(() => useUpdateSwapsState());

    expect(fetchTokens).toHaveBeenCalledWith(mockState.getCurrentChainId);
    expect(fetchTopAssets).toHaveBeenCalledWith(mockState.getCurrentChainId);
    expect(fetchAggregatorMetadata).toHaveBeenCalledWith(
      mockState.getCurrentChainId,
    );

    expect(mockDispatch).toHaveBeenCalledWith(
      // TODO: Replace `any` with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setSwapsTokens(['token1', 'token2'] as any),
    );
    expect(mockDispatch).toHaveBeenCalledWith(
      setTopAssets(['asset1', 'asset2']),
    );
    expect(mockDispatch).toHaveBeenCalledWith(
      setAggregatorMetadata({ metadata: 'someMetadata' }),
    );

    expect(mockDispatch).toHaveBeenCalledWith(fetchAndSetSwapsGasPriceInfo());

    expect(mockDispatch).not.toHaveBeenCalledWith(prepareToLeaveSwaps());
  });

  it('should not fetch data if the current chain is not a swaps chain', () => {
    mockState.getIsSwapsChain = false;

    renderHook(() => useUpdateSwapsState());

    expect(fetchTokens).not.toHaveBeenCalled();
    expect(fetchTopAssets).not.toHaveBeenCalled();
    expect(fetchAggregatorMetadata).not.toHaveBeenCalled();
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('should dispatch prepareToLeaveSwaps on unmount', async () => {
    const { unmount } = await renderHook(() => useUpdateSwapsState());

    unmount();

    waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(prepareToLeaveSwaps());
    });
  });
});
