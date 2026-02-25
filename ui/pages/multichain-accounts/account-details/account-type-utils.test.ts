import { InternalAccount } from '@metamask/keyring-internal-api';
import {
  MOCK_ACCOUNT_EOA,
  MOCK_ACCOUNT_ERC4337,
  MOCK_ACCOUNT_HARDWARE,
  MOCK_ACCOUNT_SOLANA_MAINNET,
} from '../../../../test/data/mock-accounts';
import {
  getAccountTypeCategory,
  isHardwareAccount,
} from './account-type-utils';

describe('Account Type Utils', () => {
  describe('getAccountTypeCategory', () => {
    it('should return "evm" for EOA accounts', () => {
      expect(getAccountTypeCategory(MOCK_ACCOUNT_EOA)).toBe('evm');
    });

    it('should return "evm" for ERC-4337 accounts', () => {
      expect(getAccountTypeCategory(MOCK_ACCOUNT_ERC4337)).toBe('evm');
    });

    it('should return "solana" for Solana accounts', () => {
      expect(getAccountTypeCategory(MOCK_ACCOUNT_SOLANA_MAINNET)).toBe(
        'solana',
      );
    });

    it('should return "unknown" for null/undefined accounts', () => {
      expect(getAccountTypeCategory(null as unknown as InternalAccount)).toBe(
        'unknown',
      );
      expect(
        getAccountTypeCategory(undefined as unknown as InternalAccount),
      ).toBe('unknown');
    });
  });

  describe('isHardwareAccount', () => {
    it('should return true for hardware accounts', () => {
      expect(isHardwareAccount(MOCK_ACCOUNT_HARDWARE)).toBe(true);
    });

    it('should return false for EOA accounts', () => {
      expect(isHardwareAccount(MOCK_ACCOUNT_EOA)).toBe(false);
    });

    it('should return false for Solana accounts', () => {
      expect(isHardwareAccount(MOCK_ACCOUNT_SOLANA_MAINNET)).toBe(false);
    });
  });
});
