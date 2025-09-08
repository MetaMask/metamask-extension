import { AccountsControllerState } from '@metamask/accounts-controller';
import { NON_EVM_TESTNET_IDS } from '@metamask/multichain-network-controller';
import { CaipChainId } from '@metamask/utils';
import mockState from '../../../test/data/mock-state.json';
import { CAIP_FORMATTED_EVM_TEST_CHAINS } from '../../constants/network';
import {
  getNonTestNetworks,
  getNetworksByScopes,
  MultichainNetworkConfigurationsByChainIdState,
} from './networks';

const typedMockState =
  mockState as unknown as MultichainNetworkConfigurationsByChainIdState & {
    metamask: {
      internalAccounts: AccountsControllerState['internalAccounts'];
    };
  };

const extendedMockState = {
  ...typedMockState,
  metamask: {
    ...typedMockState.metamask,
    internalAccounts: {
      ...typedMockState.metamask.internalAccounts,
      accounts: {
        ...typedMockState.metamask.internalAccounts.accounts,
        '499e262e-eed1-4743-b9bf-92b1a23b4a98': {
          type: 'solana:data-account' as const,
          id: '499e262e-eed1-4743-b9bf-92b1a23b4a98',
          address: '7sN9JNHfJNcj6gNv3UgeGY6qpwHeA4pis1Sk2pskvGjQ',
          options: {
            scope: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp' as CaipChainId,
            entropySource: '01JN20TXMMZWAMCBGB8J6VA4HD',
            imported: false,
          },
          methods: [
            'signAndSendTransaction',
            'signTransaction',
            'signMessage',
            'signIn',
          ],
          scopes: [
            'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
            'solana:4uhcVJyU9pJkvQyS88uRDiswHXSCkY3z',
            'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1',
          ] as CaipChainId[],
          metadata: {
            name: 'Solana Account 2',
            importTime: 1741868741042,
            keyring: {
              type: 'Snap Keyring',
            },
            snap: {
              id: 'npm:@metamask/solana-wallet-snap',
              name: 'Solana',
              enabled: true,
            },
            lastSelected: 1747401519439,
          },
        },
      },
      selectedAccount:
        typedMockState.metamask.internalAccounts.selectedAccount ||
        '499e262e-eed1-4743-b9bf-92b1a23b4a98',
    },
  },
};

describe('Network Selectors', () => {
  describe('getNonTestNetworks', () => {
    it('returns non-test networks from the state', () => {
      const result = getNonTestNetworks(extendedMockState);

      expect(result).toHaveLength(6);
      expect(result).toStrictEqual([
        {
          blockExplorerUrls: [],
          caipChainId: 'eip155:1',
          chainId: '0x1',
          defaultRpcEndpointIndex: 0,
          name: 'Custom Mainnet RPC',
          nativeCurrency: 'ETH',
          rpcEndpoints: [
            {
              networkClientId: 'testNetworkConfigurationId',
              type: 'custom',
              url: 'https://testrpc.com',
            },
          ],
          ticker: 'ETH',
        },
        {
          blockExplorerUrls: [],
          caipChainId: 'eip155:5',
          chainId: '0x5',
          defaultRpcEndpointIndex: 0,
          name: 'Goerli',
          nativeCurrency: 'ETH',
          rpcEndpoints: [
            {
              networkClientId: 'goerli',
              type: 'custom',
              url: 'https://goerli.com',
            },
          ],
          ticker: 'ETH',
        },
        {
          blockExplorerUrls: ['https://bscscan.com/'],
          caipChainId: 'eip155:56',
          chainId: '0x38',
          defaultBlockExplorerUrlIndex: 0,
          defaultRpcEndpointIndex: 0,
          lastUpdatedAt: 1738689643708,
          name: 'Binance Smart Chain',
          nativeCurrency: 'BNB',
          rpcEndpoints: [
            {
              networkClientId: 'ae8c8c36-7478-42bf-9b1a-610c81380000',
              type: 'custom',
              url: 'https://bsc-dataseed.binance.org/',
            },
          ],
        },
        {
          blockExplorerUrls: ['https://polygonscan.com/'],
          caipChainId: 'eip155:137',
          chainId: '0x89',
          defaultBlockExplorerUrlIndex: 0,
          defaultRpcEndpointIndex: 0,
          lastUpdatedAt: 1738689655105,
          name: 'Polygon',
          nativeCurrency: 'POL',
          rpcEndpoints: [
            {
              networkClientId: 'b46d8e79-ebf2-4fdc-8cb9-45610e990000',
              type: 'custom',
              url: 'https://polygon-mainnet.infura.io/v3/',
            },
          ],
        },
        {
          blockExplorerUrls: ['https://explorer.arbitrum.io'],
          caipChainId: 'eip155:42161',
          chainId: '0xa4b1',
          defaultBlockExplorerUrlIndex: 0,
          defaultRpcEndpointIndex: 0,
          lastUpdatedAt: 1738689624782,
          name: 'Arbitrum',
          nativeCurrency: 'ETH',
          rpcEndpoints: [
            {
              networkClientId: '100849a6-a63c-4ebd-9bbe-0c84134d0000',
              type: 'custom',
              url: 'https://arbitrum-mainnet.infura.io/v3/',
            },
          ],
        },
        {
          caipChainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
          chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
          isEvm: false,
          name: 'Solana',
          nativeCurrency: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
        },
      ]);

      const evmTestNetworkIds = result.filter(
        (network) =>
          network.caipChainId &&
          CAIP_FORMATTED_EVM_TEST_CHAINS.includes(network.caipChainId),
      );
      expect(evmTestNetworkIds).toHaveLength(0);

      const nonEvmTestNetworkIds = result.filter(
        (network) =>
          network.caipChainId &&
          NON_EVM_TESTNET_IDS.includes(network.caipChainId),
      );
      expect(nonEvmTestNetworkIds).toHaveLength(0);
    });
  });

  describe('getNetworksByScopes', () => {
    it('returns empty array if scopes is undefined', () => {
      // @ts-expect-error Passing wrong type is intentional for testing
      const result = getNetworksByScopes(extendedMockState, undefined);
      expect(result).toStrictEqual([]);
    });

    it('returns empty array if scopes is empty array', () => {
      const result = getNetworksByScopes(extendedMockState, []);
      expect(result).toStrictEqual([]);
    });

    it('returns specific network by caip chainId scope', () => {
      const result = getNetworksByScopes(extendedMockState, ['eip155:1']);

      expect(result).toContainEqual(
        expect.objectContaining({
          chainId: '0x1',
          name: 'Custom Mainnet RPC',
        }),
      );
    });

    it('returns all EVM networks when scope is eip155:0', () => {
      const result = getNetworksByScopes(extendedMockState, ['eip155:0']);

      expect(result).toHaveLength(5);

      result.forEach((network) => {
        const evmChainId = `eip155:${network.chainId}`;

        expect(CAIP_FORMATTED_EVM_TEST_CHAINS).not.toContain(evmChainId);
        expect(network.chainId).toMatch(/^0x[0-9a-f]+$/iu);
      });
    });

    it('returns multiple networks for multiple scopes', () => {
      const scopes = ['eip155:0', 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp'];
      const result = getNetworksByScopes(extendedMockState, scopes);

      expect(result).toHaveLength(6);
      expect(result).toStrictEqual([
        {
          chainId: '0x1',
          name: 'Custom Mainnet RPC',
        },
        {
          chainId: '0x5',
          name: 'Goerli',
        },
        {
          chainId: '0x38',
          name: 'Binance Smart Chain',
        },
        {
          chainId: '0x89',
          name: 'Polygon',
        },
        {
          chainId: '0xa4b1',
          name: 'Arbitrum',
        },
        {
          chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
          name: 'Solana',
        },
      ]);
    });
  });
});
