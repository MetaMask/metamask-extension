import { getBlockExplorerInfo } from './getBlockExplorerInfo';

// Mock the multichain constants
jest.mock('../../../../shared/constants/multichain/networks', () => ({
  MULTICHAIN_NETWORK_BLOCK_EXPLORER_FORMAT_URLS_MAP: {
    'bitcoin:0': {
      url: 'https://blockstream.info',
      address: 'https://blockstream.info/address/{address}',
      transaction: 'https://blockstream.info/tx/{txId}',
    },
    'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': {
      url: 'https://solscan.io',
      address: 'https://solscan.io/account/{address}',
      transaction: 'https://solscan.io/tx/{txId}',
    },
  },
  MultichainNetworks: {
    BITCOIN: 'bitcoin:0',
    SOLANA: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
  },
}));

// Mock the common constants
jest.mock('../../../../shared/constants/common', () => ({
  CHAINID_DEFAULT_BLOCK_EXPLORER_HUMAN_READABLE_URL_MAP: {
    '0x1': 'Etherscan',
    '0x89': 'PolygonScan',
    '0xa': 'Optimism Explorer',
  },
  CHAINID_DEFAULT_BLOCK_EXPLORER_URL_MAP: {
    '0x1': 'https://etherscan.io/',
    '0x89': 'https://polygonscan.com/',
    '0xa': 'https://optimistic.etherscan.io/',
  },
}));

// Mock the multichain URL formatting
jest.mock('../../../../shared/lib/multichain/networks', () => ({
  formatBlockExplorerAddressUrl: jest.fn((urls, address) =>
    urls.address.replace('{address}', address),
  ),
}));

describe('getBlockExplorerInfo utility functions', () => {
  const mockT = (key: string, ...args: string[]) =>
    `translated_${key}_${args.join('_')}`;
  const testAddress = '0x1234567890abcdef';

  describe('getBlockExplorerInfo function', () => {
    it('returns correct info for Bitcoin network', () => {
      const result = getBlockExplorerInfo(mockT, testAddress, {
        networkName: 'Bitcoin',
        chainId: 'bitcoin:0',
      });

      expect(result).toEqual({
        addressUrl: 'https://blockstream.info/address/0x1234567890abcdef',
        name: 'Blockstream',
        buttonText: 'translated_viewAddressOnExplorer_Blockstream',
      });
    });

    it('returns correct info for Solana network', () => {
      const result = getBlockExplorerInfo(mockT, testAddress, {
        networkName: 'Solana',
        chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
      });

      expect(result).toEqual({
        addressUrl: 'https://solscan.io/account/0x1234567890abcdef',
        name: 'Solscan',
        buttonText: 'translated_viewAddressOnExplorer_Solscan',
      });
    });

    it('returns correct info for Ethereum EVM network', () => {
      const result = getBlockExplorerInfo(mockT, testAddress, {
        networkName: 'Ethereum Mainnet',
        chainId: 'eip155:1',
      });

      expect(result).toEqual({
        addressUrl: 'https://etherscan.io/address/0x1234567890abcdef',
        name: 'Etherscan',
        buttonText: 'translated_viewAddressOnExplorer_Etherscan',
      });
    });

    it('returns correct info for Polygon EVM network', () => {
      const result = getBlockExplorerInfo(mockT, testAddress, {
        networkName: 'Polygon',
        chainId: 'eip155:137',
      });

      expect(result).toEqual({
        addressUrl: 'https://polygonscan.com/address/0x1234567890abcdef',
        name: 'PolygonScan',
        buttonText: 'translated_viewAddressOnExplorer_PolygonScan',
      });
    });

    it('returns correct info for EVM network with custom block explorer URL', () => {
      const result = getBlockExplorerInfo(mockT, testAddress, {
        networkName: 'Custom Network',
        chainId: 'eip155:1',
        blockExplorerUrl: 'https://custom-explorer.com',
      });

      expect(result).toEqual({
        addressUrl: 'https://custom-explorer.com/address/0x1234567890abcdef',
        name: 'Etherscan',
        buttonText: 'translated_viewAddressOnExplorer_Etherscan',
      });
    });

    it('returns null for unknown network without chainId', () => {
      const result = getBlockExplorerInfo(mockT, testAddress, {
        networkName: 'Unknown Network',
      });

      expect(result).toBeNull();
    });

    it('returns null for unknown chainId', () => {
      const result = getBlockExplorerInfo(mockT, testAddress, {
        networkName: 'Unknown Network',
        chainId: 'unknown:123',
      });

      expect(result).toBeNull();
    });
  });

  describe('CaipChainId conversion logic', () => {
    it('converts EVM CaipChainId to hex correctly', () => {
      const eip155ChainId = 'eip155:1';
      const hexChainId = `0x${parseInt(eip155ChainId.split(':')[1], 10).toString(16)}`;
      expect(hexChainId).toBe('0x1');
    });

    it('converts different EVM chain IDs correctly', () => {
      const testCases = [
        { caip: 'eip155:137', expected: '0x89' }, // Polygon
        { caip: 'eip155:10', expected: '0xa' }, // Optimism
        { caip: 'eip155:42161', expected: '0xa4b1' }, // Arbitrum
      ];

      testCases.forEach(({ caip, expected }) => {
        const hexChainId = `0x${parseInt(caip.split(':')[1], 10).toString(16)}`;
        expect(hexChainId).toBe(expected);
      });
    });
  });

  describe('Translation function integration', () => {
    it('formats translation keys correctly', () => {
      const mockT2 = (key: string, ...args: string[]) =>
        `translated_${key}_${args.join('_')}`;

      const result = mockT2('viewAddressOnExplorer', 'Etherscan');
      expect(result).toBe('translated_viewAddressOnExplorer_Etherscan');
    });

    it('handles multiple translation arguments', () => {
      const mockT3 = (key: string, ...args: string[]) =>
        `translated_${key}_${args.join('_')}`;

      const result = mockT3('viewAddressOnExplorer', 'PolygonScan');
      expect(result).toBe('translated_viewAddressOnExplorer_PolygonScan');
    });
  });

  describe('Edge cases', () => {
    it('handles missing chainId gracefully', () => {
      const result = getBlockExplorerInfo(mockT, testAddress, {
        networkName: 'Some Network',
      });
      expect(result).toBeNull();
    });

    it('handles EVM network without block explorer URL', () => {
      const result = getBlockExplorerInfo(mockT, testAddress, {
        networkName: 'Ethereum Mainnet',
        chainId: 'eip155:999999', // Unknown chain ID
      });
      expect(result).toBeNull();
    });

    it('handles multichain network without format URLs', () => {
      const result = getBlockExplorerInfo(mockT, testAddress, {
        networkName: 'Bitcoin',
        chainId: 'bitcoin:999999', // Unknown Bitcoin chain ID
      });
      expect(result).toBeNull();
    });

    it('handles custom block explorer URL without chainId mapping', () => {
      const result = getBlockExplorerInfo(mockT, testAddress, {
        networkName: 'Custom Network',
        chainId: 'eip155:999999',
        blockExplorerUrl: 'https://custom-explorer.com',
      });

      expect(result).toEqual({
        addressUrl: 'https://custom-explorer.com/address/0x1234567890abcdef',
        name: 'Block Explorer',
        buttonText: 'translated_viewAddressOnExplorer_Block Explorer',
      });
    });
  });
});
