import { SolScope } from '@metamask/keyring-api';
import {
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

    it('returns SPL for Solana fungible tokens using production CAIP ids', () => {
      expect(
        getSecurityTrustTokenTypeLabel(
          `${SOLANA_MAINNET}/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`,
          false,
        ),
      ).toBe('SPL');
    });

    it('returns SPL for legacy Solana spl namespace ids', () => {
      expect(
        getSecurityTrustTokenTypeLabel(
          `${SOLANA_MAINNET}/spl:TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA`,
          false,
        ),
      ).toBe('SPL');
    });
  });
});
