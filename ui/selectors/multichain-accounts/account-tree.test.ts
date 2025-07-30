import mockState from '../../../test/data/mock-state.json';
import {
  getAccountTree,
  getWalletsWithAccounts,
  getWalletsWithAccountsSimplified,
} from './account-tree';
import { MultichainAccountsState } from './account-tree.types';

const MOCK_LEDGER_WALLET = {
  groups: {
    'local:hardware:ledger:default': {
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
      id: 'local:hardware:ledger:default',
      metadata: {
        name: 'Default',
      },
    },
  },
  id: 'local:hardware:ledger',
  metadata: {
    name: 'Ledger Hardware',
  },
};

const MOCK_SNAP_WALLET = {
  groups: {
    'local:snap-id:default': {
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
      id: 'local:snap-id:default',
      metadata: {
        name: 'Default',
      },
    },
  },
  id: 'local:snap-id',
  metadata: {
    name: 'Snap: snap-name',
  },
};

const MOCK_CUSTODY_WALLET = {
  groups: {
    'local:custody:test:default': {
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
      id: 'local:custody:test:default',
      metadata: {
        name: 'Default',
      },
    },
  },
  id: 'local:custody:test',
  metadata: {
    name: 'Custody test',
  },
};

const MOCK_EVM_ACCOUNT_1 = {
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
    entropySource: 'entropy:01K1EG2TK3QKGJ36GTW6YB8572',
  },
  scopes: ['eip155:0'],
  type: 'eip155:eoa',
};

const MOCK_EVM_ACCOUNT_2 = {
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
    entropySource: 'entropy:01K1EG2TK3QKGJ36GTW6YB8572',
  },
  scopes: ['eip155:0'],
  type: 'eip155:eoa',
};

const MOCK_EVM_ACCOUNT_3 = {
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
    entropySource: 'entropy:01JKAF3PJ247KAM6C03G5Q0NP8',
  },
  scopes: ['eip155:0'],
  type: 'eip155:eoa',
};

const MOCK_SOL_ACCOUNT_1 = {
  address: 'H3Lq23RBHV7qwWN25r3u5JWZhHQMwr7xepH2uxsbuDca',
  id: 'd12581f4-3425-441b-94c4-23892f6a8e87',
  active: false,
  balance: '0',
  metadata: {
    importTime: 1753907033790,
    name: 'Solana Account 1',
    keyring: {
      type: 'Snap Keyring',
    },
    snap: {
      id: 'npm:@metamask/solana-wallet-snap',
      name: 'Solana',
      enabled: true,
    },
  },
  options: {
    entropySource: 'entropy:01K1EG2TK3QKGJ36GTW6YB8572',
    derivationPath: "m/44'/501'/0'/0'",
    type: 'mnemonic',
    groupIndex: 0,
  },
  methods: [
    'signAndSendTransaction',
    'signTransaction',
    'signMessage',
    'signIn',
  ],
  scopes: ['solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp'],
  type: 'solana:data-account',
  pinned: false,
  hidden: false,
};

const MOCK_SOL_ACCOUNT_2 = {
  address: '97EnCNkv3PruBTDRwsnYcLfoqXeGwTnJqErt3Hfeu9ta',
  id: '08d34637-d54c-4830-aab3-635fda3bd840',
  active: false,
  balance: '0',
  metadata: {
    importTime: 1723404053678,
    name: 'Solana Account 2',
    keyring: {
      type: 'Snap Keyring',
    },
    snap: {
      id: 'npm:@metamask/solana-wallet-snap',
      name: 'Solana',
      enabled: true,
    },
  },
  options: {
    entropySource: 'entropy:01K1EG2TK3QKGJ36GTW6YB8572',
    derivationPath: "m/44'/501'/1'/0'",
    type: 'mnemonic',
    groupIndex: 0,
  },
  methods: [
    'signAndSendTransaction',
    'signTransaction',
    'signMessage',
    'signIn',
  ],
  scopes: ['solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp'],
  type: 'solana:data-account',
  pinned: false,
  hidden: false,
};

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
        'entropy:01K1EG2TK3QKGJ36GTW6YB8572': {
          groups: {
            'entropy:01K1EG2TK3QKGJ36GTW6YB8572/0': {
              accounts: [MOCK_EVM_ACCOUNT_1, MOCK_EVM_ACCOUNT_2],
              id: 'entropy:01K1EG2TK3QKGJ36GTW6YB8572/0',
              metadata: {
                name: 'Group 0',
              },
            },
            'entropy:01K1EG2TK3QKGJ36GTW6YB8572/1': {
              accounts: [MOCK_SOL_ACCOUNT_1, MOCK_SOL_ACCOUNT_2],
              id: 'entropy:01K1EG2TK3QKGJ36GTW6YB8572/1',
              metadata: {
                name: 'Group 1',
              },
            },
          },
          id: 'entropy:01K1EG2TK3QKGJ36GTW6YB8572',
          metadata: {
            name: 'Wallet 1',
          },
        },
        'entropy:01JKAF3PJ247KAM6C03G5Q0NP8': {
          groups: {
            'entropy:01JKAF3PJ247KAM6C03G5Q0NP8/0': {
              accounts: [MOCK_EVM_ACCOUNT_3],
              id: 'entropy:01JKAF3PJ247KAM6C03G5Q0NP8/0',
              metadata: {
                name: 'Group 0',
              },
            },
          },
          id: 'entropy:01JKAF3PJ247KAM6C03G5Q0NP8',
          metadata: {
            name: 'Wallet 2',
          },
        },
        [MOCK_CUSTODY_WALLET.id]: MOCK_CUSTODY_WALLET,
        [MOCK_LEDGER_WALLET.id]: MOCK_LEDGER_WALLET,
        [MOCK_SNAP_WALLET.id]: MOCK_SNAP_WALLET,
      });
    });
  });

  describe('getWalletsWithAccountsSimplified', () => {
    it('returns wallets with accounts added to the first group exclusively and their metadata', () => {
      const result = getWalletsWithAccountsSimplified(mockState);

      expect(result).toStrictEqual({
        'entropy:01K1EG2TK3QKGJ36GTW6YB8572': {
          groups: {
            'entropy:01K1EG2TK3QKGJ36GTW6YB8572/0': {
              accounts: [
                MOCK_EVM_ACCOUNT_1,
                MOCK_EVM_ACCOUNT_2,
                MOCK_SOL_ACCOUNT_1,
                MOCK_SOL_ACCOUNT_2,
              ],
              id: 'entropy:01K1EG2TK3QKGJ36GTW6YB8572/0',
              metadata: {
                name: 'Group 0',
              },
            },
            'entropy:01K1EG2TK3QKGJ36GTW6YB8572/1': {
              accounts: [],
              id: 'entropy:01K1EG2TK3QKGJ36GTW6YB8572/1',
              metadata: {
                name: 'Group 1',
              },
            },
          },
          id: 'entropy:01K1EG2TK3QKGJ36GTW6YB8572',
          metadata: {
            name: 'Wallet 1',
          },
        },
        'entropy:01JKAF3PJ247KAM6C03G5Q0NP8': {
          groups: {
            'entropy:01JKAF3PJ247KAM6C03G5Q0NP8/0': {
              accounts: [MOCK_EVM_ACCOUNT_3],
              id: 'entropy:01JKAF3PJ247KAM6C03G5Q0NP8/0',
              metadata: {
                name: 'Group 0',
              },
            },
          },
          id: 'entropy:01JKAF3PJ247KAM6C03G5Q0NP8',
          metadata: {
            name: 'Wallet 2',
          },
        },
        [MOCK_CUSTODY_WALLET.id]: MOCK_CUSTODY_WALLET,
        [MOCK_LEDGER_WALLET.id]: MOCK_LEDGER_WALLET,
        [MOCK_SNAP_WALLET.id]: MOCK_SNAP_WALLET,
      });
    });
  });
});
