import { AccountGroupId } from '@metamask/account-api';
import mockState from '../../../test/data/mock-state.json';
import {
  getAccountTree,
  getInternalAccountByGroupAndCaip,
  getInternalAccountBySelectedAccountGroupAndCaip,
  getSelectedAccountGroup,
  getWalletIdAndNameByAccountAddress,
  getWalletsWithAccounts,
} from './account-tree';
import { MultichainAccountsState } from './account-tree.types';

describe('Multichain Accounts Selectors', () => {
  describe('getAccountTree', () => {
    it('returns the account tree', () => {
      const result = getAccountTree(
        mockState as unknown as MultichainAccountsState,
      );

      expect(result).toStrictEqual(mockState.metamask.accountTree);
    });
  });

  describe('getWalletsWithAccounts', () => {
    it('returns wallets with accounts and their metadata', () => {
      const result = getWalletsWithAccounts(mockState);

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
        mockState,
        '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
      );

      expect(result).toStrictEqual({
        id: 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ',
        name: 'Wallet 1',
      });
    });

    it('returns null if the account is not found', () => {
      const result = getWalletIdAndNameByAccountAddress(
        mockState,
        '0x1234567890abcdef1234567890abcdef12345678',
      );

      expect(result).toBeNull();
    });
  });

  describe('getInternalAccountByGroupAndCaip', () => {
    it('returns the internal account for a group and CAIP chain ID', () => {
      const result = getInternalAccountByGroupAndCaip(
        mockState,
        'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/0' as AccountGroupId,
        'eip155:0',
      );

      expect(result).toStrictEqual(
        mockState.metamask.internalAccounts.accounts[
          'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3'
        ],
      );
    });

    it('returns null if the group is not found', () => {
      const result = getInternalAccountByGroupAndCaip(
        mockState,
        'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/0' as AccountGroupId,
        'bip122:000000000019d6689c085ae165831e93',
      );

      expect(result).toBeNull();
    });
  });

  describe('getInternalAccountBySelectedAccountGroupAndCaip', () => {
    it('returns the internal account for a selected account group and CAIP chain ID', () => {
      const result = getInternalAccountBySelectedAccountGroupAndCaip(
        mockState,
        'eip155:0',
      );

      expect(result).toStrictEqual(
        mockState.metamask.internalAccounts.accounts[
          'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3'
        ],
      );
    });

    it('returns null if the internal account is not found in the selected account group', () => {
      const result = getInternalAccountBySelectedAccountGroupAndCaip(
        mockState,
        'bip122:000000000019d6689c085ae165831e93',
      );

      expect(result).toBeNull();
    });
  });

  describe('getSelectedAccountGroup', () => {
    it('returns the selected account group', () => {
      const result = getSelectedAccountGroup(
        mockState as unknown as MultichainAccountsState,
      );

      expect(result).toStrictEqual(
        mockState.metamask.accountTree.selectedAccountGroup,
      );
    });
  });
});
