import { it } from '@jest/globals';
import { renderHookWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import mockState from '../../../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../../../test/lib/i18n-helpers';
import { ETH_TOKEN_IMAGE_URL } from '../../../../../shared/constants/network';
import { SOLANA_TOKEN_IMAGE_URL } from '../../../../../shared/constants/multichain/networks';
import {
  useNetworkFilterButtonIcon,
  useNetworkFilterButtonLabel,
} from './useNetworkFilterButtonLabel';

describe('useNetworkFilterButtonIcon', () => {
  it('returns the Ethereum image for a single enabled EVM network', () => {
    const { result } = renderHookWithProvider(useNetworkFilterButtonIcon, {
      metamask: {
        ...mockState.metamask,
        enabledNetworkMap: {
          eip155: { '0x1': true, '0x5': false },
        },
      },
    });

    expect(result.current).toStrictEqual({
      name: 'Custom Mainnet RPC',
      src: ETH_TOKEN_IMAGE_URL,
    });
  });

  it('returns the Solana image for a single enabled non-EVM network', () => {
    const solanaChainId = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp';
    const { result } = renderHookWithProvider(useNetworkFilterButtonIcon, {
      metamask: {
        ...mockState.metamask,
        remoteFeatureFlags: {
          ...mockState.metamask.remoteFeatureFlags,
          solanaAccounts: { enabled: true, minimumVersion: '13.6.0' },
        },
        enabledNetworkMap: {
          eip155: { '0x1': false },
          solana: { [solanaChainId]: true },
        },
      },
    });

    expect(result.current).toStrictEqual({
      name: 'Solana',
      src: SOLANA_TOKEN_IMAGE_URL,
    });
  });

  it.each([
    {
      description: 'no networks',
      enabledNetworkMap: { eip155: { '0x1': false } },
    },
    {
      description: 'multiple EVM networks',
      enabledNetworkMap: { eip155: { '0x1': true, '0x5': true } },
    },
    {
      description: 'multiple namespaces',
      enabledNetworkMap: {
        eip155: { '0x1': true },
        solana: { 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': true },
      },
    },
  ])('omits the icon with $description enabled', ({ enabledNetworkMap }) => {
    const { result } = renderHookWithProvider(useNetworkFilterButtonIcon, {
      metamask: {
        ...mockState.metamask,
        enabledNetworkMap,
      },
    });

    expect(result.current).toBeUndefined();
  });

  it('omits the icon when the enabled network has no configuration', () => {
    const { result } = renderHookWithProvider(useNetworkFilterButtonIcon, {
      metamask: {
        ...mockState.metamask,
        enabledNetworkMap: { eip155: { '0x123456': true } },
      },
    });

    expect(result.current).toBeUndefined();
  });

  it('returns the network name for a custom EVM network without an image', () => {
    const { result } = renderHookWithProvider(useNetworkFilterButtonIcon, {
      metamask: {
        ...mockState.metamask,
        enabledNetworkMap: { eip155: { '0x123456': true } },
        networkConfigurationsByChainId: {
          ...mockState.metamask.networkConfigurationsByChainId,
          '0x123456': {
            ...mockState.metamask.networkConfigurationsByChainId['0x1'],
            chainId: '0x123456',
            name: 'Custom Network',
          },
        },
      },
    });

    expect(result.current).toStrictEqual({
      name: 'Custom Network',
      src: undefined,
    });
  });
});

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
