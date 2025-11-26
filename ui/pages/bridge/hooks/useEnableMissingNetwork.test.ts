import * as ReactReduxModule from 'react-redux';
import { renderHook } from '@testing-library/react-hooks';
import * as SelectorsModule from '../../../selectors/multichain/networks';
import * as ActionsModule from '../../../store/actions';
import { useEnableMissingNetwork } from './useEnableMissingNetwork';

// Mock the bridge hooks
jest.mock('../hooks/useGasIncluded7702', () => ({
  useGasIncluded7702: jest.fn().mockReturnValue(false),
}));

jest.mock('../hooks/useIsSendBundleSupported', () => ({
  useIsSendBundleSupported: jest.fn().mockReturnValue(false),
}));

describe('useEnableMissingNetwork', () => {
  const arrangeReactReduxMocks = () => {
    jest
      .spyOn(ReactReduxModule, 'useSelector')
      .mockImplementation((selector) => selector({}));
    jest.spyOn(ReactReduxModule, 'useDispatch').mockReturnValue(jest.fn());
  };

  const arrange = () => {
    arrangeReactReduxMocks();

    const mockGetEnabledNetworksByNamespace = jest
      .spyOn(SelectorsModule, 'getEnabledNetworksByNamespace')
      .mockReturnValue({
        '0x1': true,
        '0xe708': true,
      });
    const mockEnableAllPopularNetworks = jest.spyOn(
      ActionsModule,
      'setEnabledAllPopularNetworks',
    );

    return {
      mockGetEnabledNetworksByNamespace,
      mockEnableAllPopularNetworks,
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('enables popular network when not already enabled', () => {
    const mocks = arrange();
    mocks.mockGetEnabledNetworksByNamespace.mockReturnValue({ '0xe708': true }); // Missing 0x1.
    const hook = renderHook(() => useEnableMissingNetwork());

    // Act - enable 0x1
    hook.result.current('0x1');

    // Assert - Adds 0x1 to enabled networks
    expect(mocks.mockEnableAllPopularNetworks).toHaveBeenCalledWith();
  });

  it('does not enable popular network if already enabled', () => {
    const mocks = arrange();
    const hook = renderHook(() => useEnableMissingNetwork());

    // Act - enable 0x1 (already enabled)
    hook.result.current('0x1');
    expect(mocks.mockEnableAllPopularNetworks).not.toHaveBeenCalled();
  });

  it('does not enable non-popular network', () => {
    const mocks = arrange();
    const hook = renderHook(() => useEnableMissingNetwork());

    hook.result.current('0x1111'); // not popular network
    expect(mocks.mockEnableAllPopularNetworks).not.toHaveBeenCalled();
  });
});
