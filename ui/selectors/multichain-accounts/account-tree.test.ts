import {
  AccountGroupId,
  AccountWalletType,
  AccountGroupType,
} from '@metamask/account-api';
import { AccountGroupObject } from '@metamask/account-tree-controller';

import { EthAccountType, SolAccountType } from '@metamask/keyring-api';
import { KeyringTypes } from '@metamask/keyring-controller';

import mockState from '../../../test/data/mock-state.json';
import { createMockInternalAccount } from '../../../test/jest/mocks';

import { MultichainNetworkConfigurationsByChainIdState } from '../../../shared/modules/selectors/networks';
import {
  getAccountTree,
  getAllAccountGroups,
  getAccountGroupWithInternalAccounts,
  getCaip25AccountIdToMultichainAccountGroupMap,
  getCaip25IdByAccountGroupAndScope,
  getInternalAccountByGroupAndCaip,
  getInternalAccountBySelectedAccountGroupAndCaip,
  getMultichainAccountGroupById,
  getMultichainAccountGroups,
  getMultichainAccountsToScopesMap,
  getScopeToAccountGroupMap,
  getSingleAccountGroups,
  getSelectedAccountGroup,
  getWalletIdAndNameByAccountAddress,
  getWalletsWithAccounts,
} from './account-tree';
import {
  MultichainAccountsState,
  AccountTreeState,
  InternalAccountsState,
} from './account-tree.types';
import {
  createMockMultichainAccountsState,
  createEmptyState,
} from './test-utils';

describe('Multichain Accounts Selectors', () => {
  // Get properly typed mockState (we know it conforms to the interface structure)
  const typedMockState = mockState as unknown as MultichainAccountsState &
    MultichainNetworkConfigurationsByChainIdState;

  // Test data constants
  const ENTROPY_WALLET_1_ID = 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ';

  const ENTROPY_GROUP_1_ID = 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/0';
  const ENTROPY_GROUP_2_ID = 'entropy:01JKAF3PJ247KAM6C03G5Q0NP8/0';
  const LEDGER_GROUP_ID =
    'keyring:Ledger Hardware/0xc42edfcc21ed14dda456aa0756c153f7985d8813';

  const ACCOUNT_1_ID = 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3';
  const ACCOUNT_2_ID = '07c2cfec-36c9-46c4-8115-3836d3ac9047';

  const ACCOUNT_1_ADDRESS = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc';
  const ACCOUNT_2_ADDRESS = '0xec1adf982415d2ef5ec55899b9bfb8bc0f29251b';
  const ACCOUNT_3_ADDRESS = '0xeb9e64b93097bc15f01f13eae97015c57ab64823';

  const EIP155_MAINNET_SCOPE = 'eip155:0';
  const SOLANA_MAINNET_SCOPE = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp';

  // Helper to create state with missing internal account
  const createStateWithMissingInternalAccount = () => ({
    ...typedMockState,
    metamask: {
      ...typedMockState.metamask,
      accountTree: {
        wallets: {
          'entropy:test': {
            id: 'entropy:test' as const,
            type: AccountWalletType.Entropy as const,
            groups: {
              'entropy:test/0': {
                id: 'entropy:test/0' as const,
                type: AccountGroupType.MultichainAccount as const,
                accounts: ['missing-account-id'] as [string, ...string[]],
                metadata: {
                  name: 'Test',
                  entropy: { groupIndex: 0 },
                  pinned: false,
                  hidden: false,
                },
              },
            },
            metadata: {
              name: 'Test Wallet',
              entropy: { id: 'test' },
            },
          },
        },
        selectedAccountGroup: 'entropy:test/0' as AccountGroupId,
      },
      internalAccounts: {
        accounts: {},
        selectedAccount: '',
      },
      // Add the required network configurations from the mock state
      networkConfigurationsByChainId:
        typedMockState.metamask.networkConfigurationsByChainId,
      multichainNetworkConfigurationsByChainId:
        typedMockState.metamask.multichainNetworkConfigurationsByChainId,
    },
  });

  // Helper to create state without multichain wallets
  const createStateWithoutMultichain = () => ({
    ...typedMockState,
    metamask: {
      ...typedMockState.metamask,
      accountTree: {
        wallets: {
          'keyring:Test': {
            id: 'keyring:Test' as const,
            type: AccountWalletType.Keyring as const,
            groups: {
              'keyring:Test/address': {
                id: 'keyring:Test/address' as const,
                type: AccountGroupType.SingleAccount as const,
                accounts: ['account1'] as [string],
                metadata: {
                  name: 'Test',
                  pinned: false,
                  hidden: false,
                },
              },
            },
            metadata: {
              name: 'Test Keyring',
              keyring: { type: KeyringTypes.hd },
            },
          },
        },
        selectedAccountGroup: 'keyring:Test/address' as AccountGroupId,
      },
      internalAccounts: {
        accounts: {},
        selectedAccount: '',
      },
      // Add the required network configurations from the mock state
      networkConfigurationsByChainId:
        typedMockState.metamask.networkConfigurationsByChainId,
      multichainNetworkConfigurationsByChainId:
        typedMockState.metamask.multichainNetworkConfigurationsByChainId,
    },
  });

  // Helper to create state with mixed existing and missing accounts
  const createStateWithMixedAccounts = (): MultichainAccountsState &
    MultichainNetworkConfigurationsByChainIdState => ({
    ...typedMockState,
    metamask: {
      ...typedMockState.metamask,
      accountTree: {
        ...typedMockState.metamask.accountTree,
        wallets: {
          'entropy:test': {
            id: 'entropy:test' as const,
            type: AccountWalletType.Entropy as const,
            groups: {
              'entropy:test/0': {
                id: 'entropy:test/0' as const,
                type: AccountGroupType.MultichainAccount as const,
                accounts: ['existing-account', 'missing-account'] as [
                  string,
                  ...string[],
                ],
                metadata: {
                  name: 'Test',
                  entropy: { groupIndex: 0 },
                  pinned: false,
                  hidden: false,
                },
              },
            },
            metadata: {
              name: 'Test Wallet',
              entropy: { id: 'test' },
            },
          },
        },
        selectedAccountGroup: 'entropy:test/0' as AccountGroupId,
      },
      internalAccounts: {
        ...typedMockState.metamask.internalAccounts,
        accounts: {
          ...typedMockState.metamask.internalAccounts.accounts,
          'existing-account': createMockInternalAccount({
            id: 'existing-account',
            name: 'Test Account',
            address: '0x123',
          }),
        },
      },
      // Add the required network configurations from the mock state
      networkConfigurationsByChainId:
        typedMockState.metamask.networkConfigurationsByChainId,
      multichainNetworkConfigurationsByChainId:
        typedMockState.metamask.multichainNetworkConfigurationsByChainId,
    },
  });

  // Helper to create state with no matching accounts
  const createStateWithNoMatchingAccounts = (): MultichainAccountsState &
    MultichainNetworkConfigurationsByChainIdState =>
    createMockMultichainAccountsState(
      {
        wallets: {
          'entropy:test': {
            id: 'entropy:test' as const,
            type: AccountWalletType.Entropy as const,
            groups: {
              'entropy:test/0': {
                id: 'entropy:test/0' as const,
                type: AccountGroupType.MultichainAccount as const,
                accounts: ['missing-account-1', 'missing-account-2'] as [
                  string,
                  ...string[],
                ],
                metadata: {
                  name: 'Test',
                  entropy: { groupIndex: 0 },
                  pinned: false,
                  hidden: false,
                },
              },
            },
            metadata: {
              name: 'Test Wallet',
              entropy: { id: 'test' },
            },
          },
        },
        selectedAccountGroup: 'entropy:test/0' as AccountGroupId,
      },
      {
        accounts: {},
        selectedAccount: '',
      },
      {
        networkConfigurationsByChainId:
          typedMockState.metamask.networkConfigurationsByChainId,
        multichainNetworkConfigurationsByChainId:
          typedMockState.metamask.multichainNetworkConfigurationsByChainId,
      },
    );

  // Helper to create state with network configurations for getScopeToAccountGroupMap tests
  const createStateWithNetworkConfigurations = (
    accountTree: AccountTreeState,
    internalAccounts: InternalAccountsState,
  ) => ({
    ...typedMockState,
    metamask: {
      ...typedMockState.metamask,
      accountTree,
      internalAccounts,
      // Add the required network configurations from the mock state
      networkConfigurationsByChainId:
        typedMockState.metamask.networkConfigurationsByChainId,
      multichainNetworkConfigurationsByChainId:
        typedMockState.metamask.multichainNetworkConfigurationsByChainId,
    },
  });

  describe('getAccountTree', () => {
    it('returns the account tree', () => {
      const result = getAccountTree(typedMockState);

      expect(result).toStrictEqual(mockState.metamask.accountTree);
    });
  });

  describe('getWalletsWithAccounts', () => {
    it('returns wallets with accounts and their metadata', () => {
      const result = getWalletsWithAccounts(typedMockState);

      expect(result).toStrictEqual({
        'entropy:01JKAF3DSGM3AB87EM9N0K41AJ': {
          id: 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ',
          type: 'entropy',
          groups: {
            'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/0': {
              id: 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/0',
              type: 'multichain-account',
              accounts: [
                {
                  active: false,
                  address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
                  balance: '0x346ba7725f412cbfdb',
                  id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
                  pinned: false,
                  hidden: false,
                  metadata: {
                    importTime: 0,
                    keyring: {
                      type: 'HD Key Tree',
                    },
                    name: 'Test Account',
                  },
                  methods: [
                    'personal_sign',
                    'eth_signTransaction',
                    'eth_signTypedData_v1',
                    'eth_signTypedData_v3',
                    'eth_signTypedData_v4',
                  ],
                  options: {
                    entropySource: '01JKAF3DSGM3AB87EM9N0K41AJ',
                  },
                  scopes: ['eip155:0'],
                  type: 'eip155:eoa',
                },
                {
                  active: false,
                  address: '0xec1adf982415d2ef5ec55899b9bfb8bc0f29251b',
                  balance: '0x0',
                  id: '07c2cfec-36c9-46c4-8115-3836d3ac9047',
                  pinned: false,
                  hidden: false,
                  metadata: {
                    importTime: 0,
                    keyring: {
                      type: 'HD Key Tree',
                    },
                    name: 'Test Account 2',
                  },
                  methods: [
                    'personal_sign',
                    'eth_signTransaction',
                    'eth_signTypedData_v1',
                    'eth_signTypedData_v3',
                    'eth_signTypedData_v4',
                  ],
                  options: {
                    entropySource: '01JKAF3DSGM3AB87EM9N0K41AJ',
                  },
                  scopes: ['eip155:0'],
                  type: 'eip155:eoa',
                },
              ],
              metadata: {
                name: 'Account 1',
                entropy: {
                  groupIndex: 0,
                },
                pinned: false,
                hidden: false,
              },
            },
          },
          metadata: {
            name: 'Wallet 1',
            entropy: {
              id: '01JKAF3DSGM3AB87EM9N0K41AJ',
            },
          },
        },
        'entropy:01JKAF3PJ247KAM6C03G5Q0NP8': {
          id: 'entropy:01JKAF3PJ247KAM6C03G5Q0NP8',
          type: 'entropy',
          groups: {
            'entropy:01JKAF3PJ247KAM6C03G5Q0NP8/0': {
              id: 'entropy:01JKAF3PJ247KAM6C03G5Q0NP8/0',
              type: 'multichain-account',
              accounts: [
                {
                  active: false,
                  address: '0xeb9e64b93097bc15f01f13eae97015c57ab64823',
                  balance: '0x0',
                  id: '784225f4-d30b-4e77-a900-c8bbce735b88',
                  pinned: false,
                  hidden: false,
                  metadata: {
                    importTime: 0,
                    keyring: {
                      type: 'HD Key Tree',
                    },
                    name: 'Test Account 3',
                  },
                  methods: [
                    'personal_sign',
                    'eth_signTransaction',
                    'eth_signTypedData_v1',
                    'eth_signTypedData_v3',
                    'eth_signTypedData_v4',
                  ],
                  options: {
                    entropySource: '01JKAF3PJ247KAM6C03G5Q0NP8',
                  },
                  scopes: ['eip155:0'],
                  type: 'eip155:eoa',
                },
              ],
              metadata: {
                name: 'Account 2',
                entropy: {
                  groupIndex: 0,
                },
                pinned: false,
                hidden: false,
              },
            },
          },
          metadata: {
            name: 'Wallet 2',
            entropy: {
              id: '01JKAF3PJ247KAM6C03G5Q0NP8',
            },
          },
        },
        'snap:local:custody:test': {
          id: 'snap:local:custody:test',
          type: 'snap',
          groups: {
            'snap:local:custody:test/0xca8f1F0245530118D0cf14a06b01Daf8f76Cf281':
              {
                id: 'snap:local:custody:test/0xca8f1F0245530118D0cf14a06b01Daf8f76Cf281',
                type: 'single-account',
                accounts: [
                  {
                    active: false,
                    address: '0xca8f1F0245530118D0cf14a06b01Daf8f76Cf281',
                    balance: '0x0',
                    id: '694225f4-d30b-4e77-a900-c8bbce735b42',
                    pinned: false,
                    hidden: false,
                    metadata: {
                      importTime: 0,
                      keyring: {
                        type: 'Custody test',
                      },
                      name: 'Test Account 4',
                    },
                    methods: [
                      'personal_sign',
                      'eth_signTransaction',
                      'eth_signTypedData_v1',
                      'eth_signTypedData_v3',
                      'eth_signTypedData_v4',
                    ],
                    options: {},
                    scopes: ['eip155:0'],
                    type: 'eip155:eoa',
                  },
                ],
                metadata: {
                  name: 'Another Snap Account 1',
                  pinned: false,
                  hidden: false,
                },
              },
          },
          metadata: {
            name: 'Custody test',
            snap: {
              id: 'local:custody:test',
            },
          },
        },
        'keyring:Ledger Hardware': {
          id: 'keyring:Ledger Hardware',
          type: 'keyring',
          groups: {
            'keyring:Ledger Hardware/0xc42edfcc21ed14dda456aa0756c153f7985d8813':
              {
                id: 'keyring:Ledger Hardware/0xc42edfcc21ed14dda456aa0756c153f7985d8813',
                type: 'single-account',
                accounts: [
                  {
                    active: false,
                    address: '0xc42edfcc21ed14dda456aa0756c153f7985d8813',
                    balance: '0x0',
                    id: '15e69915-2a1a-4019-93b3-916e11fd432f',
                    pinned: false,
                    hidden: false,
                    metadata: {
                      importTime: 0,
                      keyring: {
                        type: 'Ledger Hardware',
                      },
                      name: 'Ledger Hardware 2',
                    },
                    methods: [
                      'personal_sign',
                      'eth_signTransaction',
                      'eth_signTypedData_v1',
                      'eth_signTypedData_v3',
                      'eth_signTypedData_v4',
                    ],
                    options: {},
                    scopes: ['eip155:0'],
                    type: 'eip155:eoa',
                  },
                ],
                metadata: {
                  name: 'Ledger Account 1',
                  pinned: false,
                  hidden: false,
                },
              },
          },
          metadata: {
            name: 'Ledger Hardware',
            keyring: {
              type: 'Ledger Hardware',
            },
          },
        },
        'snap:local:snap-id': {
          id: 'snap:local:snap-id',
          type: 'snap',
          groups: {
            'snap:local:snap-id/0xb552685e3d2790efd64a175b00d51f02cdafee5d': {
              id: 'snap:local:snap-id/0xb552685e3d2790efd64a175b00d51f02cdafee5d',
              type: 'single-account',
              accounts: [
                {
                  active: false,
                  address: '0xb552685e3d2790efd64a175b00d51f02cdafee5d',
                  balance: '0x0',
                  id: 'c3deeb99-ba0d-4a4e-a0aa-033fc1f79ae3',
                  pinned: false,
                  hidden: false,
                  metadata: {
                    importTime: 0,
                    keyring: {
                      type: 'Snap Keyring',
                    },
                    name: 'Snap Account 1',
                    snap: {
                      enabled: true,
                      id: 'local:snap-id',
                      name: 'snap-name',
                    },
                  },
                  methods: [
                    'personal_sign',
                    'eth_signTransaction',
                    'eth_signTypedData_v1',
                    'eth_signTypedData_v3',
                    'eth_signTypedData_v4',
                  ],
                  options: {},
                  scopes: ['eip155:0'],
                  type: 'eip155:eoa',
                },
              ],
              metadata: {
                name: 'Snap Account 1',
                pinned: false,
                hidden: false,
              },
            },
          },
          metadata: {
            name: 'Snap: snap-name',
            snap: {
              id: 'local:snap-id',
            },
          },
        },
      });
    });
  });

  describe('getWalletIdAndNameByAccountAddress', () => {
    it('returns the wallet ID and name for an account', () => {
      const result = getWalletIdAndNameByAccountAddress(
        typedMockState,
        ACCOUNT_1_ADDRESS,
      );

      expect(result).toStrictEqual({
        id: ENTROPY_WALLET_1_ID,
        name: 'Wallet 1',
      });
    });

    it('returns null if the account is not found', () => {
      const nonExistentAddress = '0x1234567890abcdef1234567890abcdef12345678';
      const result = getWalletIdAndNameByAccountAddress(
        typedMockState,
        nonExistentAddress,
      );

      expect(result).toBeNull();
    });
  });

  describe('getInternalAccountByGroupAndCaip', () => {
    it('returns the internal account for a group and CAIP chain ID', () => {
      const result = getInternalAccountByGroupAndCaip(
        typedMockState,
        ENTROPY_GROUP_1_ID as AccountGroupId,
        EIP155_MAINNET_SCOPE,
      );

      expect(result).toStrictEqual(
        typedMockState.metamask.internalAccounts.accounts[ACCOUNT_1_ID],
      );
    });

    it('returns null if the group is not found', () => {
      const result = getInternalAccountByGroupAndCaip(
        typedMockState,
        ENTROPY_GROUP_1_ID as AccountGroupId,
        SOLANA_MAINNET_SCOPE,
      );

      expect(result).toBeNull();
    });
  });

  describe('getInternalAccountBySelectedAccountGroupAndCaip', () => {
    it('returns the internal account for a selected account group and CAIP chain ID', () => {
      const result = getInternalAccountBySelectedAccountGroupAndCaip(
        typedMockState,
        EIP155_MAINNET_SCOPE,
      );

      expect(result).toStrictEqual(
        typedMockState.metamask.internalAccounts.accounts[ACCOUNT_1_ID],
      );
    });

    it('returns null if the internal account is not found in the selected account group', () => {
      const result = getInternalAccountBySelectedAccountGroupAndCaip(
        typedMockState,
        SOLANA_MAINNET_SCOPE,
      );

      expect(result).toBeNull();
    });
  });

  describe('getSelectedAccountGroup', () => {
    it('returns the selected account group', () => {
      const result = getSelectedAccountGroup(typedMockState);

      expect(result).toStrictEqual(
        typedMockState.metamask.accountTree.selectedAccountGroup,
      );
    });
  });

  describe('getMultichainAccountGroupById', () => {
    it('returns the account group for a valid group ID', () => {
      const result = getMultichainAccountGroupById(
        typedMockState,
        ENTROPY_GROUP_1_ID as AccountGroupId,
      );

      expect(result).toStrictEqual({
        id: ENTROPY_GROUP_1_ID,
        type: 'multichain-account',
        accounts: [ACCOUNT_1_ID, ACCOUNT_2_ID],
        metadata: {
          name: 'Account 1',
          entropy: {
            groupIndex: 0,
          },
          pinned: false,
          hidden: false,
        },
      });
    });

    it('returns undefined for non-existent group ID', () => {
      const nonExistentGroupId = 'entropy:nonexistent/0' as AccountGroupId;
      const result = getMultichainAccountGroupById(
        typedMockState,
        nonExistentGroupId,
      );

      expect(result).toBeUndefined();
    });

    it('returns undefined for invalid wallet ID in group ID', () => {
      const invalidGroupId = 'invalid-wallet/0' as AccountGroupId;
      const result = getMultichainAccountGroupById(
        typedMockState,
        invalidGroupId,
      );

      expect(result).toBeUndefined();
    });
  });

  describe('getAllAccountGroups', () => {
    it('returns all account groups from all wallets', () => {
      const result = getAllAccountGroups(typedMockState);

      expect(result).toHaveLength(5);
      expect(result.map((group) => group.id)).toEqual([
        ENTROPY_GROUP_1_ID,
        ENTROPY_GROUP_2_ID,
        LEDGER_GROUP_ID,
        'snap:local:custody:test/0xca8f1F0245530118D0cf14a06b01Daf8f76Cf281',
        'snap:local:snap-id/0xb552685e3d2790efd64a175b00d51f02cdafee5d',
      ]);
    });

    it('returns groups with correct types', () => {
      const result = getAllAccountGroups(typedMockState);

      const groupTypes = result.map((group) => group.type);
      expect(groupTypes).toContain('multichain-account');
      expect(groupTypes).toContain('single-account');
    });

    it('returns empty array when no wallets exist', () => {
      const emptyState = createEmptyState();
      const result = getAllAccountGroups(emptyState);

      expect(result).toEqual([]);
    });
  });

  describe('getMultichainAccountGroups', () => {
    it('returns only entropy account groups', () => {
      const result = getMultichainAccountGroups(typedMockState);

      expect(result).toHaveLength(2);
      expect(
        result.every((group) => group.id.startsWith(AccountWalletType.Entropy)),
      ).toBe(true);
      expect(result.map((group) => group.id)).toEqual([
        ENTROPY_GROUP_1_ID,
        ENTROPY_GROUP_2_ID,
      ]);
    });

    it('returns empty array when no entropy groups exist', () => {
      const stateWithoutEntropy = createMockMultichainAccountsState(
        {
          wallets: {
            'keyring:Test': {
              id: 'keyring:Test' as const,
              type: AccountWalletType.Keyring as const,
              groups: {
                'keyring:Test/address': {
                  id: 'keyring:Test/address' as const,
                  type: AccountGroupType.SingleAccount as const,
                  accounts: ['account1'] as [string],
                  metadata: {
                    name: 'Test',
                    pinned: false,
                    hidden: false,
                  },
                },
              },
              metadata: {
                name: 'Test Keyring',
                keyring: { type: KeyringTypes.hd },
              },
            },
          },
          selectedAccountGroup: null as unknown as AccountGroupId,
        },
        {
          accounts: {},
          selectedAccount: '',
        },
        {
          networkConfigurationsByChainId:
            typedMockState.metamask.networkConfigurationsByChainId,
          multichainNetworkConfigurationsByChainId:
            typedMockState.metamask.multichainNetworkConfigurationsByChainId,
        },
      );
      const result = getMultichainAccountGroups(stateWithoutEntropy);

      expect(result).toEqual([]);
    });
  });

  describe('getSingleAccountGroups', () => {
    it('returns only non-entropy account groups', () => {
      const result = getSingleAccountGroups(typedMockState);

      expect(result).toHaveLength(3);
      expect(
        result.every(
          (group) => !group.id.startsWith(AccountWalletType.Entropy),
        ),
      ).toBe(true);
      expect(result.map((group) => group.id)).toEqual([
        LEDGER_GROUP_ID,
        'snap:local:custody:test/0xca8f1F0245530118D0cf14a06b01Daf8f76Cf281',
        'snap:local:snap-id/0xb552685e3d2790efd64a175b00d51f02cdafee5d',
      ]);
    });

    it('returns all groups when no entropy groups exist', () => {
      const stateWithoutEntropy = createMockMultichainAccountsState(
        {
          wallets: {
            'keyring:Test': {
              id: 'keyring:Test' as const,
              type: AccountWalletType.Keyring,
              groups: {
                'keyring:Test/address': {
                  id: 'keyring:Test/address' as const,
                  type: AccountGroupType.SingleAccount,
                  accounts: ['account1'] as [string],
                  metadata: {
                    name: 'Test',
                    pinned: false,
                    hidden: false,
                  },
                },
              },
              metadata: {
                name: 'Test Keyring',
                keyring: { type: KeyringTypes.hd },
              },
            },
          },
          selectedAccountGroup: null as unknown as AccountGroupId,
        },
        {
          accounts: {},
          selectedAccount: '',
        },
        {
          networkConfigurationsByChainId:
            typedMockState.metamask.networkConfigurationsByChainId,
          multichainNetworkConfigurationsByChainId:
            typedMockState.metamask.multichainNetworkConfigurationsByChainId,
        },
      );
      const result = getSingleAccountGroups(stateWithoutEntropy);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('keyring:Test/address');
    });
  });

  describe('getCaip25AccountIdToMultichainAccountGroupMap', () => {
    it('maps CAIP-25 account IDs to multichain account group IDs', () => {
      const result =
        getCaip25AccountIdToMultichainAccountGroupMap(typedMockState);

      expect(result.size).toBeGreaterThan(0);
      expect(result.get(`${EIP155_MAINNET_SCOPE}:${ACCOUNT_1_ADDRESS}`)).toBe(
        ENTROPY_GROUP_1_ID,
      );
      expect(result.get(`${EIP155_MAINNET_SCOPE}:${ACCOUNT_2_ADDRESS}`)).toBe(
        ENTROPY_GROUP_1_ID,
      );
      expect(result.get(`${EIP155_MAINNET_SCOPE}:${ACCOUNT_3_ADDRESS}`)).toBe(
        ENTROPY_GROUP_2_ID,
      );
    });

    it('returns empty map when no accounts exist', () => {
      const emptyState = {
        ...typedMockState,
        metamask: {
          ...typedMockState.metamask,
          accountTree: {
            wallets: {},
            selectedAccountGroup: null as unknown as AccountGroupId,
          },
          internalAccounts: {
            accounts: {},
            selectedAccount: '',
          },
          networkConfigurationsByChainId:
            typedMockState.metamask.networkConfigurationsByChainId,
          multichainNetworkConfigurationsByChainId:
            typedMockState.metamask.multichainNetworkConfigurationsByChainId,
        },
      };
      const result = getCaip25AccountIdToMultichainAccountGroupMap(emptyState);

      expect(result.size).toBe(0);
    });

    it('skips accounts without matching internal accounts', () => {
      const stateWithMissingInternalAccount =
        createStateWithMissingInternalAccount();
      const result = getCaip25AccountIdToMultichainAccountGroupMap(
        stateWithMissingInternalAccount,
      );

      expect(result.size).toBe(0);
    });
  });

  describe('getAccountGroupWithInternalAccounts', () => {
    it('returns account groups with resolved internal accounts', () => {
      const result = getAccountGroupWithInternalAccounts(typedMockState);

      expect(result).toHaveLength(5);

      const entropyGroup = result.find(
        (group) => group.id === ENTROPY_GROUP_1_ID,
      );
      expect(entropyGroup?.accounts).toHaveLength(2);
      expect(entropyGroup?.accounts[0]).toHaveProperty(
        'address',
        ACCOUNT_1_ADDRESS,
      );
      expect(entropyGroup?.accounts[1]).toHaveProperty(
        'address',
        ACCOUNT_2_ADDRESS,
      );
    });

    it('filters out undefined accounts', () => {
      const stateWithMissingAccount = createStateWithMixedAccounts();

      const result = getAccountGroupWithInternalAccounts(
        stateWithMissingAccount,
      );
      const testGroup = result.find((group) => group.id === 'entropy:test/0');

      expect(testGroup?.accounts).toHaveLength(1);
      expect(testGroup?.accounts[0].id).toBe('existing-account');
    });

    it('returns empty accounts array when no internal accounts match', () => {
      const stateWithNoMatchingAccounts = createStateWithNoMatchingAccounts();

      const result = getAccountGroupWithInternalAccounts(
        stateWithNoMatchingAccounts,
      );
      expect(result[0].accounts).toEqual([]);
    });
  });

  describe('getMultichainAccountsToScopesMap', () => {
    it('maps multichain account IDs to their CAIP scopes', () => {
      const result = getMultichainAccountsToScopesMap(typedMockState);

      expect(result.size).toBe(2);

      const firstGroupScopes = result.get(ENTROPY_GROUP_1_ID);
      expect(firstGroupScopes?.get(EIP155_MAINNET_SCOPE)).toBe(
        `${EIP155_MAINNET_SCOPE}:${ACCOUNT_2_ADDRESS}`,
      );

      const secondGroupScopes = result.get(ENTROPY_GROUP_2_ID);
      expect(secondGroupScopes?.get(EIP155_MAINNET_SCOPE)).toBe(
        `${EIP155_MAINNET_SCOPE}:${ACCOUNT_3_ADDRESS}`,
      );
    });

    it('handles accounts without matching internal accounts', () => {
      const result = getMultichainAccountsToScopesMap(
        createStateWithMissingInternalAccount(),
      );
      const groupScopes = result.get('entropy:test/0');

      expect(groupScopes?.size).toBe(0);
    });

    it('returns empty map when no multichain accounts exist', () => {
      const result = getMultichainAccountsToScopesMap(
        createStateWithoutMultichain(),
      );
      expect(result.size).toBe(0);
    });
  });

  describe('getCaip25IdByAccountGroupAndScope', () => {
    it('returns CAIP-25 ID for valid account group and scope', () => {
      const accountGroup = {
        id: ENTROPY_GROUP_1_ID,
        type: 'multichain-account',
        accounts: [ACCOUNT_1_ID],
        metadata: { name: 'Default' },
      };

      const result = getCaip25IdByAccountGroupAndScope(
        typedMockState,
        accountGroup as unknown as AccountGroupObject,
        EIP155_MAINNET_SCOPE,
      );
      expect(result).toBe(`${EIP155_MAINNET_SCOPE}:${ACCOUNT_2_ADDRESS}`);
    });

    it('returns undefined for non-existent account group', () => {
      const nonExistentGroup = {
        id: 'entropy:nonexistent/0',
        type: 'multichain-account',
        accounts: [],
        metadata: { name: 'Non-existent' },
      };

      const result = getCaip25IdByAccountGroupAndScope(
        typedMockState,
        nonExistentGroup as unknown as AccountGroupObject,
        EIP155_MAINNET_SCOPE,
      );
      expect(result).toBeUndefined();
    });

    it('returns undefined for non-existent scope', () => {
      const accountGroup = {
        id: ENTROPY_GROUP_1_ID,
        type: 'multichain-account',
        accounts: [ACCOUNT_1_ID],
        metadata: { name: 'Default' },
      };

      const result = getCaip25IdByAccountGroupAndScope(
        typedMockState,
        accountGroup as unknown as AccountGroupObject,
        SOLANA_MAINNET_SCOPE,
      );
      expect(result).toBeUndefined();
    });
  });

  describe('getScopeToAccountGroupMap', () => {
    it('maps scopes to account groups for EOA accounts', () => {
      const result = getScopeToAccountGroupMap(typedMockState);

      expect(result.get(EIP155_MAINNET_SCOPE)).toBeDefined();
      expect(result.get(EIP155_MAINNET_SCOPE)?.length).toBeGreaterThan(0);

      expect(result.get('eip155:0')).toBeDefined();
      expect(result.get('eip155:0')?.length).toBeGreaterThan(0);

      expect(result.get('eip155:1')).toBeDefined(); // Mainnet
      expect(result.get('eip155:5')).toBeDefined(); // Goerli
      expect(result.get('eip155:11155111')).toBeDefined(); // Sepolia
    });

    it('maps non-EVM scopes to account groups', () => {
      const stateWithNonEvmAccounts = createStateWithNetworkConfigurations(
        {
          wallets: {
            'entropy:test': {
              id: 'entropy:test',
              type: AccountWalletType.Entropy,
              groups: {
                'entropy:test/0': {
                  id: 'entropy:test/0',
                  type: AccountGroupType.MultichainAccount,
                  accounts: ['solana-account'],
                  metadata: {
                    name: 'Solana Account',
                    entropy: { groupIndex: 0 },
                    pinned: false,
                    hidden: false,
                  },
                },
              },
              metadata: {
                name: 'Test Wallet',
                entropy: { id: 'test' },
              },
            },
          },
          selectedAccountGroup: 'entropy:test/0' as AccountGroupId,
        },
        {
          accounts: {
            'solana-account': createMockInternalAccount({
              id: 'solana-account',
              name: 'Solana Account',
              address: 'SolanaAddress123',
              type: SolAccountType.DataAccount,
            }),
          },
          selectedAccount: 'solana-account',
        },
      );

      const result = getScopeToAccountGroupMap(stateWithNonEvmAccounts);

      expect(result.get(SOLANA_MAINNET_SCOPE)).toBeDefined();
      expect(result.get(SOLANA_MAINNET_SCOPE)?.[0]?.id).toBe('entropy:test/0');
    });

    it('correctly maps EIP155 wildcard scope for EOA accounts', () => {
      const result = getScopeToAccountGroupMap(typedMockState);

      const wildcardMapping = result.get('eip155:0');
      expect(wildcardMapping).toBeDefined();

      expect(wildcardMapping?.[0]?.id).toMatch(/^entropy:/u);
    });

    it('handles multiple accounts in the same group', () => {
      const result = getScopeToAccountGroupMap(typedMockState);

      const firstGroupMapping = result.get(EIP155_MAINNET_SCOPE);
      expect(firstGroupMapping?.[0]?.id).toBe(ENTROPY_GROUP_1_ID);

      expect(firstGroupMapping?.[0]?.accounts).toHaveLength(2);
    });

    it('handles accounts with multiple scopes', () => {
      const stateWithMultiScopeAccount = createStateWithNetworkConfigurations(
        {
          wallets: {
            'entropy:test': {
              id: 'entropy:test',
              type: AccountWalletType.Entropy,
              groups: {
                'entropy:test/0': {
                  id: 'entropy:test/0',
                  type: AccountGroupType.MultichainAccount,
                  accounts: ['multi-scope-account'],
                  metadata: {
                    name: 'Multi Scope Account',
                    entropy: { groupIndex: 0 },
                    pinned: false,
                    hidden: false,
                  },
                },
              },
              metadata: {
                name: 'Test Wallet',
                entropy: { id: 'test' },
              },
            },
          },
          selectedAccountGroup: 'entropy:test/0' as AccountGroupId,
        },
        {
          accounts: {
            'multi-scope-account': createMockInternalAccount({
              id: 'multi-scope-account',
              name: 'Multi Scope Account',
              address: '0x123',
              type: EthAccountType.Eoa,
            }),
          },
          selectedAccount: 'multi-scope-account',
        },
      );

      const result = getScopeToAccountGroupMap(stateWithMultiScopeAccount);

      expect(result.get(EIP155_MAINNET_SCOPE)?.[0]?.id).toBe('entropy:test/0');
      expect(result.get('eip155:0')?.[0]?.id).toBe('entropy:test/0');
    });

    it('handles empty account groups', () => {
      const stateWithEmptyGroup = createStateWithNetworkConfigurations(
        {
          wallets: {
            'entropy:test': {
              id: 'entropy:test',
              type: AccountWalletType.Entropy,
              groups: {
                'entropy:test/0': {
                  id: 'entropy:test/0',
                  type: AccountGroupType.MultichainAccount,
                  accounts: ['placeholder-account'] as [string, ...string[]],
                  metadata: {
                    name: 'Empty Group',
                    entropy: { groupIndex: 0 },
                    pinned: false,
                    hidden: false,
                  },
                },
              },
              metadata: {
                name: 'Test Wallet',
                entropy: { id: 'test' },
              },
            },
          },
          selectedAccountGroup: 'entropy:test/0' as AccountGroupId,
        },
        {
          accounts: {},
          selectedAccount: '',
        },
      );

      const result = getScopeToAccountGroupMap(stateWithEmptyGroup);

      expect(result.size).toBe(0);
    });

    it('filters out accounts without matching internal accounts', () => {
      const stateWithMissingAccount = createStateWithNetworkConfigurations(
        {
          wallets: {
            'entropy:test': {
              id: 'entropy:test',
              type: AccountWalletType.Entropy,
              groups: {
                'entropy:test/0': {
                  id: 'entropy:test/0',
                  type: AccountGroupType.MultichainAccount,
                  accounts: ['missing-account-id'],
                  metadata: {
                    name: 'Test',
                    entropy: { groupIndex: 0 },
                    pinned: false,
                    hidden: false,
                  },
                },
              },
              metadata: {
                name: 'Test Wallet',
                entropy: { id: 'test' },
              },
            },
          },
          selectedAccountGroup: 'entropy:test/0' as AccountGroupId,
        },
        {
          accounts: {},
          selectedAccount: '',
        },
      );
      const result = getScopeToAccountGroupMap(stateWithMissingAccount);

      expect(result.size).toBe(0);
    });

    it('handles mixed existing and missing internal accounts', () => {
      const stateWithMixedAccounts = createStateWithNetworkConfigurations(
        {
          wallets: {
            'entropy:test': {
              id: 'entropy:test',
              type: AccountWalletType.Entropy,
              groups: {
                'entropy:test/0': {
                  id: 'entropy:test/0',
                  type: AccountGroupType.MultichainAccount,
                  accounts: ['existing-account', 'missing-account'],
                  metadata: {
                    name: 'Test',
                    entropy: { groupIndex: 0 },
                    pinned: false,
                    hidden: false,
                  },
                },
              },
              metadata: {
                name: 'Test Wallet',
                entropy: { id: 'test' },
              },
            },
          },
          selectedAccountGroup: 'entropy:test/0' as AccountGroupId,
        },
        {
          accounts: {
            'existing-account': createMockInternalAccount({
              id: 'existing-account',
              name: 'Test Account',
              address: '0x123',
            }),
          },
          selectedAccount: 'existing-account',
        },
      );
      const result = getScopeToAccountGroupMap(stateWithMixedAccounts);

      expect(result.size).toBeGreaterThan(0);

      const groupWithExistingAccount = Array.from(result.values())
        .flat()
        .find((group) =>
          group.accounts.some((account) => account.id === 'existing-account'),
        );
      expect(groupWithExistingAccount).toBeDefined();
    });

    it('maps all EVM network configurations for EOA accounts', () => {
      const result = getScopeToAccountGroupMap(typedMockState);

      const evmChains = [
        'eip155:1',
        'eip155:5',
        'eip155:11155111',
        'eip155:56',
      ];

      evmChains.forEach((chainId) => {
        const mapping = result.get(chainId);
        expect(mapping).toBeDefined();
        expect(mapping?.[0]?.id).toMatch(/^entropy:/u); // Should be entropy groups with EOA accounts
      });
    });

    it('does not add EVM chain mappings for non-EOA accounts', () => {
      const stateWithErc4337Account = createStateWithNetworkConfigurations(
        {
          wallets: {
            'entropy:test': {
              id: 'entropy:test',
              type: AccountWalletType.Entropy,
              groups: {
                'entropy:test/0': {
                  id: 'entropy:test/0',
                  type: AccountGroupType.MultichainAccount,
                  accounts: ['erc4337-account'],
                  metadata: {
                    name: 'ERC4337 Account',
                    entropy: { groupIndex: 0 },
                    pinned: false,
                    hidden: false,
                  },
                },
              },
              metadata: {
                name: 'Test Wallet',
                entropy: { id: 'test' },
              },
            },
          },
          selectedAccountGroup: 'entropy:test/0' as AccountGroupId,
        },
        {
          accounts: {
            'erc4337-account': createMockInternalAccount({
              id: 'erc4337-account',
              name: 'ERC4337 Account',
              address: '0x456',
              type: EthAccountType.Erc4337,
            }),
          },
          selectedAccount: 'erc4337-account',
        },
      );

      const result = getScopeToAccountGroupMap(stateWithErc4337Account);

      expect(result.get('eip155:11155111')).toBeDefined();

      expect(result.get('eip155:0')).toBeUndefined();
    });

    it('handles account groups from different wallet types', () => {
      const result = getScopeToAccountGroupMap(typedMockState);

      const mappedGroups = Array.from(result.values()).flat();
      const walletTypes = new Set(
        mappedGroups.map((group) => group.id.split(':')[0]),
      );

      expect(walletTypes.size).toBeGreaterThan(1);
      expect(walletTypes).toContain('entropy');
      expect(walletTypes).toContain('keyring');
      expect(walletTypes).toContain('snap');
    });

    it('returns empty map when no account groups exist', () => {
      const emptyState = createStateWithNetworkConfigurations(
        {
          wallets: {},
          selectedAccountGroup: null as unknown as AccountGroupId,
        },
        {
          accounts: {},
          selectedAccount: '',
        },
      );
      const result = getScopeToAccountGroupMap(emptyState);

      expect(result.size).toBe(0);
    });

    it('preserves account group structure and metadata', () => {
      const result = getScopeToAccountGroupMap(typedMockState);

      const firstMapping = result.get(EIP155_MAINNET_SCOPE);
      expect(firstMapping).toBeDefined();

      expect(firstMapping?.[0]).toHaveProperty('id');
      expect(firstMapping?.[0]).toHaveProperty('type');
      expect(firstMapping?.[0]).toHaveProperty('accounts');
      expect(firstMapping?.[0]).toHaveProperty('metadata');

      expect(firstMapping?.[0]?.accounts[0]).toHaveProperty('address');
      expect(firstMapping?.[0]?.accounts[0]).toHaveProperty('scopes');
      expect(firstMapping?.[0]?.accounts[0]).toHaveProperty('type');
    });
  });
});
