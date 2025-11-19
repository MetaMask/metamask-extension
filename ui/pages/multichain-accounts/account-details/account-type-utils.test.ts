import { InternalAccount } from '@metamask/keyring-internal-api';
import {
  MOCK_ACCOUNT_BIP122_P2WPKH,
  MOCK_ACCOUNT_EOA,
  MOCK_ACCOUNT_ERC4337,
  MOCK_ACCOUNT_HARDWARE,
  MOCK_ACCOUNT_INSTITUTIONAL,
  MOCK_ACCOUNT_PRIVATE_KEY,
  MOCK_ACCOUNT_SOLANA_MAINNET,
} from '../../../../test/data/mock-accounts';
import {
  getAccountTypeCategory,
  isEVMAccount,
  isSolanaAccount,
  isHardwareAccount,
  isPrivateKeyAccount,
  isInstitutionalEVMAccount,
  isBitcoinAccount,
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

  describe('isEVMAccount', () => {
    it('should return true for EOA accounts', () => {
      expect(isEVMAccount(MOCK_ACCOUNT_EOA)).toBe(true);
    });

    it('should return true for ERC-4337 accounts', () => {
      expect(isEVMAccount(MOCK_ACCOUNT_ERC4337)).toBe(true);
    });

    it('should return false for Solana accounts', () => {
      expect(isEVMAccount(MOCK_ACCOUNT_SOLANA_MAINNET)).toBe(false);
    });
  });

  describe('isSolanaAccount', () => {
    it('should return true for Solana accounts', () => {
      expect(isSolanaAccount(MOCK_ACCOUNT_SOLANA_MAINNET)).toBe(true);
    });

    it('should return false for EOA accounts', () => {
      expect(isSolanaAccount(MOCK_ACCOUNT_EOA)).toBe(false);
    });

    it('should return false for ERC-4337 accounts', () => {
      expect(isSolanaAccount(MOCK_ACCOUNT_ERC4337)).toBe(false);
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

  describe('isPrivateKeyAccount', () => {
    it('should return true for private key accounts', () => {
      expect(isPrivateKeyAccount(MOCK_ACCOUNT_PRIVATE_KEY)).toBe(true);
    });

    it('should return false for EOA accounts', () => {
      expect(isPrivateKeyAccount(MOCK_ACCOUNT_EOA)).toBe(false);
    });

    it('should return false for Solana accounts', () => {
      expect(isPrivateKeyAccount(MOCK_ACCOUNT_SOLANA_MAINNET)).toBe(false);
    });
  });

  describe('isInstitutionalEVMAccount', () => {
    it('should return true for institutional EVM accounts', () => {
      expect(isInstitutionalEVMAccount(MOCK_ACCOUNT_INSTITUTIONAL)).toBe(true);
    });

    it('should return false for regular EOA accounts', () => {
      expect(isInstitutionalEVMAccount(MOCK_ACCOUNT_EOA)).toBe(false);
    });

    it('should return false for regular ERC-4337 accounts', () => {
      expect(isInstitutionalEVMAccount(MOCK_ACCOUNT_ERC4337)).toBe(false);
    });
  });

  describe('isBitcoinAccount', () => {
    it('should return true for Bitcoin accounts', () => {
      expect(isBitcoinAccount(MOCK_ACCOUNT_BIP122_P2WPKH)).toBe(true);
    });

    it('should return false for EOA accounts', () => {
      expect(isBitcoinAccount(MOCK_ACCOUNT_EOA)).toBe(false);
    });

    it('should return false for Solana accounts', () => {
      expect(isBitcoinAccount(MOCK_ACCOUNT_SOLANA_MAINNET)).toBe(false);
    });
  });
});
