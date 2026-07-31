import { SolScope } from '@metamask/keyring-api';
import {
  getSecurityTrustBlockExplorerLink,
  getSecurityTrustTokenTypeLabel,
  toSecurityTrustChainId,
} from './security-trust-utils';

const SOLANA_MAINNET = SolScope.Mainnet;

describe('security-trust-utils', () => {
  describe('toSecurityTrustChainId', () => {
    it('returns CAIP chain ids unchanged', () => {
      expect(toSecurityTrustChainId('eip155:1')).toBe('eip155:1');
      expect(toSecurityTrustChainId(SOLANA_MAINNET)).toBe(SOLANA_MAINNET);
    });

    it('converts EVM hex chain ids to CAIP', () => {
      expect(toSecurityTrustChainId('0x1')).toBe('eip155:1');
    });

    it('returns undefined for invalid chain ids', () => {
      expect(toSecurityTrustChainId(undefined)).toBeUndefined();
      expect(toSecurityTrustChainId('')).toBeUndefined();
    });
  });

  describe('getSecurityTrustTokenTypeLabel', () => {
    it('returns Native for native assets', () => {
      expect(getSecurityTrustTokenTypeLabel('eip155:1/erc20:0xabc', true)).toBe(
        'Native',
      );
    });

    it('returns ERC-20 for EVM fungible tokens', () => {
      expect(
        getSecurityTrustTokenTypeLabel('eip155:1/erc20:0xabc', false),
      ).toBe('ERC-20');
    });

    it('returns SPL for Solana fungible tokens', () => {
      expect(
        getSecurityTrustTokenTypeLabel(
          `${SOLANA_MAINNET}/spl:TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA`,
          false,
        ),
      ).toBe('SPL');
    });
  });

  describe('getSecurityTrustBlockExplorerLink', () => {
    it('returns an EVM explorer link', () => {
      const link = getSecurityTrustBlockExplorerLink({
        caipChainId: 'eip155:1',
        tokenAddress: '0xabc',
        isNative: false,
        evmNetworkConfigurations: {
          '0x1': {
            chainId: '0x1',
            name: 'Ethereum Mainnet',
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
          },
        },
        fallbackExplorerLabel: 'Etherscan',
      });

      expect(link?.url).toContain('etherscan.io');
      expect(link?.name).toBe('Ethereum Mainnet');
    });

    it('returns a non-EVM explorer link', () => {
      const link = getSecurityTrustBlockExplorerLink({
        caipChainId: SOLANA_MAINNET,
        tokenAddress: 'So11111111111111111111111111111111111111112',
        isNative: false,
        evmNetworkConfigurations: {},
        multichainNetworkConfigurations: {
          [SOLANA_MAINNET]: {
            chainId: SOLANA_MAINNET,
            name: 'Solana',
          },
        },
        fallbackExplorerLabel: 'Etherscan',
      });

      expect(link?.url).toContain('solscan.io');
      expect(link?.name).toBeTruthy();
    });

    it('returns null for native assets', () => {
      expect(
        getSecurityTrustBlockExplorerLink({
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
