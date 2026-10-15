import { renderHookWithProvider } from '../../test/lib/render-helpers-navigate';
import { createBridgeMockStore } from '../../test/data/bridge/mock-bridge-store';
import * as ActionsModule from '../store/actions';
import { useEnableFeaturedEvmNetwork } from './useEnableFeaturedEvmNetwork';

const mockDispatch = jest.fn();

jest.mock('../store/hooks', () => ({
  useDispatch: () => mockDispatch,
}));

describe('useEnableFeaturedEvmNetwork', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDispatch.mockResolvedValue(undefined);
  });

  it('adds a missing featured network without changing the network filter', async () => {
    mockDispatch.mockResolvedValue({});
    const mockAddNetwork = jest
      .spyOn(ActionsModule, 'addNetwork')
      .mockReturnValue(jest.fn().mockResolvedValue(undefined) as never);
    const hook = renderHookWithProvider(
      () => useEnableFeaturedEvmNetwork(),
      createBridgeMockStore({
        metamaskStateOverrides: {
          networkConfigurationsByChainId: {},
        },
      }),
    );

    await hook.result.current(
      'eip155:137/erc20:0x0000000000000000000000000000000000000000',
    );

    expect(mockAddNetwork).toHaveBeenCalledWith(
      expect.objectContaining({ chainId: '0x89', name: 'Polygon' }),
      { setActive: false },
    );
  });

  it('does not report success when adding the network fails', async () => {
    jest
      .spyOn(ActionsModule, 'addNetwork')
      .mockReturnValue(jest.fn().mockResolvedValue(undefined) as never);
    const hook = renderHookWithProvider(
      () => useEnableFeaturedEvmNetwork(),
      createBridgeMockStore({
        metamaskStateOverrides: {
          networkConfigurationsByChainId: {},
        },
      }),
    );

    await expect(
      hook.result.current(
        'eip155:137/erc20:0x0000000000000000000000000000000000000000',
      ),
    ).resolves.toBeNull();
  });
});
