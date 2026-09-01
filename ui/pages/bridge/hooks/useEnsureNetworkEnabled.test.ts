import { renderHookWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { createBridgeMockStore } from '../../../../test/data/bridge/mock-bridge-store';
import { CHAIN_IDS, FEATURED_RPCS } from '../../../../shared/constants/network';
import { mockNetworkState } from '../../../../test/stub/networks';
import * as ActionsModule from '../../../store/actions';
import { useEnsureNetworkEnabled } from './useEnsureNetworkEnabled';

describe('useEnsureNetworkEnabled', () => {
  const arrange = () => {
    const mockAddNetwork = jest
      .spyOn(ActionsModule, 'addNetwork')
      .mockReturnValue(jest.fn().mockResolvedValue(undefined) as never);

    return { mockAddNetwork };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not call addNetwork for a non-EVM chain', async () => {
    const { mockAddNetwork } = arrange();
    const hook = renderHookWithProvider(
      () => useEnsureNetworkEnabled(),
      createBridgeMockStore(),
    );

    await hook.result.current('solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp');

    expect(mockAddNetwork).not.toHaveBeenCalled();
  });

  it('does not call addNetwork when the network is already configured', async () => {
    const { mockAddNetwork } = arrange();
    const hook = renderHookWithProvider(
      () => useEnsureNetworkEnabled(),
      createBridgeMockStore(),
    );

    // MAINNET (0x1) is in the default mock store's networkConfigurationsByChainId
    await hook.result.current('eip155:1');

    expect(mockAddNetwork).not.toHaveBeenCalled();
  });

  it('calls addNetwork with FEATURED_RPCS config for an unconfigured bridge-supported chain', async () => {
    const { mockAddNetwork } = arrange();
    const polygonRpc = FEATURED_RPCS.find(
      (rpc) => rpc.chainId === CHAIN_IDS.POLYGON,
    );

    const hook = renderHookWithProvider(
      () => useEnsureNetworkEnabled(),
      createBridgeMockStore(),
    );

    // Polygon (0x89) is NOT in the default mock store but IS in FEATURED_RPCS
    await hook.result.current('eip155:137');

    expect(mockAddNetwork).toHaveBeenCalledTimes(1);
    expect(mockAddNetwork).toHaveBeenCalledWith(polygonRpc);
  });

  it('does not call addNetwork for an unknown chain not in FEATURED_RPCS', async () => {
    const { mockAddNetwork } = arrange();
    const hook = renderHookWithProvider(
      () => useEnsureNetworkEnabled(),
      createBridgeMockStore(),
    );

    // 0x9999 is not in FEATURED_RPCS
    await hook.result.current('eip155:39321');

    expect(mockAddNetwork).not.toHaveBeenCalled();
  });

  it('does not call addNetwork when the chain is passed as hex and already configured', async () => {
    const { mockAddNetwork } = arrange();
    const hook = renderHookWithProvider(
      () => useEnsureNetworkEnabled(),
      createBridgeMockStore({
        metamaskStateOverrides: {
          ...mockNetworkState(
            { chainId: CHAIN_IDS.MAINNET },
            { chainId: CHAIN_IDS.POLYGON },
          ),
        },
      }),
    );

    await hook.result.current('eip155:137');

    expect(mockAddNetwork).not.toHaveBeenCalled();
  });
});
