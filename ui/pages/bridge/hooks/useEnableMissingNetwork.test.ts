import { renderHookWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { createBridgeMockStore } from '../../../../test/data/bridge/mock-bridge-store';
import * as ActionsModule from '../../../store/actions';
import { useEnableMissingNetwork } from './useEnableMissingNetwork';

describe('useEnableMissingNetwork', () => {
  const arrange = () => {
    const mockEnableAllPopularNetworks = jest.spyOn(
      ActionsModule,
      'setEnabledAllPopularNetworks',
    );

    return {
      mockEnableAllPopularNetworks,
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('enables popular network when not already enabled', () => {
    const mocks = arrange();
    const hook = renderHookWithProvider(
      () => useEnableMissingNetwork(),
      createBridgeMockStore({
        metamaskStateOverrides: {
          enabledNetworkMap: {
            eip155: {
              '0xe708': true,
            },
          },
        },
      }),
    );

    // Act - enable 0x1
    hook.result.current('0x1');

    // Assert - Adds 0x1 to enabled networks
    expect(mocks.mockEnableAllPopularNetworks).toHaveBeenCalledTimes(1);
  });

  it('does not enable popular network if already enabled', () => {
    const mocks = arrange();
    const hook = renderHookWithProvider(
      () => useEnableMissingNetwork(),
      createBridgeMockStore(),
    );

    // Act - enable 0x1 (already enabled)
    hook.result.current('0x1');
    expect(mocks.mockEnableAllPopularNetworks).not.toHaveBeenCalled();
  });

  it('does not enable non-popular network', () => {
    const mocks = arrange();
    const hook = renderHookWithProvider(
      () => useEnableMissingNetwork(),
      createBridgeMockStore({
        metamaskStateOverrides: {
          enabledNetworkMap: { '0x1': true },
        },
      }),
    );

    hook.result.current('0x1111'); // not popular network
    expect(mocks.mockEnableAllPopularNetworks).not.toHaveBeenCalled();
  });
});
