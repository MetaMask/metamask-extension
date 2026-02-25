import { renderHook } from '@testing-library/react-hooks';
import { useDispatch, useSelector } from 'react-redux';

import {
  fetchAndSetSwapsGasPriceInfo,
  clearSwapsState,
} from '../../../ducks/swaps/swaps';
import {
  setBackgroundSwapRouteState,
  setSwapsErrorKey,
} from '../../../store/actions';
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

jest.mock('../../../ducks/swaps/swaps', () => ({
  fetchAndSetSwapsGasPriceInfo: jest
    .fn()
    .mockReturnValue('fetchAndSetSwapsGasPriceInfo'),
  clearSwapsState: jest.fn().mockReturnValue('clearSwapsState'),
}));

jest.mock('../../../store/actions', () => ({
  setBackgroundSwapRouteState: jest
    .fn()
    .mockReturnValue('setBackgroundSwapRouteState'),
  setSwapsErrorKey: jest.fn().mockReturnValue('setSwapsErrorKey'),
}));

jest.mock('../../../selectors', () => ({
  checkNetworkAndAccountSupports1559: jest.fn(),
  getIsSwapsChain: jest.fn(),
  getUseExternalServices: jest.fn(),
}));

jest.mock('../../../../shared/modules/selectors/networks', () => ({
  getCurrentChainId: jest.fn(),
}));

describe('useUpdateSwapsState', () => {
  const mockDispatch = jest.fn();
  const mockState = {
    getCurrentChainId: '0x1',
    getIsSwapsChain: true,
    checkNetworkAndAccountSupports1559: true,
    getUseExternalServices: true,
  };

  beforeEach(() => {
    mockState.getCurrentChainId = '0x1';
    mockState.getIsSwapsChain = true;
    mockState.checkNetworkAndAccountSupports1559 = true;
    mockState.getUseExternalServices = true;

    (useDispatch as jest.Mock).mockReturnValue(mockDispatch);
    (useSelector as jest.Mock).mockImplementation((selector) => {
      if (selector === getCurrentChainId) {
        return mockState.getCurrentChainId;
      }
      if (selector === getIsSwapsChain) {
        return mockState.getIsSwapsChain;
      }
      if (selector === checkNetworkAndAccountSupports1559) {
        return mockState.checkNetworkAndAccountSupports1559;
      }
      if (selector === getUseExternalServices) {
        return mockState.getUseExternalServices;
      }
      return undefined;
    });
    jest.clearAllMocks();
  });

  it('dispatches gas price info fetch for non-1559 networks', () => {
    mockState.checkNetworkAndAccountSupports1559 = false;

    renderHook(() => useUpdateSwapsState());

    expect(mockDispatch).toHaveBeenCalledWith(fetchAndSetSwapsGasPriceInfo());
  });

  it('does not dispatch if swaps are unavailable', () => {
    mockState.getIsSwapsChain = false;

    renderHook(() => useUpdateSwapsState());

    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('cleans swaps state on unmount', () => {
    const { unmount } = renderHook(() => useUpdateSwapsState());

    unmount();

    expect(mockDispatch).toHaveBeenCalledWith(clearSwapsState());
    expect(mockDispatch).toHaveBeenCalledWith(setBackgroundSwapRouteState(''));
    expect(mockDispatch).toHaveBeenCalledWith(setSwapsErrorKey(''));
  });
});
