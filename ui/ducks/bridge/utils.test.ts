import { type CaipAssetType } from '@metamask/utils';
import { MultichainNetworks } from '../../../shared/constants/multichain/networks';
import { CHAIN_IDS } from '../../../shared/constants/network';
import { isSupportedBridgeChain, toBridgeToken } from './utils';

const BASE_PAYLOAD = {
  assetId:
    'eip155:1/erc20:0xaca92e438df0b2401ff60da7e4337b687a2435da' as CaipAssetType,
  symbol: 'mUSD',
  name: 'MetaMask USD',
  decimals: 18,
};

describe('isSupportedBridgeChain', () => {
  describe('EVM chains', () => {
    it('returns true for a supported EVM chain (mainnet)', () => {
      expect(isSupportedBridgeChain(`eip155:1`)).toBe(true);
    });

    it('returns true for a supported EVM chain (Arbitrum)', () => {
      expect(isSupportedBridgeChain(`eip155:42161`)).toBe(true);
    });

    it('returns true for a supported EVM chain (BSC)', () => {
      expect(
        isSupportedBridgeChain(
          `eip155:${parseInt(CHAIN_IDS.BSC, 16)}` as never,
        ),
      ).toBe(true);
    });

    it('returns false for an unknown EVM chain', () => {
      expect(isSupportedBridgeChain(`eip155:99999` as never)).toBe(false);
    });
  });

  describe('non-EVM chains', () => {
    it('returns true for Solana mainnet', () => {
      expect(isSupportedBridgeChain(MultichainNetworks.SOLANA)).toBe(true);
    });

    it('returns true for Bitcoin mainnet', () => {
      expect(isSupportedBridgeChain(MultichainNetworks.BITCOIN)).toBe(true);
    });

    it('returns false for an unknown Solana network', () => {
      expect(isSupportedBridgeChain(`solana:unknown-testnet` as never)).toBe(
        false,
      );
    });

    it('returns false for an entirely unknown non-EVM namespace', () => {
      expect(isSupportedBridgeChain(`cosmos:cosmoshub-4` as never)).toBe(false);
    });
  });
});

describe('toBridgeToken', () => {
  describe('isVerified', () => {
    it('includes isVerified: true from the payload', () => {
      const token = toBridgeToken({ ...BASE_PAYLOAD, isVerified: true });
      expect(token.isVerified).toBe(true);
    });

    it('includes isVerified: false from the payload', () => {
      const token = toBridgeToken({ ...BASE_PAYLOAD, isVerified: false });
      expect(token.isVerified).toBe(false);
    });

    it('leaves isVerified undefined when absent from the payload', () => {
      const token = toBridgeToken(BASE_PAYLOAD);
      expect(token.isVerified).toBeUndefined();
    });

    it('lets tokenMetadata.isVerified override the payload value', () => {
      const token = toBridgeToken(
        { ...BASE_PAYLOAD, isVerified: false },
        { isVerified: true },
      );
      expect(token.isVerified).toBe(true);
    });

    it('falls back to payload isVerified when tokenMetadata.isVerified is undefined', () => {
      const token = toBridgeToken(
        { ...BASE_PAYLOAD, isVerified: true },
        { balance: '50' },
      );
      expect(token.isVerified).toBe(true);
    });
  });
});
