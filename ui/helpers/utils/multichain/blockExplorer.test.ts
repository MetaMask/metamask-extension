import {
  MULTICHAIN_PROVIDER_CONFIGS,
  MultichainNetworks,
} from '../../../../shared/constants/multichain/networks';
import {
  CHAIN_IDS,
  MAINNET_DISPLAY_NAME,
  CHAIN_ID_TO_RPC_URL_MAP,
  ETH_TOKEN_IMAGE_URL,
  NETWORK_TYPES,
  CURRENCY_SYMBOLS,
} from '../../../../shared/constants/network';
import type { MultichainNetwork } from '../../../selectors/multichain/networks';
import {
  getAssetDetailsAccountUrl,
  getFungibleAssetBlockExplorerLink,
  getMultichainAccountUrl,
  getMultichainBlockExplorerUrl,
} from './blockExplorer';

const mockEvmNetwork: MultichainNetwork = {
  nickname: 'Ethereum',
  isEvmNetwork: true,
  chainId: 'eip155:1',
  network: {
    chainId: CHAIN_IDS.MAINNET,
    nickname: MAINNET_DISPLAY_NAME,
    rpcUrl: CHAIN_ID_TO_RPC_URL_MAP[CHAIN_IDS.MAINNET],
    rpcPrefs: {
      imageUrl: ETH_TOKEN_IMAGE_URL,
      blockExplorerUrl: 'https://etherscan.io',
    },
    type: NETWORK_TYPES.MAINNET,
    ticker: CURRENCY_SYMBOLS.ETH,
    id: NETWORK_TYPES.MAINNET,
  },
};

const mockNonEvmNetwork: MultichainNetwork = {
  nickname: 'Bitcoin',
  isEvmNetwork: false,
  chainId: MultichainNetworks.BITCOIN,
  network: MULTICHAIN_PROVIDER_CONFIGS[MultichainNetworks.BITCOIN],
};

describe('Block Explorer Tests', () => {
  describe('getMultichainBlockExplorerUrl', () => {
    it('returns the correct block explorer URL for Ethereum mainnet', () => {
      const expectedUrl = mockEvmNetwork.network?.rpcPrefs?.blockExplorerUrl;

      const result = getMultichainBlockExplorerUrl(mockEvmNetwork);

      expect(result).toBe(expectedUrl);
    });

    it('returns the correct block explorer URL for Bitcoin mainnet', () => {
      const expectedUrl = mockNonEvmNetwork.network?.rpcPrefs?.blockExplorerUrl;

      const result = getMultichainBlockExplorerUrl(mockNonEvmNetwork);

      expect(result).toBe(expectedUrl);
    });
  });

  describe('getMultichainAccountUrl', () => {
    it('returns the correct account URL for Ethereum mainnet', () => {
      const address = '0x1234567890abcdef';
      const expectedUrl = `https://etherscan.io/address/${address}#asset-multichain`;

      const result = getMultichainAccountUrl(address, mockEvmNetwork);

      expect(result).toBe(expectedUrl);
    });

    it('returns the correct account URL for BNB Chain', () => {
      const address = 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq';
      const expectedUrl = `https://mempool.space/address/${address}`;

      const result = getMultichainAccountUrl(address, mockNonEvmNetwork);

      expect(result).toBe(expectedUrl);
    });
  });

  describe('getAssetDetailsAccountUrl', () => {
    it('returns the correct account URL using configured block explorer for EVM networks', () => {
      const address = '0x1234567890abcdef';
      // getAccountLink uses the network's configured block explorer URL
      const expectedUrl = `https://etherscan.io/address/${address}`;

      const result = getAssetDetailsAccountUrl(address, mockEvmNetwork);

      expect(result).toBe(expectedUrl);
    });

    it('falls back to default explorer when no block explorer is configured', () => {
      const address = '0x1234567890abcdef';
      const networkWithoutExplorer: MultichainNetwork = {
        ...mockEvmNetwork,
        network: {
          ...mockEvmNetwork.network,
          rpcPrefs: {
            imageUrl: ETH_TOKEN_IMAGE_URL,
            // No blockExplorerUrl configured
          },
        },
      };
      // getAccountLink falls back to known explorer for mainnet
      const expectedUrl = `https://etherscan.io/address/${address}`;

      const result = getAssetDetailsAccountUrl(address, networkWithoutExplorer);

      expect(result).toBe(expectedUrl);
    });

    it('returns the correct account URL for non-EVM networks', () => {
      const address = 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq';
      const expectedUrl = `https://mempool.space/address/${address}`;

      const result = getAssetDetailsAccountUrl(address, mockNonEvmNetwork);

      expect(result).toBe(expectedUrl);
    });
  });

  describe('getFungibleAssetBlockExplorerLink', () => {
    it('returns an EVM explorer link', () => {
      const link = getFungibleAssetBlockExplorerLink({
        caipChainId: 'eip155:1',
        tokenAddress: '0xabc',
        isNative: false,
        evmNetworkConfigurations: {
          '0x1': {
            chainId: '0x1',
            name: 'Ethereum Mainnet',
            nativeCurrency: 'ETH',
            defaultBlockExplorerUrlIndex: 0,
            blockExplorerUrls: ['https://etherscan.io'],
            rpcEndpoints: [],
            defaultRpcEndpointIndex: 0,
          },
        },
        multichainNetworkConfigurations: {
          'eip155:1': {
            chainId: 'eip155:1',
            name: 'Ethereum Mainnet',
            isEvm: true,
            nativeCurrency: 'ETH',
            blockExplorerUrls: ['https://etherscan.io'],
            defaultBlockExplorerUrlIndex: 0,
          },
        },
        fallbackExplorerLabel: 'Etherscan',
      });

      expect(link?.url).toContain('etherscan.io');
      expect(link?.name).toBe('Ethereum Mainnet');
    });

    it('returns a non-EVM explorer link', () => {
      const link = getFungibleAssetBlockExplorerLink({
        caipChainId: MultichainNetworks.SOLANA,
        tokenAddress: 'So11111111111111111111111111111111111111112',
        isNative: false,
        evmNetworkConfigurations: {},
        multichainNetworkConfigurations: {
          [MultichainNetworks.SOLANA]: {
            chainId: MultichainNetworks.SOLANA,
            name: 'Solana',
            isEvm: false,
            nativeCurrency: `${MultichainNetworks.SOLANA}/slip44:501`,
          },
        },
        fallbackExplorerLabel: 'Etherscan',
      });

      expect(link?.url).toContain('solscan.io');
      expect(link?.name).toBeTruthy();
    });

    it('returns null for native assets', () => {
      expect(
        getFungibleAssetBlockExplorerLink({
          caipChainId: 'eip155:1',
          tokenAddress: '0xabc',
          isNative: true,
          evmNetworkConfigurations: {},
          multichainNetworkConfigurations: {},
          fallbackExplorerLabel: 'Etherscan',
        }),
      ).toBeNull();
    });
  });
});
