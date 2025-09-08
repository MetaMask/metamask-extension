import { SolScope, BtcScope, EthScope } from '@metamask/keyring-api';
import {
  toEvmCaipChainId,
  type MultichainNetworkConfiguration,
} from '@metamask/multichain-network-controller';
import {
  type NetworkConfiguration,
  RpcEndpointType,
} from '@metamask/network-controller';
import { CaipChainId } from '@metamask/utils';
import { ChainId } from '@metamask/controller-utils';
import { MAX_SAFE_CHAIN_ID } from '../constants/network';
import {
  isSafeChainId,
  isPrefixedFormattedHexString,
  isTokenDetectionEnabledForNetwork,
  convertNetworkId,
  convertCaipToHexChainId,
  sortNetworks,
  getRpcDataByChainId,
  sortNetworksByPrioity,
} from './network.utils';

describe('network utils', () => {
  describe('isSafeChainId', () => {
    it('returns true given an integer greater than 0 and less than or equal to the max safe chain ID', () => {
      expect(isSafeChainId(3)).toBe(true);
    });

    it('returns true given the max safe chain ID', () => {
      expect(isSafeChainId(MAX_SAFE_CHAIN_ID)).toBe(true);
    });

    it('returns false given something other than an integer', () => {
      expect(isSafeChainId('not-an-integer')).toBe(false);
    });

    it('returns false given a negative integer', () => {
      expect(isSafeChainId(-1)).toBe(false);
    });

    it('returns false given an integer greater than the max safe chain ID', () => {
      expect(isSafeChainId(MAX_SAFE_CHAIN_ID + 1)).toBe(false);
    });
  });

  describe('isPrefixedFormattedHexString', () => {
    it('returns true given a string that matches a hex number formatted as a "0x"-prefixed, non-zero, non-zero-padded string', () => {
      expect(isPrefixedFormattedHexString('0x1')).toBe(true);
      expect(isPrefixedFormattedHexString('0xa')).toBe(true);
      expect(isPrefixedFormattedHexString('0xabc123')).toBe(true);
    });

    it('returns true given a "0x"-prefixed hex string that contains uppercase characters', () => {
      expect(isPrefixedFormattedHexString('0XABC123')).toBe(true);
    });

    it('returns false given a "0x"-prefixed hex string that evaluates to zero', () => {
      expect(isPrefixedFormattedHexString('0x0')).toBe(false);
    });

    it('returns false given a "0x"-prefixed hex string that does not evaluate to zero but is zero-padded', () => {
      expect(isPrefixedFormattedHexString('0x01')).toBe(false);
    });

    it('returns false given a hex number that is simply a string but not "0x"-prefixed', () => {
      expect(isPrefixedFormattedHexString('abc123')).toBe(false);
    });

    it('returns false if given something other than a string', () => {
      expect(isPrefixedFormattedHexString({ something: 'else' })).toBe(false);
    });
  });

  describe('isTokenDetectionEnabledForNetwork', () => {
    it('returns true given the chain ID for Mainnet', () => {
      expect(isTokenDetectionEnabledForNetwork('0x1')).toBe(true);
    });

    it('returns true given the chain ID for BSC', () => {
      expect(isTokenDetectionEnabledForNetwork('0x38')).toBe(true);
    });

    it('returns true given the chain ID for Polygon', () => {
      expect(isTokenDetectionEnabledForNetwork('0x89')).toBe(true);
    });

    it('returns true given the chain ID for Avalanche', () => {
      expect(isTokenDetectionEnabledForNetwork('0xa86a')).toBe(true);
    });

    it('returns false given a string that is not the chain ID for Mainnet, BSC, Polygon, or Avalanche', () => {
      expect(isTokenDetectionEnabledForNetwork('some other chain ID')).toBe(
        false,
      );
    });

    it('returns false given undefined', () => {
      expect(isTokenDetectionEnabledForNetwork(undefined)).toBe(false);
    });
  });

  describe('convertNetworkId', () => {
    it('returns decimal strings for postive integer number values', () => {
      expect(convertNetworkId(0)).toStrictEqual('0');
      expect(convertNetworkId(123)).toStrictEqual('123');
      expect(convertNetworkId(1337)).toStrictEqual('1337');
    });

    it('returns null for negative numbers', () => {
      expect(convertNetworkId(-1)).toStrictEqual(null);
    });

    it('returns null for non integer numbers', () => {
      expect(convertNetworkId(0.1)).toStrictEqual(null);
      expect(convertNetworkId(1.1)).toStrictEqual(null);
    });

    it('returns null for NaN', () => {
      expect(convertNetworkId(Number.NaN)).toStrictEqual(null);
    });

    it('returns decimal strings for strict valid hex values', () => {
      expect(convertNetworkId('0x0')).toStrictEqual('0');
      expect(convertNetworkId('0x1')).toStrictEqual('1');
      expect(convertNetworkId('0x539')).toStrictEqual('1337');
    });

    it('returns null for invalid hex values', () => {
      expect(convertNetworkId('0xG')).toStrictEqual(null);
      expect(convertNetworkId('0x@')).toStrictEqual(null);
      expect(convertNetworkId('0xx1')).toStrictEqual(null);
    });

    it('returns the value as is if already a postive decimal string', () => {
      expect(convertNetworkId('0')).toStrictEqual('0');
      expect(convertNetworkId('1')).toStrictEqual('1');
      expect(convertNetworkId('1337')).toStrictEqual('1337');
    });

    it('returns null for negative number strings', () => {
      expect(convertNetworkId('-1')).toStrictEqual(null);
    });

    it('returns null for non integer number strings', () => {
      expect(convertNetworkId('0.1')).toStrictEqual(null);
      expect(convertNetworkId('1.1')).toStrictEqual(null);
    });
  });

  describe('convertCaipToHexChainId', () => {
    it('converts a CAIP chain ID to a hex chain ID', () => {
      expect(convertCaipToHexChainId(EthScope.Mainnet)).toBe('0x1');
      expect(convertCaipToHexChainId('eip155:56')).toBe('0x38');
      expect(convertCaipToHexChainId('eip155:80094')).toBe('0x138de');
      expect(convertCaipToHexChainId('eip155:8453')).toBe('0x2105');
    });

    it('throws an error given a CAIP chain ID with an unsupported namespace', () => {
      expect(() => convertCaipToHexChainId(BtcScope.Mainnet)).toThrow(
        'Unsupported CAIP chain ID namespace: bip122. Only eip155 is supported.',
      );
      expect(() => convertCaipToHexChainId(SolScope.Mainnet)).toThrow(
        'Unsupported CAIP chain ID namespace: solana. Only eip155 is supported.',
      );
    });
  });

  describe('sortNetworks', () => {
    const networks: Record<CaipChainId, MultichainNetworkConfiguration> = {
      [SolScope.Mainnet]: {
        chainId: SolScope.Mainnet,
        name: 'Solana',
        nativeCurrency: `${SolScope.Mainnet}/slip44:501`,
        isEvm: false,
      },
      [EthScope.Mainnet]: {
        chainId: EthScope.Mainnet,
        name: 'Ethereum',
        nativeCurrency: 'ETH',
        blockExplorerUrls: ['https://etherscan.io'],
        defaultBlockExplorerUrlIndex: 0,
        isEvm: true,
      },
      [EthScope.Testnet]: {
        chainId: EthScope.Testnet,
        name: 'Sepolia',
        nativeCurrency: 'SepoliaETH',
        blockExplorerUrls: ['https://sepolia.etherscan.io'],
        defaultBlockExplorerUrlIndex: 0,
        isEvm: true,
      },
      [BtcScope.Mainnet]: {
        chainId: BtcScope.Mainnet,
        name: 'Bitcoin',
        nativeCurrency: `${BtcScope.Mainnet}/slip44:0`,
        isEvm: false,
      },
    };

    it('sorts a list of networks based on the order of their chain IDs', () => {
      expect(
        sortNetworks(networks, [
          { networkId: SolScope.Mainnet },
          { networkId: BtcScope.Mainnet },
          { networkId: EthScope.Mainnet },
          { networkId: EthScope.Testnet },
        ]),
      ).toStrictEqual([
        {
          chainId: SolScope.Mainnet,
          name: 'Solana',
          nativeCurrency: `${SolScope.Mainnet}/slip44:501`,
          isEvm: false,
        },
        {
          chainId: BtcScope.Mainnet,
          name: 'Bitcoin',
          nativeCurrency: `${BtcScope.Mainnet}/slip44:0`,
          isEvm: false,
        },
        {
          chainId: EthScope.Mainnet,
          name: 'Ethereum',
          nativeCurrency: 'ETH',
          blockExplorerUrls: ['https://etherscan.io'],
          defaultBlockExplorerUrlIndex: 0,
          isEvm: true,
        },
        {
          chainId: EthScope.Testnet,
          name: 'Sepolia',
          nativeCurrency: 'SepoliaETH',
          blockExplorerUrls: ['https://sepolia.etherscan.io'],
          defaultBlockExplorerUrlIndex: 0,
          isEvm: true,
        },
      ]);
    });

    it('places non-EVM networks to the end of the array', () => {
      expect(
        sortNetworks(networks, [
          { networkId: EthScope.Mainnet },
          { networkId: EthScope.Testnet },
        ]),
      ).toStrictEqual([
        {
          chainId: EthScope.Mainnet,
          name: 'Ethereum',
          nativeCurrency: 'ETH',
          blockExplorerUrls: ['https://etherscan.io'],
          defaultBlockExplorerUrlIndex: 0,
          isEvm: true,
        },
        {
          chainId: EthScope.Testnet,
          name: 'Sepolia',
          nativeCurrency: 'SepoliaETH',
          blockExplorerUrls: ['https://sepolia.etherscan.io'],
          defaultBlockExplorerUrlIndex: 0,
          isEvm: true,
        },
        {
          chainId: SolScope.Mainnet,
          name: 'Solana',
          nativeCurrency: `${SolScope.Mainnet}/slip44:501`,
          isEvm: false,
        },
        {
          chainId: BtcScope.Mainnet,
          name: 'Bitcoin',
          nativeCurrency: `${BtcScope.Mainnet}/slip44:0`,
          isEvm: false,
        },
      ]);
    });
  });

  describe('getRpcDataByChainId', () => {
    const evmNetworks: Record<string, NetworkConfiguration> = {
      '0x1': {
        chainId: '0x1',
        name: 'Ethereum',
        nativeCurrency: 'ETH',
        rpcEndpoints: [
          {
            url: 'https://mainnet.infura.io/v3/1234567890abcdef',
            networkClientId: '1',
            name: 'infura',
            type: RpcEndpointType.Custom,
          },
        ],
        defaultRpcEndpointIndex: 0,
        blockExplorerUrls: [],
      },
      '0x38': {
        chainId: '0x38',
        name: 'BNB Chain',
        nativeCurrency: 'BNB',
        rpcEndpoints: [
          {
            url: 'https://bsc-dataseed.binance.org',
            networkClientId: '56',
            name: 'binance',
            type: RpcEndpointType.Custom,
          },
        ],
        defaultRpcEndpointIndex: 0,
        blockExplorerUrls: [],
      },
      '0x89': {
        chainId: '0x89',
        name: 'Polygon',
        nativeCurrency: 'MATIC',
        rpcEndpoints: [
          {
            url: 'https://rpc-mainnet.maticvigil.com',
            networkClientId: '137',
            name: 'maticvigil',
            type: RpcEndpointType.Custom,
          },
        ],
        defaultRpcEndpointIndex: 0,
        blockExplorerUrls: [],
      },
      '0xa86a': {
        chainId: '0xa86a',
        name: 'Avalanche Mainnet',
        nativeCurrency: 'AVAX',
        rpcEndpoints: [
          {
            url: 'https://api.avax.network/ext/bc/C/rpc',
            networkClientId: '43114',
            name: 'avalanche',
            type: RpcEndpointType.Custom,
          },
        ],
        defaultRpcEndpointIndex: 0,
        blockExplorerUrls: [],
      },
    };

    it('gets the RPC data for the given chain ID', () => {
      expect(getRpcDataByChainId(EthScope.Mainnet, evmNetworks)).toStrictEqual({
        rpcEndpoints: [
          {
            url: 'https://mainnet.infura.io/v3/1234567890abcdef',
            networkClientId: '1',
            name: 'infura',
            type: RpcEndpointType.Custom,
          },
        ],
        defaultRpcEndpoint: {
          url: 'https://mainnet.infura.io/v3/1234567890abcdef',
          networkClientId: '1',
          name: 'infura',
          type: RpcEndpointType.Custom,
        },
      });
    });

    it('throws an error if the network configuration is not found for the chain ID', () => {
      expect(() => getRpcDataByChainId('eip155:2', evmNetworks)).toThrow(
        'Network configuration not found for chain ID: eip155:2 (0x2)',
      );
    });
  });

  describe('sortNetworksByPrioity', () => {
    it('sorts a list of networks based on the predefined priority and following with alphabetical order', () => {
      const networkB = {
        chainId: 'eip155:0x123456',
        name: 'Some Testnet',
      };
      const networkA = {
        chainId: 'eip155:0x12345',
        name: 'Another Testnet',
      };
      const sepolia = {
        chainId: toEvmCaipChainId(ChainId.sepolia),
        name: 'Sepolia',
      };
      const lineaSepolia = {
        chainId: toEvmCaipChainId(ChainId['linea-sepolia']),
        name: 'Linea Sepolia',
      };

      const networks = [
        networkB,
        networkA,
        sepolia,
        lineaSepolia,
      ] as unknown as MultichainNetworkConfiguration[];

      const expectedResult = [
        sepolia,
        lineaSepolia,
        networkA,
        networkB,
      ] as unknown as MultichainNetworkConfiguration[];

      const result = sortNetworksByPrioity(networks, [
        sepolia.chainId,
        lineaSepolia.chainId,
      ]);

      expect(result).toStrictEqual(expectedResult);
    });
  });
});
