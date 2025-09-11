import { AccountGroupId } from '@metamask/account-api';
import { getSanitizedChainId, extractWalletIdFromGroupId } from './utils';

describe('Account tree selectors utils', () => {
  describe('getSanitizedChainId', () => {
    it('should return the chain ID if it is not an EIP-155 chain ID', () => {
      expect(getSanitizedChainId('solana:mainnet')).toBe('solana:mainnet');
    });

    it('should return the chain ID if it is an EIP-155 chain ID', () => {
      expect(getSanitizedChainId('eip155:1')).toBe('eip155:0');
    });
  });

  describe('extractWalletIdFromGroupId', () => {
    describe('entropy wallet IDs', () => {
      it('extracts wallet ID from entropy format', () => {
        const accountGroupId =
          'entropy:01K1100EDPEV57BY4136X5CBEJ/1' as AccountGroupId;
        const result = extractWalletIdFromGroupId(accountGroupId);
        expect(result).toBe('entropy:01K1100EDPEV57BY4136X5CBEJ');
      });
    });

    describe('snap wallet IDs', () => {
      it('extracts wallet ID from snap npm format with organization', () => {
        const accountGroupId =
          'snap:npm:@metamask/snap-simple-keyring-snap/0x6de4728d5d625ee2c583f6ed589654e2155674f2' as AccountGroupId;
        const result = extractWalletIdFromGroupId(accountGroupId);
        expect(result).toBe('snap:npm:@metamask/snap-simple-keyring-snap');
      });

      it('extracts wallet ID from snap npm format without organization', () => {
        const accountGroupId =
          'snap:npm:some-package/0xb552685e3d2790efd64a175b00d51f02cdafee5d' as AccountGroupId;
        const result = extractWalletIdFromGroupId(accountGroupId);
        expect(result).toBe('snap:npm:some-package');
      });

      it('extracts wallet ID from snap local format', () => {
        const accountGroupId =
          'snap:local:snap-id/0xb552685e3d2790efd64a175b00d51f02cdafee5d' as AccountGroupId;
        const result = extractWalletIdFromGroupId(accountGroupId);
        expect(result).toBe('snap:local:snap-id');
      });
    });

    describe('keyring wallet IDs', () => {
      it('extracts wallet ID from keyring format', () => {
        const accountGroupId = 'keyring:Ledger Hardware/1' as AccountGroupId;
        const result = extractWalletIdFromGroupId(accountGroupId);
        expect(result).toBe('keyring:Ledger Hardware');
      });
    });
  });
});
