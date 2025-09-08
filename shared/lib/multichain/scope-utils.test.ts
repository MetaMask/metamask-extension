import { AccountGroupType } from '@metamask/account-api';
import { EthScope } from '@metamask/keyring-api';
import { KnownCaipNamespace, CaipChainId } from '@metamask/utils';

// Import the actual type to avoid linting issues with restricted paths
// eslint-disable-next-line import/no-restricted-paths
import type { AccountGroupWithInternalAccounts } from '../../../ui/selectors/multichain-accounts/account-tree.types';

import {
  anyScopesMatch,
  getCaip25AccountFromAccountGroupAndScope,
  scopeMatches,
} from './scope-utils';

const createMockFactory = () => {
  // Common account metadata
  const createAccountMetadata = (name: string) => ({
    name,
    keyring: { type: 'HD Key Tree' },
    importTime: 0,
  });

  // Common group metadata
  const createGroupMetadata = (name: string, groupIndex: number = 0) => ({
    name,
    pinned: false,
    hidden: false,
    entropy: { groupIndex },
  });

  // Account factory with common defaults
  const createMockAccount = (
    overrides: Partial<AccountGroupWithInternalAccounts['accounts'][0]> = {},
  ) => ({
    id: 'mock-account-id',
    address: '0x1234567890123456789012345678901234567890',
    metadata: createAccountMetadata('Mock Account'),
    options: {},
    methods: [],
    scopes: [`${KnownCaipNamespace.Eip155}:0`] as `${string}:${string}`[],
    type: 'eip155:eoa' as const,
    ...overrides,
  });

  // Group factory with common defaults
  const createMockAccountGroup = (
    overrides: Partial<AccountGroupWithInternalAccounts> = {},
  ) => ({
    id: 'entropy:mock-group-id/0',
    type: AccountGroupType.MultichainAccount,
    metadata: createGroupMetadata('Mock Group'),
    walletName: 'Mock Wallet',
    accounts: [createMockAccount()],
    ...overrides,
  });

  // Predefined accounts for reuse
  const accounts = {
    eip155Wildcard: createMockAccount({
      id: 'account1',
      address: '0x1234567890123456789012345678901234567890',
      metadata: createAccountMetadata('Account 1'),
      scopes: [`${KnownCaipNamespace.Eip155}:0`],
    }),
    eip155Specific: createMockAccount({
      id: 'account2',
      address: '0x2345678901234567890123456789012345678901',
      metadata: createAccountMetadata('Account 2'),
      scopes: [`${KnownCaipNamespace.Eip155}:1`],
    }),
    eip155Specific137: createMockAccount({
      id: 'account2b',
      address: '0x2345678901234567890123456789012345678902',
      metadata: createAccountMetadata('Account 2b'),
      scopes: [`${KnownCaipNamespace.Eip155}:137`],
    }),
    eip155MultipleSpecific: createMockAccount({
      id: 'account2c',
      address: '0x2345678901234567890123456789012345678903',
      metadata: createAccountMetadata('Account 2c'),
      scopes: [
        `${KnownCaipNamespace.Eip155}:1`,
        `${KnownCaipNamespace.Eip155}:137`,
      ],
    }),
    solana: createMockAccount({
      id: 'account3',
      address: '0x3456789012345678901234567890123456789012',
      metadata: createAccountMetadata('Account 3'),
      scopes: ['solana:mainnet'],
      type: 'solana:data-account',
    }),
    multiScope: createMockAccount({
      id: 'account4',
      address: '0x4567890123456789012345678901234567890123',
      metadata: createAccountMetadata('Account 4'),
      scopes: [`${KnownCaipNamespace.Eip155}:0`, 'solana:mainnet'],
    }),
    emptyScopes: createMockAccount({
      id: 'account1',
      address: '0x1234567890123456789012345678901234567890',
      metadata: createAccountMetadata('Account 1'),
      scopes: [],
    }),
    undefinedScopes: createMockAccount({
      id: 'account1',
      address: '0x1234567890123456789012345678901234567890',
      metadata: createAccountMetadata('Account 1'),
      scopes: undefined as unknown as `${string}:${string}`[],
    }),
    multipleScopes: createMockAccount({
      id: 'account1',
      address: '0x1234567890123456789012345678901234567890',
      metadata: createAccountMetadata('Account 1'),
      scopes: [
        `${KnownCaipNamespace.Eip155}:0`,
        'solana:mainnet',
        'solana:devnet',
      ],
    }),
  };

  // Main account groups using predefined accounts
  const createMockAccountGroups = (): AccountGroupWithInternalAccounts[] => [
    {
      id: 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/0',
      type: AccountGroupType.MultichainAccount,
      metadata: createGroupMetadata('Test Group 1'),
      accounts: [
        accounts.eip155Wildcard,
        accounts.eip155Specific,
        accounts.eip155Specific137,
        accounts.eip155MultipleSpecific,
        accounts.solana,
      ],
    },
    {
      id: 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/1',
      type: AccountGroupType.MultichainAccount,
      metadata: createGroupMetadata('Test Group 2', 1),
      accounts: [accounts.multiScope],
    },
  ];

  // Specialized account groups using predefined accounts
  const createMockAccountGroupsWithEmptyScopes =
    (): AccountGroupWithInternalAccounts[] => [
      {
        id: 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/0',
        type: AccountGroupType.MultichainAccount,
        metadata: createGroupMetadata('Test Group'),
        accounts: [accounts.emptyScopes],
      },
    ];

  const createMockAccountGroupsWithUndefinedScopes =
    (): AccountGroupWithInternalAccounts[] => [
      {
        id: 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/0',
        type: AccountGroupType.MultichainAccount,
        metadata: createGroupMetadata('Test Group'),
        accounts: [accounts.undefinedScopes],
      },
    ];

  const createMockAccountGroupsWithMultipleScopes =
    (): AccountGroupWithInternalAccounts[] => [
      {
        id: 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/0',
        type: AccountGroupType.MultichainAccount,
        metadata: createGroupMetadata('Test Group'),
        accounts: [accounts.multipleScopes],
      },
    ];

  const createMockScopes = {
    eip155Wildcard: [`${KnownCaipNamespace.Eip155}:0`] as CaipChainId[],
    eip155Specific: [`${KnownCaipNamespace.Eip155}:1`] as CaipChainId[],
    eip155Specific137: [`${KnownCaipNamespace.Eip155}:137`] as CaipChainId[],
    solanaMainnet: ['solana:mainnet'] as CaipChainId[],
    multiple: [
      `${KnownCaipNamespace.Eip155}:0`,
      'solana:mainnet',
    ] as CaipChainId[],
    invalid: ['invalid:chain:id'] as CaipChainId[],
    mixed: [
      `${KnownCaipNamespace.Eip155}:0`,
      'invalid:chain:id' as CaipChainId,
      'solana:mainnet',
    ] as CaipChainId[],
    multipleSolana: [
      `${KnownCaipNamespace.Eip155}:0`,
      'solana:mainnet',
      'solana:devnet',
    ] as CaipChainId[],
    empty: [] as CaipChainId[],
  };

  const createMockAccountScopes = {
    eip155Only: ['eip155:1', 'eip155:137'],
    solanaOnly: ['solana:mainnet'],
    mixed: ['eip155:1', 'solana:mainnet'],
    bitcoinOnly: ['bip122:000000000019d6689c085ae165831e93'],
    eip155Wildcard: [`${KnownCaipNamespace.Eip155}:0`],
    eip155Specific: [`${KnownCaipNamespace.Eip155}:1`],
    empty: [],
    undefined: undefined as unknown as string[],
  };

  return {
    createMockAccount,
    createMockAccountGroup,
    createMockAccountGroups,
    createMockAccountGroupsWithEmptyScopes,
    createMockAccountGroupsWithUndefinedScopes,
    createMockAccountGroupsWithMultipleScopes,
    createMockScopes,
    createMockAccountScopes,
  };
};

const mockFactory = createMockFactory();

describe('scope-utils', () => {
  describe('anyScopesMatch', () => {
    it('returns false for empty account scopes', () => {
      expect(
        anyScopesMatch(mockFactory.createMockAccountScopes.empty, 'eip155:1'),
      ).toBe(false);
      expect(
        anyScopesMatch(
          mockFactory.createMockAccountScopes.undefined,
          'eip155:1',
        ),
      ).toBe(false);
    });

    it('returns true for direct scope match', () => {
      const accountScopes = mockFactory.createMockAccountScopes.mixed;
      expect(anyScopesMatch(accountScopes, 'eip155:1')).toBe(true);
      expect(anyScopesMatch(accountScopes, 'solana:mainnet')).toBe(true);
    });

    it('returns false for non-matching scope', () => {
      const accountScopes = mockFactory.createMockAccountScopes.mixed;
      expect(anyScopesMatch(accountScopes, 'eip155:137')).toBe(false);
      expect(
        anyScopesMatch(
          accountScopes,
          'bip122:000000000019d6689c085ae165831e93',
        ),
      ).toBe(false);
    });

    describe('eip155:0 wildcard handling', () => {
      it('returns true when requesting eip155:0 and account has any EVM scope', () => {
        const accountScopes = mockFactory.createMockAccountScopes.eip155Only;
        expect(anyScopesMatch(accountScopes, 'eip155:0')).toBe(true);
      });

      it('returns true when requesting eip155:0 and account has eip155:0 scope', () => {
        const accountScopes =
          mockFactory.createMockAccountScopes.eip155Wildcard;
        expect(anyScopesMatch(accountScopes, 'eip155:0')).toBe(true);
      });

      it('returns false when requesting eip155:0 and account has no EVM scopes', () => {
        const accountScopes = mockFactory.createMockAccountScopes.bitcoinOnly;
        expect(anyScopesMatch(accountScopes, 'eip155:0')).toBe(false);
      });
    });

    describe('specific EVM chain handling', () => {
      it('returns true when requesting specific EVM chain and account has eip155:0 scope', () => {
        const accountScopes = [EthScope.Eoa]; // eip155:0
        expect(anyScopesMatch(accountScopes, 'eip155:1')).toBe(true);
        expect(anyScopesMatch(accountScopes, 'eip155:137')).toBe(true);
      });

      it('returns true when requesting specific EVM chain and account has exact match', () => {
        const accountScopes =
          mockFactory.createMockAccountScopes.eip155Specific;
        expect(anyScopesMatch(accountScopes, 'eip155:1')).toBe(true);
      });

      it('returns false when requesting specific EVM chain and account has different EVM chain', () => {
        const accountScopes = ['eip155:137'];
        expect(anyScopesMatch(accountScopes, 'eip155:1')).toBe(false);
      });
    });

    describe('non-EVM scope handling', () => {
      it('returns true for exact non-EVM scope match', () => {
        const accountScopes = [
          'solana:mainnet',
          'bip122:000000000019d6689c085ae165831e93',
        ];
        expect(anyScopesMatch(accountScopes, 'solana:mainnet')).toBe(true);
        expect(
          anyScopesMatch(
            accountScopes,
            'bip122:000000000019d6689c085ae165831e93',
          ),
        ).toBe(true);
      });

      it('returns false for non-matching non-EVM scope', () => {
        const accountScopes = mockFactory.createMockAccountScopes.solanaOnly;
        expect(
          anyScopesMatch(
            accountScopes,
            'bip122:000000000019d6689c085ae165831e93',
          ),
        ).toBe(false);
      });
    });

    describe('malformed scope handling', () => {
      it('returns false for malformed target scope', () => {
        const accountScopes =
          mockFactory.createMockAccountScopes.eip155Specific;
        expect(anyScopesMatch(accountScopes, 'invalid-scope')).toBe(false);
        expect(anyScopesMatch(accountScopes, 'eip155')).toBe(false);
        expect(anyScopesMatch(accountScopes, '')).toBe(false);
      });
    });
  });

  describe('scopeMatches', () => {
    it('returns true for matching single scope', () => {
      expect(scopeMatches('eip155:1', 'eip155:1')).toBe(true);
      expect(scopeMatches('solana:mainnet', 'solana:mainnet')).toBe(true);
    });

    it('returns false for non-matching single scope', () => {
      expect(scopeMatches('eip155:1', 'eip155:137')).toBe(false);
      expect(scopeMatches('solana:mainnet', 'eip155:1')).toBe(false);
    });

    it('handles eip155:0 wildcard correctly', () => {
      expect(scopeMatches('eip155:1', 'eip155:0')).toBe(true);
      expect(scopeMatches('eip155:0', 'eip155:1')).toBe(true);
      expect(scopeMatches('solana:mainnet', 'eip155:0')).toBe(false);
    });
  });

  describe('getCaip25AccountFromAccountGroupAndScope', () => {
    const mockAccountGroups = mockFactory.createMockAccountGroups();

    it('should return CAIP-25 account IDs for EIP-155 wildcard scope', () => {
      const scopes = mockFactory.createMockScopes.eip155Wildcard;
      const result = getCaip25AccountFromAccountGroupAndScope(
        mockAccountGroups,
        scopes,
      );

      expect(result).toStrictEqual([
        `${KnownCaipNamespace.Eip155}:0:0x1234567890123456789012345678901234567890`,
        `${KnownCaipNamespace.Eip155}:0:0x4567890123456789012345678901234567890123`,
      ]);
    });

    it('should return CAIP-25 account IDs for specific EIP-155 chain', () => {
      const scopes = mockFactory.createMockScopes.eip155Specific;
      const result = getCaip25AccountFromAccountGroupAndScope(
        mockAccountGroups,
        scopes,
      );

      // For EIP-155 chains, accounts with eip155:0 wildcard scope AND direct matches are included
      expect(result).toStrictEqual([
        `${KnownCaipNamespace.Eip155}:1:0x1234567890123456789012345678901234567890`, // eip155Wildcard
        `${KnownCaipNamespace.Eip155}:1:0x2345678901234567890123456789012345678901`, // eip155Specific
        `${KnownCaipNamespace.Eip155}:1:0x2345678901234567890123456789012345678903`, // eip155MultipleSpecific
        `${KnownCaipNamespace.Eip155}:1:0x4567890123456789012345678901234567890123`, // multiScope
      ]);
    });

    it('should return CAIP-25 account IDs for non-EIP-155 namespaces', () => {
      const scopes = mockFactory.createMockScopes.solanaMainnet;
      const result = getCaip25AccountFromAccountGroupAndScope(
        mockAccountGroups,
        scopes,
      );

      expect(result).toStrictEqual([
        'solana:mainnet:0x3456789012345678901234567890123456789012',
        'solana:mainnet:0x4567890123456789012345678901234567890123',
      ]);
    });

    it('should handle multiple scopes and return unique CAIP-25 account IDs', () => {
      const scopes = mockFactory.createMockScopes.multiple;
      const result = getCaip25AccountFromAccountGroupAndScope(
        mockAccountGroups,
        scopes,
      );

      expect(result).toStrictEqual([
        `${KnownCaipNamespace.Eip155}:0:0x1234567890123456789012345678901234567890`,
        'solana:mainnet:0x3456789012345678901234567890123456789012',
        `${KnownCaipNamespace.Eip155}:0:0x4567890123456789012345678901234567890123`,
        'solana:mainnet:0x4567890123456789012345678901234567890123',
      ]);
    });

    it('should handle empty account groups', () => {
      const scopes = mockFactory.createMockScopes.eip155Wildcard;
      const result = getCaip25AccountFromAccountGroupAndScope([], scopes);

      expect(result).toStrictEqual([]);
    });

    it('should handle empty scopes', () => {
      const result = getCaip25AccountFromAccountGroupAndScope(
        mockAccountGroups,
        mockFactory.createMockScopes.empty,
      );

      expect(result).toStrictEqual([]);
    });

    it('should handle invalid chain IDs gracefully', () => {
      const scopes = mockFactory.createMockScopes.invalid;
      const result = getCaip25AccountFromAccountGroupAndScope(
        mockAccountGroups,
        scopes,
      );

      expect(result).toStrictEqual([]);
    });

    it('should handle accounts with empty scopes', () => {
      const accountGroupsWithEmptyScopes =
        mockFactory.createMockAccountGroupsWithEmptyScopes();

      const scopes = mockFactory.createMockScopes.eip155Wildcard;
      const result = getCaip25AccountFromAccountGroupAndScope(
        accountGroupsWithEmptyScopes,
        scopes,
      );

      expect(result).toStrictEqual([]);
    });

    it('should handle accounts with undefined scopes', () => {
      const accountGroupsWithUndefinedScopes =
        mockFactory.createMockAccountGroupsWithUndefinedScopes();

      const scopes = mockFactory.createMockScopes.eip155Wildcard;
      const result = getCaip25AccountFromAccountGroupAndScope(
        accountGroupsWithUndefinedScopes,
        scopes,
      );

      expect(result).toStrictEqual([]);
    });

    it('should handle mixed valid and invalid chain IDs', () => {
      const scopes = mockFactory.createMockScopes.mixed;
      const result = getCaip25AccountFromAccountGroupAndScope(
        mockAccountGroups,
        scopes,
      );

      expect(result).toStrictEqual([
        `${KnownCaipNamespace.Eip155}:0:0x1234567890123456789012345678901234567890`,
        'solana:mainnet:0x3456789012345678901234567890123456789012',
        `${KnownCaipNamespace.Eip155}:0:0x4567890123456789012345678901234567890123`,
        'solana:mainnet:0x4567890123456789012345678901234567890123',
      ]);
    });

    it('should handle accounts with multiple scopes including EIP-155 wildcard', () => {
      const accountGroupsWithMultipleScopes =
        mockFactory.createMockAccountGroupsWithMultipleScopes();

      const scopes = mockFactory.createMockScopes.multipleSolana;
      const result = getCaip25AccountFromAccountGroupAndScope(
        accountGroupsWithMultipleScopes,
        scopes,
      );

      expect(result).toStrictEqual([
        `${KnownCaipNamespace.Eip155}:0:0x1234567890123456789012345678901234567890`,
        'solana:mainnet:0x1234567890123456789012345678901234567890',
        'solana:devnet:0x1234567890123456789012345678901234567890',
      ]);
    });

    describe('EIP-155 direct scope matching (bug fix tests)', () => {
      it('should include accounts with direct EIP-155 chain ID scope when requesting that specific chain', () => {
        const scopes = mockFactory.createMockScopes.eip155Specific; // eip155:1
        const result = getCaip25AccountFromAccountGroupAndScope(
          mockAccountGroups,
          scopes,
        );

        // Should include:
        // - eip155Wildcard (has eip155:0 wildcard)
        // - eip155Specific (has eip155:1 direct match) - THIS WAS THE BUG
        // - eip155MultipleSpecific (has eip155:1 direct match) - THIS WAS THE BUG
        // - multiScope (has eip155:0 wildcard)
        expect(result).toStrictEqual([
          `${KnownCaipNamespace.Eip155}:1:0x1234567890123456789012345678901234567890`, // eip155Wildcard
          `${KnownCaipNamespace.Eip155}:1:0x2345678901234567890123456789012345678901`, // eip155Specific
          `${KnownCaipNamespace.Eip155}:1:0x2345678901234567890123456789012345678903`, // eip155MultipleSpecific
          `${KnownCaipNamespace.Eip155}:1:0x4567890123456789012345678901234567890123`, // multiScope
        ]);
      });

      it('should include accounts with direct EIP-155 chain ID scope for Polygon (eip155:137)', () => {
        const scopes = mockFactory.createMockScopes.eip155Specific137; // eip155:137
        const result = getCaip25AccountFromAccountGroupAndScope(
          mockAccountGroups,
          scopes,
        );

        // Should include:
        // - eip155Wildcard (has eip155:0 wildcard)
        // - eip155Specific137 (has eip155:137 direct match) - THIS WAS THE BUG
        // - eip155MultipleSpecific (has eip155:137 direct match) - THIS WAS THE BUG
        // - multiScope (has eip155:0 wildcard)
        expect(result).toStrictEqual([
          `${KnownCaipNamespace.Eip155}:137:0x1234567890123456789012345678901234567890`, // eip155Wildcard
          `${KnownCaipNamespace.Eip155}:137:0x2345678901234567890123456789012345678902`, // eip155Specific137
          `${KnownCaipNamespace.Eip155}:137:0x2345678901234567890123456789012345678903`, // eip155MultipleSpecific
          `${KnownCaipNamespace.Eip155}:137:0x4567890123456789012345678901234567890123`, // multiScope
        ]);
      });

      it('should prioritize direct scope matches over wildcard matches', () => {
        // Create a test group with accounts that have both direct and wildcard scopes
        const testAccountGroups: AccountGroupWithInternalAccounts[] = [
          {
            id: 'entropy:test-group/0',
            type: AccountGroupType.MultichainAccount,
            metadata: mockFactory.createMockAccountGroup().metadata,
            accounts: [
              mockFactory.createMockAccount({
                id: 'account-direct',
                address: '0x1111111111111111111111111111111111111111',
                scopes: [`${KnownCaipNamespace.Eip155}:1`],
              }),
              mockFactory.createMockAccount({
                id: 'account-wildcard',
                address: '0x2222222222222222222222222222222222222222',
                scopes: [`${KnownCaipNamespace.Eip155}:0`],
              }),
              mockFactory.createMockAccount({
                id: 'account-both',
                address: '0x3333333333333333333333333333333333333333',
                scopes: [
                  `${KnownCaipNamespace.Eip155}:1`,
                  `${KnownCaipNamespace.Eip155}:0`,
                ],
              }),
            ],
          },
        ];

        const scopes = mockFactory.createMockScopes.eip155Specific; // eip155:1
        const result = getCaip25AccountFromAccountGroupAndScope(
          testAccountGroups,
          scopes,
        );

        // All accounts should be included since they all support eip155:1
        expect(result).toStrictEqual([
          `${KnownCaipNamespace.Eip155}:1:0x1111111111111111111111111111111111111111`, // account-direct
          `${KnownCaipNamespace.Eip155}:1:0x2222222222222222222222222222222222222222`, // account-wildcard
          `${KnownCaipNamespace.Eip155}:1:0x3333333333333333333333333333333333333333`, // account-both
        ]);
      });

      it('should handle mixed EIP-155 and non-EIP-155 scopes correctly', () => {
        const mixedScopes = [
          `${KnownCaipNamespace.Eip155}:1`,
          'solana:mainnet',
        ] as CaipChainId[];

        const result = getCaip25AccountFromAccountGroupAndScope(
          mockAccountGroups,
          mixedScopes,
        );

        // For eip155:1, should include all accounts that support it
        // For solana:mainnet, should include accounts with that scope
        // Note: The order may vary, so we'll check that all expected results are present
        const expectedEip155Results = [
          `${KnownCaipNamespace.Eip155}:1:0x1234567890123456789012345678901234567890`, // eip155Wildcard
          `${KnownCaipNamespace.Eip155}:1:0x2345678901234567890123456789012345678901`, // eip155Specific
          `${KnownCaipNamespace.Eip155}:1:0x2345678901234567890123456789012345678903`, // eip155MultipleSpecific
          `${KnownCaipNamespace.Eip155}:1:0x4567890123456789012345678901234567890123`, // multiScope
        ];
        const expectedSolanaResults = [
          'solana:mainnet:0x3456789012345678901234567890123456789012', // solana
          'solana:mainnet:0x4567890123456789012345678901234567890123', // multiScope
        ];

        // Check that all expected results are present
        expectedEip155Results.forEach((expected) => {
          expect(result).toContain(expected);
        });
        expectedSolanaResults.forEach((expected) => {
          expect(result).toContain(expected);
        });

        // Check total count
        expect(result).toHaveLength(
          expectedEip155Results.length + expectedSolanaResults.length,
        );
      });
    });
  });
});
