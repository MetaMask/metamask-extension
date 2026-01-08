import { KeyringAccountType } from '@metamask/keyring-api';
import type { InternalAccount } from '@metamask/keyring-internal-api';
import { sortAccounts } from './sortAccounts';

describe('sortAccounts', () => {
  const createMockAccount = (
    address: string,
    type: string,
    name?: string,
  ): InternalAccount => ({
    id: `mock-${address}`,
    address,
    type: type as KeyringAccountType,
    options: {},
    metadata: {
      name: name || `Account ${address}`,
      importTime: Date.now(),
      keyring: {
        type: 'HD Key Tree',
      },
    },
    methods: [],
    scopes: [],
  });

  describe('when sorting accounts by type', () => {
    it('should prioritize EIP155 accounts over non-EIP155 accounts', () => {
      // Arrange
      const evmAccount = createMockAccount('0x123', 'eip155:1');
      const solanaAccount = createMockAccount(
        'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH',
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
      );
      const accounts = [solanaAccount, evmAccount];

      // Act
      const sortedAccounts = sortAccounts(accounts);

      // Assert
      expect(sortedAccounts[0]).toBe(evmAccount);
      expect(sortedAccounts[1]).toBe(solanaAccount);
    });

    it('should maintain original order for accounts of the same type', () => {
      // Arrange
      const evmAccount1 = createMockAccount('0x111', 'eip155:1');
      const evmAccount2 = createMockAccount('0x222', 'eip155:1');
      const evmAccount3 = createMockAccount('0x333', 'eip155:1');
      const accounts = [evmAccount2, evmAccount1, evmAccount3];

      // Act
      const sortedAccounts = sortAccounts(accounts);

      // Assert
      expect(sortedAccounts).toEqual([evmAccount2, evmAccount1, evmAccount3]);
    });

    it('should maintain original order for non-EIP155 accounts of the same type', () => {
      // Arrange
      const solanaAccount1 = createMockAccount(
        'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH',
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
      );
      const solanaAccount2 = createMockAccount(
        '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
      );
      const accounts = [solanaAccount2, solanaAccount1];

      // Act
      const sortedAccounts = sortAccounts(accounts);

      // Assert
      expect(sortedAccounts).toEqual([solanaAccount2, solanaAccount1]);
    });

    it('should handle mixed account types correctly', () => {
      // Arrange
      const evmAccount1 = createMockAccount('0x111', 'eip155:1');
      const solanaAccount1 = createMockAccount(
        'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH',
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
      );
      const evmAccount2 = createMockAccount('0x222', 'eip155:137');
      const solanaAccount2 = createMockAccount(
        '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
      );
      const accounts = [
        solanaAccount1,
        evmAccount1,
        solanaAccount2,
        evmAccount2,
      ];

      // Act
      const sortedAccounts = sortAccounts(accounts);

      // Assert
      expect(sortedAccounts[0]).toBe(evmAccount1);
      expect(sortedAccounts[1]).toBe(evmAccount2);
      expect(sortedAccounts[2]).toBe(solanaAccount1);
      expect(sortedAccounts[3]).toBe(solanaAccount2);
    });

    it('should handle empty array', () => {
      // Arrange
      const accounts: InternalAccount[] = [];

      // Act
      const sortedAccounts = sortAccounts(accounts);

      // Assert
      expect(sortedAccounts).toEqual([]);
    });

    it('should handle single account', () => {
      // Arrange
      const evmAccount = createMockAccount('0x123', 'eip155:1');
      const accounts = [evmAccount];

      // Act
      const sortedAccounts = sortAccounts(accounts);

      // Assert
      expect(sortedAccounts).toEqual([evmAccount]);
    });

    it('should not mutate the original array', () => {
      // Arrange
      const evmAccount = createMockAccount('0x111', 'eip155:1');
      const solanaAccount = createMockAccount(
        'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH',
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
      );
      const accounts = [solanaAccount, evmAccount];
      const originalAccounts = [...accounts];

      // Act
      const sortedAccounts = sortAccounts(accounts);

      // Assert
      expect(accounts).toEqual(originalAccounts);
      expect(sortedAccounts).not.toBe(accounts);
    });

    it('should handle accounts with different EIP155 chain IDs', () => {
      // Arrange
      const ethereumAccount = createMockAccount('0x111', 'eip155:1');
      const polygonAccount = createMockAccount('0x222', 'eip155:137');
      const arbitrumAccount = createMockAccount('0x333', 'eip155:42161');
      const accounts = [polygonAccount, ethereumAccount, arbitrumAccount];

      // Act
      const sortedAccounts = sortAccounts(accounts);

      // Assert
      // All EIP155 accounts should come first, maintaining original order
      expect(sortedAccounts[0]).toBe(polygonAccount);
      expect(sortedAccounts[1]).toBe(ethereumAccount);
      expect(sortedAccounts[2]).toBe(arbitrumAccount);
    });

    it('should handle accounts with non-standard types', () => {
      // Arrange
      const evmAccount = createMockAccount('0x111', 'eip155:1');
      const customAccount = createMockAccount('custom123', 'custom:type');
      const accounts = [customAccount, evmAccount];

      // Act
      const sortedAccounts = sortAccounts(accounts);

      // Assert
      expect(sortedAccounts[0]).toBe(evmAccount);
      expect(sortedAccounts[1]).toBe(customAccount);
    });

    it('should handle accounts with empty type strings', () => {
      // Arrange
      const evmAccount = createMockAccount('0x111', 'eip155:1');
      const emptyTypeAccount = createMockAccount('empty123', '');
      const accounts = [emptyTypeAccount, evmAccount];

      // Act
      const sortedAccounts = sortAccounts(accounts);

      // Assert
      expect(sortedAccounts[0]).toBe(evmAccount);
      expect(sortedAccounts[1]).toBe(emptyTypeAccount);
    });
  });
});
