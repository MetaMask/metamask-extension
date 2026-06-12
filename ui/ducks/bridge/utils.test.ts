import { type CaipAssetType } from '@metamask/utils';
import { MultichainNetworks } from '../../../shared/constants/multichain/networks';
import { CHAIN_IDS } from '../../../shared/constants/network';
import { BridgeAssetSecurityDataType } from '../../pages/bridge/utils/tokens';
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
  describe('securityData', () => {
    it('passes securityData from the payload when tokenMetadata has no securityData', () => {
      const token = toBridgeToken(
        {
          ...BASE_PAYLOAD,
          securityData: { type: BridgeAssetSecurityDataType.MALICIOUS },
        },
        { balance: '10' },
      );
      expect(token.securityData).toStrictEqual({
        type: BridgeAssetSecurityDataType.MALICIOUS,
      });
    });

    it('tokenMetadata.securityData takes precedence over payload.securityData', () => {
      const token = toBridgeToken(
        {
          ...BASE_PAYLOAD,
          securityData: { type: BridgeAssetSecurityDataType.SPAM },
        },
        { securityData: { type: BridgeAssetSecurityDataType.VERIFIED } },
      );
      expect(token.securityData).toStrictEqual({
        type: BridgeAssetSecurityDataType.VERIFIED,
      });
    });

    it('securityData is undefined when absent from both payload and tokenMetadata', () => {
      const token = toBridgeToken(BASE_PAYLOAD, { balance: '10' });
      expect(token.securityData).toBeUndefined();
    });
  });

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

    describe('securityData', () => {
      it('returns true when tokenMetadata.securityData.type is VERIFIED', () => {
        const token = toBridgeToken(BASE_PAYLOAD, {
          securityData: { type: BridgeAssetSecurityDataType.VERIFIED },
        });
        expect(token.isVerified).toBe(true);
      });

      it('returns true when tokenMetadata.securityData.type is VERIFIED even if tokenMetadata.isVerified is false', () => {
        const token = toBridgeToken(BASE_PAYLOAD, {
          isVerified: false,
          securityData: { type: BridgeAssetSecurityDataType.VERIFIED },
        });
        expect(token.isVerified).toBe(true);
      });

      it('falls back to tokenMetadata.isVerified when securityData.type is not VERIFIED', () => {
        const token = toBridgeToken(BASE_PAYLOAD, {
          isVerified: true,
          securityData: { type: BridgeAssetSecurityDataType.WARNING },
        });
        expect(token.isVerified).toBe(true);
      });

      it('falls back to payload isVerified when securityData.type is not VERIFIED and tokenMetadata.isVerified is absent', () => {
        const token = toBridgeToken(
          { ...BASE_PAYLOAD, isVerified: true },
          { securityData: { type: BridgeAssetSecurityDataType.BENIGN } },
        );
        expect(token.isVerified).toBe(true);
      });

      it('returns false when securityData.type is not VERIFIED and tokenMetadata.isVerified is false', () => {
        const token = toBridgeToken(BASE_PAYLOAD, {
          isVerified: false,
          securityData: { type: BridgeAssetSecurityDataType.SPAM },
        });
        expect(token.isVerified).toBe(false);
      });

      it('returns undefined when no securityData and no isVerified in either payload or tokenMetadata', () => {
        const token = toBridgeToken(BASE_PAYLOAD, { balance: '50' });
        expect(token.isVerified).toBeUndefined();
      });
    });
  });
});
