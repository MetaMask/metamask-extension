import { CHAIN_IDS } from '../../shared/constants/network';
import {
  getConnectedSubjectsForSelectedAddress,
  getLastConnectedInfo,
  getOrderedConnectedAccountsForActiveTab,
  getPermissionsForActiveTab,
} from './permissions';

describe('selectors', () => {
  describe('getConnectedSubjectsForSelectedAddress', () => {
    it('should return the list of connected subjects when there is 1 connected account', () => {
      const mockState = {
        metamask: {
          selectedAddress: '0x8e5d75d60224ea0c33d0041e75de68b1c3cb6dd5',
          subjectMetadata: {
            'peepeth.com': {
              iconUrl: 'https://peepeth.com/favicon-32x32.png',
              name: 'Peepeth',
            },
            'https://remix.ethereum.org': {
              iconUrl: 'https://remix.ethereum.org/icon.png',
              name: 'Remix - Ethereum IDE',
            },
          },
          subjects: {
            'peepeth.com': {
              permissions: {
                eth_accounts: {
                  caveats: [
                    {
                      type: 'restrictReturnedAccounts',
                      value: ['0x8e5d75d60224ea0c33d0041e75de68b1c3cb6dd5'],
                    },
                  ],
                  date: 1585676177970,
                  id: '840d72a0-925f-449f-830a-1aa1dd5ce151',
                  invoker: 'peepeth.com',
                  parentCapability: 'eth_accounts',
                },
              },
            },
            'https://remix.ethereum.org': {
              permissions: {
                eth_accounts: {
                  caveats: [
                    {
                      type: 'restrictReturnedAccounts',
                      value: ['0x8e5d75d60224ea0c33d0041e75de68b1c3cb6dd5'],
                    },
                  ],
                  date: 1585685128948,
                  id: '6b9615cc-64e4-4317-afab-3c4f8ee0244a',
                  invoker: 'https://remix.ethereum.org',
                  parentCapability: 'eth_accounts',
                },
              },
            },
          },
        },
      };
      const extensionId = undefined;
      expect(getConnectedSubjectsForSelectedAddress(mockState)).toStrictEqual([
        {
          extensionId,
          iconUrl: 'https://peepeth.com/favicon-32x32.png',
          origin: 'peepeth.com',
          name: 'Peepeth',
        },
        {
          extensionId,
          name: 'Remix - Ethereum IDE',
          iconUrl: 'https://remix.ethereum.org/icon.png',
          origin: 'https://remix.ethereum.org',
        },
      ]);
    });

    it('should return the list of connected subjects when there are 2 connected accounts', () => {
      const mockState = {
        metamask: {
          selectedAddress: '0x7250739de134d33ec7ab1ee592711e15098c9d2d',
          subjectMetadata: {
            'peepeth.com': {
              iconUrl: 'https://peepeth.com/favicon-32x32.png',
              name: 'Peepeth',
            },
            'https://remix.ethereum.org': {
              iconUrl: 'https://remix.ethereum.org/icon.png',
              name: 'Remix - Ethereum IDE',
            },
          },
          subjects: {
            'peepeth.com': {
              permissions: {
                eth_accounts: {
                  caveats: [
                    {
                      type: 'restrictReturnedAccounts',
                      value: ['0x8e5d75d60224ea0c33d0041e75de68b1c3cb6dd5'],
                    },
                  ],
                  date: 1585676177970,
                  id: '840d72a0-925f-449f-830a-1aa1dd5ce151',
                  invoker: 'peepeth.com',
                  parentCapability: 'eth_accounts',
                },
              },
            },
            'https://remix.ethereum.org': {
              permissions: {
                eth_accounts: {
                  caveats: [
                    {
                      type: 'restrictReturnedAccounts',
                      value: [
                        '0x8e5d75d60224ea0c33d0041e75de68b1c3cb6dd5',
                        '0x7250739de134d33ec7ab1ee592711e15098c9d2d',
                      ],
                    },
                  ],
                  date: 1585685128948,
                  id: '6b9615cc-64e4-4317-afab-3c4f8ee0244a',
                  invoker: 'https://remix.ethereum.org',
                  parentCapability: 'eth_accounts',
                },
              },
            },
          },
        },
      };
      const extensionId = undefined;
      expect(getConnectedSubjectsForSelectedAddress(mockState)).toStrictEqual([
        {
          extensionId,
          name: 'Remix - Ethereum IDE',
          iconUrl: 'https://remix.ethereum.org/icon.png',
          origin: 'https://remix.ethereum.org',
        },
      ]);
    });
  });

  describe('getConnectedAccountsForActiveTab', () => {
    const mockState = {
      activeTab: {
        title: 'Eth Sign Tests',
        origin: 'https://remix.ethereum.org',
        protocol: 'https:',
        url: 'https://remix.ethereum.org/',
      },
      metamask: {
        providerConfig: {
          chainId: CHAIN_IDS.GOERLI,
        },
        accounts: {
          '0x7250739de134d33ec7ab1ee592711e15098c9d2d': {
            address: '0x7250739de134d33ec7ab1ee592711e15098c9d2d',
          },
          '0x8e5d75d60224ea0c33d0041e75de68b1c3cb6dd5': {
            address: '0x8e5d75d60224ea0c33d0041e75de68b1c3cb6dd5',
          },
          '0xb3958fb96c8201486ae20be1d5c9f58083df343a': {
            address: '0xb3958fb96c8201486ae20be1d5c9f58083df343a',
          },
          '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': {
            address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
          },
          '0x617b3f8050a0bd94b6b1da02b4384ee5b4df13f4': {
            address: '0x617b3f8050a0bd94b6b1da02b4384ee5b4df13f4',
          },
        },
        cachedBalances: {},
        subjects: {
          'https://remix.ethereum.org': {
            permissions: {
              eth_accounts: {
                caveats: [
                  {
                    type: 'restrictReturnedAccounts',
                    value: [
                      '0x8e5d75d60224ea0c33d0041e75de68b1c3cb6dd5',
                      '0x7250739de134d33ec7ab1ee592711e15098c9d2d',
                      '0x617b3f8050a0bd94b6b1da02b4384ee5b4df13f4',
                      '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
                      '0xb3958fb96c8201486ae20be1d5c9f58083df343a',
                    ],
                  },
                ],
                date: 1586359844177,
                id: '3aa65a8b-3bcb-4944-941b-1baa5fe0ed8b',
                invoker: 'https://remix.ethereum.org',
                parentCapability: 'eth_accounts',
              },
            },
          },
          'peepeth.com': {
            permissions: {
              eth_accounts: {
                caveats: [
                  {
                    type: 'restrictReturnedAccounts',
                    value: ['0x8e5d75d60224ea0c33d0041e75de68b1c3cb6dd5'],
                  },
                ],
                date: 1585676177970,
                id: '840d72a0-925f-449f-830a-1aa1dd5ce151',
                invoker: 'peepeth.com',
                parentCapability: 'eth_accounts',
              },
            },
          },
        },
        identities: {
          '0x7250739de134d33ec7ab1ee592711e15098c9d2d': {
            address: '0x7250739de134d33ec7ab1ee592711e15098c9d2d',
            name: 'Really Long Name That Should Be Truncated',
          },
          '0x8e5d75d60224ea0c33d0041e75de68b1c3cb6dd5': {
            address: '0x8e5d75d60224ea0c33d0041e75de68b1c3cb6dd5',
            lastSelected: 1586359844192,
            name: 'Account 1',
          },
          '0xb3958fb96c8201486ae20be1d5c9f58083df343a': {
            lastSelected: 1586359844193,
            address: '0xb3958fb96c8201486ae20be1d5c9f58083df343a',
            name: 'Account 2',
          },
          '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': {
            address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
            lastSelected: 1586359844192,
            name: 'Account 3',
          },
          '0x617b3f8050a0bd94b6b1da02b4384ee5b4df13f4': {
            address: '0x617b3f8050a0bd94b6b1da02b4384ee5b4df13f4',
            name: 'Account 4',
          },
        },
        keyrings: [
          {
            accounts: [
              '0x8e5d75d60224ea0c33d0041e75de68b1c3cb6dd5',
              '0x7250739de134d33ec7ab1ee592711e15098c9d2d',
              '0x617b3f8050a0bd94b6b1da02b4384ee5b4df13f4',
              '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
              '0xb3958fb96c8201486ae20be1d5c9f58083df343a',
            ],
          },
        ],
        permissionHistory: {
          'https://remix.ethereum.org': {
            eth_accounts: {
              accounts: {
                '0x7250739de134d33ec7ab1ee592711e15098c9d2d': 1586359844192,
                '0x8e5d75d60224ea0c33d0041e75de68b1c3cb6dd5': 1586359844192,
                '0x617b3f8050a0bd94b6b1da02b4384ee5b4df13f4': 1586359844192,
                '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': 1586359844192,
                '0xb3958fb96c8201486ae20be1d5c9f58083df343a': 1586359844192,
              },
              lastApproved: 1586359844192,
            },
          },
        },
      },
    };

    it('should return connected accounts sorted by last selected, then by keyring controller order', () => {
      expect(getOrderedConnectedAccountsForActiveTab(mockState)).toStrictEqual([
        {
          address: '0xb3958fb96c8201486ae20be1d5c9f58083df343a',
          balance: undefined,
          name: 'Account 2',
          lastActive: 1586359844192,
          lastSelected: 1586359844193,
        },
        {
          address: '0x8e5d75d60224ea0c33d0041e75de68b1c3cb6dd5',
          balance: undefined,
          name: 'Account 1',
          lastActive: 1586359844192,
          lastSelected: 1586359844192,
        },
        {
          address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
          balance: undefined,
          name: 'Account 3',
          lastActive: 1586359844192,
          lastSelected: 1586359844192,
        },
        {
          address: '0x7250739de134d33ec7ab1ee592711e15098c9d2d',
          balance: undefined,
          name: 'Really Long Name That Should Be Truncated',
          lastActive: 1586359844192,
        },
        {
          address: '0x617b3f8050a0bd94b6b1da02b4384ee5b4df13f4',
          balance: undefined,
          name: 'Account 4',
          lastActive: 1586359844192,
        },
      ]);
    });
  });

  describe('getLastConnectedInfo', () => {
    it('retrieves the last connected info', () => {
      const mockState = {
        metamask: {
          permissionHistory: {
            a: {
              foo: {},
              eth_accounts: { accounts: { 0x1: 1, 0x2: 2 } },
            },
            b: {
              foo: {},
              eth_accounts: { accounts: { 0x2: 2 } },
            },
            c: {
              foo: {},
            },
          },
        },
      };

      expect(getLastConnectedInfo(mockState)).toStrictEqual({
        a: { accounts: { 0x1: 1, 0x2: 2 } },
        b: { accounts: { 0x2: 2 } },
      });
    });
  });

  describe('getPermissionsForActiveTab', () => {
    const mockState = {
      activeTab: {
        title: 'Eth Sign Tests',
        origin: 'https://remix.ethereum.org',
        protocol: 'https:',
        url: 'https://remix.ethereum.org/',
      },
      metamask: {
        identities: {
          '0x7250739de134d33ec7ab1ee592711e15098c9d2d': {
            address: '0x7250739de134d33ec7ab1ee592711e15098c9d2d',
            name: 'Really Long Name That Should Be Truncated',
          },
          '0x8e5d75d60224ea0c33d0041e75de68b1c3cb6dd5': {
            address: '0x8e5d75d60224ea0c33d0041e75de68b1c3cb6dd5',
            name: 'Account 1',
          },
          '0xb3958fb96c8201486ae20be1d5c9f58083df343a': {
            address: '0xb3958fb96c8201486ae20be1d5c9f58083df343a',
            name: 'Account 2',
          },
        },
        subjects: {
          'https://remix.ethereum.org': {
            permissions: {
              eth_accounts: {
                caveats: [
                  {
                    type: 'restrictReturnedAccounts',
                    value: [
                      '0x8e5d75d60224ea0c33d0041e75de68b1c3cb6dd5',
                      '0x7250739de134d33ec7ab1ee592711e15098c9d2d',
                    ],
                  },
                ],
                date: 1586359844177,
                id: '3aa65a8b-3bcb-4944-941b-1baa5fe0ed8b',
                invoker: 'https://remix.ethereum.org',
                parentCapability: 'eth_accounts',
              },
            },
          },
          'peepeth.com': {
            permissions: {
              eth_accounts: {
                caveats: [
                  {
                    type: 'restrictReturnedAccounts',
                    value: ['0x8e5d75d60224ea0c33d0041e75de68b1c3cb6dd5'],
                  },
                ],
                date: 1585676177970,
                id: '840d72a0-925f-449f-830a-1aa1dd5ce151',
                invoker: 'peepeth.com',
                parentCapability: 'eth_accounts',
              },
            },
          },
          'uniswap.exchange': {
            permissions: {
              eth_accounts: {
                caveats: [
                  {
                    type: 'restrictReturnedAccounts',
                    value: ['0x8e5d75d60224ea0c33d0041e75de68b1c3cb6dd5'],
                  },
                ],
                date: 1585616816623,
                id: 'ce625215-f2e9-48e7-93ca-21ba193244ff',
                invoker: 'uniswap.exchange',
                parentCapability: 'eth_accounts',
              },
            },
          },
        },
        subjectMetadata: {
          'https://remix.ethereum.org': {
            iconUrl: 'https://remix.ethereum.org/icon.png',
            name: 'Remix - Ethereum IDE',
          },
        },
        permissionHistory: {
          'https://remix.ethereum.org': {
            eth_accounts: {
              accounts: {
                '0x7250739de134d33ec7ab1ee592711e15098c9d2d': 1586359844192,
                '0x8e5d75d60224ea0c33d0041e75de68b1c3cb6dd5': 1586359844192,
              },
              lastApproved: 1586359844192,
            },
          },
        },
      },
    };

    it('should return a list of permissions keys and values', () => {
      expect(getPermissionsForActiveTab(mockState)).toStrictEqual([
        {
          key: 'eth_accounts',
          value: {
            caveats: [
              {
                type: 'restrictReturnedAccounts',
                value: [
                  '0x8e5d75d60224ea0c33d0041e75de68b1c3cb6dd5',
                  '0x7250739de134d33ec7ab1ee592711e15098c9d2d',
                ],
              },
            ],
            date: 1586359844177,
            id: '3aa65a8b-3bcb-4944-941b-1baa5fe0ed8b',
            invoker: 'https://remix.ethereum.org',
            parentCapability: 'eth_accounts',
          },
        },
      ]);
    });
  });
});
