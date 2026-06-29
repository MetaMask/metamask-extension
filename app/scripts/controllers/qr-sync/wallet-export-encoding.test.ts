import {
  encodeMnemonicForWalletExport,
  encodePrivateKeyForWalletExport,
} from './wallet-export-encoding';

describe('wallet-export-encoding', () => {
  describe('encodeMnemonicForWalletExport', () => {
    it('base64-encodes the UTF-8 mnemonic string', () => {
      const indices = new Uint16Array([
        1788, 1788, 1788, 1788, 1788, 1788, 1788, 1788, 1788, 1788, 1788, 970,
      ]);
      const wordlistIndices = new Uint8Array(indices.buffer);

      expect(encodeMnemonicForWalletExport(wordlistIndices)).toBe(
        'dGVzdCB0ZXN0IHRlc3QgdGVzdCB0ZXN0IHRlc3QgdGVzdCB0ZXN0IHRlc3QgdGVzdCB0ZXN0IGp1bms=',
      );
    });
  });

  describe('encodePrivateKeyForWalletExport', () => {
    it('base64-encodes the UTF-8 hex private key string', () => {
      expect(encodePrivateKeyForWalletExport('0xabcdef')).toBe('MHhhYmNkZWY=');
    });
  });
});
