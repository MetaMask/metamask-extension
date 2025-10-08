import { NetworkConfiguration } from '@metamask/network-controller';
import { extractNetworkName } from './helper';

describe('extractNetworkName', () => {
  const mockNetworks: Record<`0x${string}`, NetworkConfiguration> = {
    '0x1': {
      chainId: '0x1',
      name: 'Ethereum Mainnet',
      blockExplorerUrls: [],
      nativeCurrency: 'ETH',
      defaultRpcEndpointIndex: 0,
      rpcEndpoints: [],
    },
    '0x89': {
      chainId: '0x89',
      name: 'Polygon Mainnet',
      blockExplorerUrls: [],
      nativeCurrency: 'MATIC',
      defaultRpcEndpointIndex: 0,
      rpcEndpoints: [],
    },
    '0x5': {
      chainId: '0x5',
      name: 'Goerli Test Network',
      blockExplorerUrls: [],
      nativeCurrency: 'GoerliETH',
      defaultRpcEndpointIndex: 0,
      rpcEndpoints: [],
    },
  };

  describe('when network exists and has a valid name', () => {
    it('should return the full network name when isFullNetworkName is true', () => {
      const result = extractNetworkName(mockNetworks, '0x1', true);
      expect(result).toBe('Ethereum Mainnet');
    });

    it('should return the short network name when isFullNetworkName is false', () => {
      const result = extractNetworkName(mockNetworks, '0x1', false);
      expect(result).toBe('networkNameEthereum');
    });

    it('should return the short network name when isFullNetworkName is not provided (defaults to false)', () => {
      const result = extractNetworkName(mockNetworks, '0x1');
      expect(result).toBe('networkNameEthereum');
    });

    it('should handle network names with multiple words correctly', () => {
      const result = extractNetworkName(mockNetworks, '0x5', false);
      expect(result).toBe('networkNameGoerli');
    });

    it('should handle single word network names correctly', () => {
      const result = extractNetworkName(mockNetworks, '0x89', false);
      expect(result).toBe('networkNamePolygon');
    });

    it('should handle network names with leading/trailing whitespace correctly', () => {
      const networksWithWhitespace: Record<
        `0x${string}`,
        NetworkConfiguration
      > = {
        '0x1': {
          chainId: '0x1',
          name: '  Ethereum Mainnet  ',
          blockExplorerUrls: [],
          nativeCurrency: 'ETH',
          defaultRpcEndpointIndex: 0,
          rpcEndpoints: [],
        },
      };
      const result = extractNetworkName(networksWithWhitespace, '0x1', false);
      expect(result).toBe('networkNameEthereum');
    });
  });

  describe('when network exists but has empty name', () => {
    const networksWithEmptyName: Record<`0x${string}`, NetworkConfiguration> = {
      '0x1': {
        chainId: '0x1',
        name: '',
        blockExplorerUrls: [],
        nativeCurrency: 'ETH',
        defaultRpcEndpointIndex: 0,
        rpcEndpoints: [],
      },
    };

    it('should return unknownNetworkForGatorPermissions for empty string name', () => {
      const result = extractNetworkName(networksWithEmptyName, '0x1', true);
      expect(result).toBe('unknownNetworkForGatorPermissions');
    });
  });

  describe('when network exists but has whitespace-only name', () => {
    const networksWithWhitespaceName: Record<
      `0x${string}`,
      NetworkConfiguration
    > = {
      '0x1': {
        chainId: '0x1',
        name: '   ',
        blockExplorerUrls: [],
        nativeCurrency: 'ETH',
        defaultRpcEndpointIndex: 0,
        rpcEndpoints: [],
      },
    };

    it('should return unknownNetworkForGatorPermissions for whitespace-only name', () => {
      const result = extractNetworkName(
        networksWithWhitespaceName,
        '0x1',
        true,
      );
      expect(result).toBe('unknownNetworkForGatorPermissions');
    });

    it('should return unknownNetworkForGatorPermissions for whitespace-only name when isFullNetworkName is false', () => {
      const result = extractNetworkName(
        networksWithWhitespaceName,
        '0x1',
        false,
      );
      expect(result).toBe('unknownNetworkForGatorPermissions');
    });
  });

  describe('when network exists but name is undefined', () => {
    const networksWithUndefinedName: Record<
      `0x${string}`,
      NetworkConfiguration
    > = {
      '0x1': {
        chainId: '0x1',
        name: undefined as unknown as string,
        blockExplorerUrls: [],
        nativeCurrency: 'ETH',
        defaultRpcEndpointIndex: 0,
        rpcEndpoints: [],
      },
    };

    it('should return unknownNetworkForGatorPermissions for undefined name', () => {
      const result = extractNetworkName(networksWithUndefinedName, '0x1', true);
      expect(result).toBe('unknownNetworkForGatorPermissions');
    });
  });

  describe('when network does not exist', () => {
    it('should return unknownNetworkForGatorPermissions for non-existent chainId', () => {
      const result = extractNetworkName(mockNetworks, '0x999', true);
      expect(result).toBe('unknownNetworkForGatorPermissions');
    });
  });

  describe('when networks object is empty', () => {
    it('should return unknownNetworkForGatorPermissions for any chainId', () => {
      const result = extractNetworkName({}, '0x1', true);
      expect(result).toBe('unknownNetworkForGatorPermissions');
    });
  });
});
