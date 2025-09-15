import { InternalAccount } from '@metamask/keyring-internal-api';
import { CaipChainId } from '@metamask/utils';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { MultichainNetworks } from '../../../../shared/constants/multichain/networks';
import {
  NetworkAddressItem,
  sortNetworkAddressItems,
  getCompatibleNetworksForAccount,
} from './utils';

describe('MultichainAddressRowsList Utils', () => {
  describe('sortNetworkAddressItems', () => {
    const createNetworkItem = (
      chainId: string,
      networkName: string,
      address = '0xa0b86991c431e50c0dd0b653aa1e8c7b7c66f5e4b',
    ): NetworkAddressItem => ({
      chainId,
      networkName,
      address,
    });

    it('sorts networks with correct priority: Ethereum first, Solana second, test networks last, alphabetical within category', () => {
      const items = [
        createNetworkItem('0x89', 'Polygon'),
        createNetworkItem('0xaa36a7', 'Sepolia'), // Test network
        createNetworkItem('0xa4b1', 'Arbitrum'),
        createNetworkItem(MultichainNetworks.SOLANA, 'Solana'),
        createNetworkItem(CHAIN_IDS.MAINNET, 'Ethereum'),
        createNetworkItem('0xa', 'Optimism'),
        createNetworkItem('0x13881', 'Mumbai'), // Test network
      ];

      const sorted = sortNetworkAddressItems(items);

      expect(sorted[0].networkName).toBe('Ethereum');
      expect(sorted[1].networkName).toBe('Solana');
      expect(sorted[2].networkName).toBe('Arbitrum');
      expect(sorted[3].networkName).toBe('Optimism');
      expect(sorted[4].networkName).toBe('Polygon');

      const lastTwo = sorted.slice(-2);
      expect(lastTwo.map((item) => item.chainId)).toContain('0xaa36a7');
      expect(lastTwo.map((item) => item.chainId)).toContain('0x13881');
    });

    it('handles edge cases (empty array, single item)', () => {
      expect(sortNetworkAddressItems([])).toEqual([]);

      const singleItem = [createNetworkItem('0x1', 'Ethereum')];
      expect(sortNetworkAddressItems(singleItem)).toEqual(singleItem);
    });
  });

  describe('getCompatibleNetworksForAccount', () => {
    const mockNetworks = {
      'eip155:1': {
        name: 'Ethereum',
        chainId: 'eip155:1' as CaipChainId,
      },
      'eip155:137': { name: 'Polygon', chainId: 'eip155:137' as CaipChainId },
      'eip155:42161': {
        name: 'Arbitrum',
        chainId: 'eip155:42161' as CaipChainId,
      },
      'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': {
        name: 'Solana',
        chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp' as CaipChainId,
      },
    };

    const createMockAccount = (
      address: string,
      scopes: string[],
    ): InternalAccount => ({
      id: '1',
      address,
      metadata: {
        name: 'Test Account',
        importTime: Date.now(),
        keyring: { type: 'HD Key Tree' },
      },
      options: {},
      methods: [],
      type: 'eip155:eoa',
      scopes: scopes as `${string}:${string}`[],
    });

    it('returns compatible networks for different scope types with CAIP chain IDs', () => {
      // Test wildcard EVM scope
      const evmAccount = createMockAccount(
        '0xa0b86991c431e50c0dd0b653aa1e8c7b7c66f5e4b',
        ['eip155:*'],
      );
      const evmResult = getCompatibleNetworksForAccount(
        evmAccount,
        mockNetworks,
      );
      expect(evmResult).toHaveLength(3); // All EVM networks
      expect(evmResult.map((item) => item.chainId)).toContain('eip155:1');
      expect(evmResult.map((item) => item.chainId)).toContain('eip155:137');
      expect(evmResult.map((item) => item.chainId)).toContain('eip155:42161');
      expect(
        evmResult.every(
          (item) =>
            item.address === '0xa0b86991c431e50c0dd0b653aa1e8c7b7c66f5e4b',
        ),
      ).toBe(true);

      // Test specific network scope
      const specificAccount = createMockAccount('0x456', ['eip155:1']);
      const specificResult = getCompatibleNetworksForAccount(
        specificAccount,
        mockNetworks,
      );
      expect(specificResult).toHaveLength(1);
      expect(specificResult[0].chainId).toBe('eip155:1'); // CAIP format
      expect(specificResult[0].networkName).toBe('Ethereum');

      // Test Solana scope (non-EVM stays in CAIP format)
      const solanaAccount = createMockAccount('DRpbCBMx...', ['solana:*']);
      const solanaResult = getCompatibleNetworksForAccount(
        solanaAccount,
        mockNetworks,
      );
      expect(solanaResult).toHaveLength(1);
      expect(solanaResult[0].chainId).toBe(
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
      );

      // Test multiple scopes
      const multiAccount = createMockAccount('0x789', [
        'eip155:1',
        'eip155:137',
      ]);
      const multiResult = getCompatibleNetworksForAccount(
        multiAccount,
        mockNetworks,
      );
      expect(multiResult).toHaveLength(2);
      expect(multiResult.map((item) => item.chainId)).toContain('eip155:1');
      expect(multiResult.map((item) => item.chainId)).toContain('eip155:137');

      // Test eip155:0 as wildcard
      const wildcardAccount = createMockAccount('0xabc', ['eip155:0']);
      const wildcardResult = getCompatibleNetworksForAccount(
        wildcardAccount,
        mockNetworks,
      );
      expect(wildcardResult).toHaveLength(3); // All EVM networks
    });

    it('handles edge cases (no scopes, undefined scopes, non-existent networks, empty networks)', () => {
      // No scopes
      const noScopesAccount = createMockAccount(
        '0x742d35cc6eb48ac0f67b9d5e5b8cd4a03e8c8e1c',
        [],
      );
      expect(
        getCompatibleNetworksForAccount(noScopesAccount, mockNetworks),
      ).toHaveLength(0);

      // Undefined scopes
      const undefinedScopesAccount = createMockAccount(
        '0x742d35cc6eb48ac0f67b9d5e5b8cd4a03e8c8e1c',
        [],
      );
      // @ts-expect-error - Testing undefined scopes
      undefinedScopesAccount.scopes = undefined;
      expect(
        getCompatibleNetworksForAccount(undefinedScopesAccount, mockNetworks),
      ).toHaveLength(0);

      // Non-existent network
      const badScopeAccount = createMockAccount(
        '0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be',
        ['eip155:999'],
      );
      expect(
        getCompatibleNetworksForAccount(badScopeAccount, mockNetworks),
      ).toHaveLength(0);

      // Empty networks
      const emptyNetworksAccount = createMockAccount(
        '0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be',
        ['eip155:*'],
      );
      expect(
        getCompatibleNetworksForAccount(emptyNetworksAccount, {}),
      ).toHaveLength(0);
    });
  });
});
