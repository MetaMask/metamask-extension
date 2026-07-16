import { renderHookWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import mockState from '../../../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../../../test/lib/i18n-helpers';
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

    expect(result.current).toBe(messages.allDefaultNetworks.message);
  });

  it('prefixes a single selected network with the network label', () => {
    const { result } = renderHookWithProvider(
      () => useNetworkFilterButtonLabel(),
      {
        metamask: {
          ...mockState.metamask,
          enabledNetworkMap: {
            eip155: { '0x38': true },
          },
          networkConfigurationsByChainId: {
            ...mockState.metamask.networkConfigurationsByChainId,
            '0x38': {
              ...mockState.metamask.networkConfigurationsByChainId['0x1'],
              chainId: '0x38',
              name: 'BNB Chain',
            },
          },
        },
      },
    );

    expect(result.current).toBe(`${messages.network.message}: BNB Chain`);
  });
});
