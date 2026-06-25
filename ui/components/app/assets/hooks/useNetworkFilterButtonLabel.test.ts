import { renderHookWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import mockState from '../../../../../test/data/mock-state.json';
import { useNetworkFilterButtonLabel } from './useNetworkFilterButtonLabel';

describe('useNetworkFilterButtonLabel', () => {
  const solanaChainId = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp';

  it('returns all default networks when multiple namespaces are enabled', () => {
    const { result } = renderHookWithProvider(
      () => useNetworkFilterButtonLabel(),
      {
        metamask: {
          ...mockState.metamask,
          selectedMultichainNetworkChainId: solanaChainId,
          enabledNetworkMap: {
            eip155: { '0x1': true, '0x5': true },
            solana: { [solanaChainId]: true },
          },
        },
      },
    );

    expect(result.current).toBe('All default networks');
  });
});
