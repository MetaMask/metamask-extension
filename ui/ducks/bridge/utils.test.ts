import { type CaipAssetType } from '@metamask/utils';
import { toBridgeToken } from './utils';

const BASE_PAYLOAD = {
  assetId:
    'eip155:1/erc20:0xaca92e438df0b2401ff60da7e4337b687a2435da' as CaipAssetType,
  symbol: 'mUSD',
  name: 'MetaMask USD',
  decimals: 18,
};

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
