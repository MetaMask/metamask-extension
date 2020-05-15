import assert from 'assert'
import {
  getConnectedDomainsForSelectedAddress,
  getOrderedConnectedAccountsForActiveTab,
  getPermissionsForActiveTab,
} from '../permissions'

describe('selectors', function () {

  describe('getConnectedDomainsForSelectedAddress', function () {
    it('should return the list of connected domains when there is 1 connected account', function () {
      const mockState = {
        metamask: {
          selectedAddress: '0x8e5d75d60224ea0c33d0041e75de68b1c3cb6dd5',
          domainMetadata: {
            'peepeth.com': {
              'icon': 'https://peepeth.com/favicon-32x32.png',
              'name': 'Peepeth',
            },
            'remix.ethereum.org': {
              'icon': 'https://remix.ethereum.org/icon.png',
              'name': 'Remix - Ethereum IDE',
            },
          },
          domains: {
            'peepeth.com': {
              'permissions': [
                {
                  '@context': [
                    'https://github.com/MetaMask/rpc-cap',
                  ],
                  'caveats': [
                    {
                      'name': 'exposedAccounts',
                      'type': 'filterResponse',
                      'value': [
                        '0x8e5d75d60224ea0c33d0041e75de68b1c3cb6dd5',
                      ],
                    },
                  ],
                  'date': 1585676177970,
                  'id': '840d72a0-925f-449f-830a-1aa1dd5ce151',
                  'invoker': 'peepeth.com',
                  'parentCapability': 'eth_accounts',
                },
              ],
            },
            'remix.ethereum.org': {
              'permissions': [
                {
                  '@context': [
                    'https://github.com/MetaMask/rpc-cap',
                  ],
                  'caveats': [
                    {
                      'type': 'filterResponse',
                      'value': [
                        '0x8e5d75d60224ea0c33d0041e75de68b1c3cb6dd5',
                      ],
                      'name': 'exposedAccounts',
                    },
                  ],
                  'date': 1585685128948,
                  'id': '6b9615cc-64e4-4317-afab-3c4f8ee0244a',
                  'invoker': 'remix.ethereum.org',
                  'parentCapability': 'eth_accounts',
                },
              ],
            },
          },
        },
      }
      const extensionId = undefined
      assert.deepEqual(getConnectedDomainsForSelectedAddress(mockState), [{
        extensionId,
        icon: 'https://peepeth.com/favicon-32x32.png',
        key: 'peepeth.com',
        name: 'Peepeth',
      }, {
        extensionId,
        name: 'Remix - Ethereum IDE',
        icon: 'https://remix.ethereum.org/icon.png',
        key: 'remix.ethereum.org',
      }])
    })

    it('should return the list of connected domains when there are 2 connected accounts', function () {
      const mockState = {
        metamask: {
          selectedAddress: '0x7250739de134d33ec7ab1ee592711e15098c9d2d',
          domainMetadata: {
            'peepeth.com': {
              'icon': 'https://peepeth.com/favicon-32x32.png',
              'name': 'Peepeth',
            },
            'remix.ethereum.org': {
              'icon': 'https://remix.ethereum.org/icon.png',
              'name': 'Remix - Ethereum IDE',
            },
          },
          domains: {
            'peepeth.com': {
              'permissions': [
                {
                  '@context': [
                    'https://github.com/MetaMask/rpc-cap',
                  ],
                  'caveats': [
                    {
                      'name': 'exposedAccounts',
                      'type': 'filterResponse',
                      'value': [
                        '0x8e5d75d60224ea0c33d0041e75de68b1c3cb6dd5',
                      ],
                    },
                  ],
                  'date': 1585676177970,
                  'id': '840d72a0-925f-449f-830a-1aa1dd5ce151',
                  'invoker': 'peepeth.com',
                  'parentCapability': 'eth_accounts',
                },
              ],
            },
            'remix.ethereum.org': {
              'permissions': [
                {
                  '@context': [
                    'https://github.com/MetaMask/rpc-cap',
                  ],
                  'caveats': [
                    {
                      'type': 'filterResponse',
                      'value': [
                        '0x8e5d75d60224ea0c33d0041e75de68b1c3cb6dd5',
                        '0x7250739de134d33ec7ab1ee592711e15098c9d2d',
                      ],
                      'name': 'exposedAccounts',
                    },
                  ],
                  'date': 1585685128948,
                  'id': '6b9615cc-64e4-4317-afab-3c4f8ee0244a',
                  'invoker': 'remix.ethereum.org',
                  'parentCapability': 'eth_accounts',
                },
              ],
            },
          },
        },
      }
      const extensionId = undefined
      assert.deepEqual(getConnectedDomainsForSelectedAddress(mockState), [{
        extensionId,
        name: 'Remix - Ethereum IDE',
        icon: 'https://remix.ethereum.org/icon.png',
        key: 'remix.ethereum.org',
      }])
    })
  })

  describe('getConnectedAccountsForActiveTab', function () {
    const mockState = {
      activeTab: {
        'title': 'Eth Sign Tests',
        'origin': 'remix.ethereum.org',
        'protocol': 'https:',
        'url': 'https://remix.ethereum.org/',
      },
      metamask: {
        identities: {
          '0x7250739de134d33ec7ab1ee592711e15098c9d2d': {
            'address': '0x7250739de134d33ec7ab1ee592711e15098c9d2d',
            'name': 'Really Long Name That Should Be Truncated',
          },
          '0x8e5d75d60224ea0c33d0041e75de68b1c3cb6dd5': {
            'address': '0x8e5d75d60224ea0c33d0041e75de68b1c3cb6dd5',
            'name': 'Account 1',
          },
          '0xb3958fb96c8201486ae20be1d5c9f58083df343a': {
            'address': '0xb3958fb96c8201486ae20be1d5c9f58083df343a',
            'name': 'Account 2',
          },
        },
        domains: {
          'remix.ethereum.org': {
            'permissions': [
              {
                '@context': [
                  'https://github.com/MetaMask/rpc-cap',
                ],
                'caveats': [
                  {
                    'name': 'exposedAccounts',
                    'type': 'filterResponse',
                    'value': [
                      '0x8e5d75d60224ea0c33d0041e75de68b1c3cb6dd5',
                      '0x7250739de134d33ec7ab1ee592711e15098c9d2d',
                    ],
                  },
                ],
                'date': 1586359844177,
                'id': '3aa65a8b-3bcb-4944-941b-1baa5fe0ed8b',
                'invoker': 'remix.ethereum.org',
                'parentCapability': 'eth_accounts',
              },
            ],
          },
          'peepeth.com': {
            'permissions': [
              {
                '@context': [
                  'https://github.com/MetaMask/rpc-cap',
                ],
                'caveats': [
                  {
                    'name': 'exposedAccounts',
                    'type': 'filterResponse',
                    'value': [
                      '0x8e5d75d60224ea0c33d0041e75de68b1c3cb6dd5',
                    ],
                  },
                ],
                'date': 1585676177970,
                'id': '840d72a0-925f-449f-830a-1aa1dd5ce151',
                'invoker': 'peepeth.com',
                'parentCapability': 'eth_accounts',
              },
            ],
          },
          'uniswap.exchange': {
            'permissions': [
              {
                '@context': [
                  'https://github.com/MetaMask/rpc-cap',
                ],
                'caveats': [
                  {
                    'name': 'exposedAccounts',
                    'type': 'filterResponse',
                    'value': [
                      '0x8e5d75d60224ea0c33d0041e75de68b1c3cb6dd5',
                    ],
                  },
                ],
                'date': 1585616816623,
                'id': 'ce625215-f2e9-48e7-93ca-21ba193244ff',
                'invoker': 'uniswap.exchange',
                'parentCapability': 'eth_accounts',
              },
            ],
          },
        },
        domainMetadata: {
          'remix.ethereum.org': {
            'icon': 'https://remix.ethereum.org/icon.png',
            'name': 'Remix - Ethereum IDE',
          },
        },
        permissionsHistory: {
          'remix.ethereum.org': {
            'eth_accounts': {
              'accounts': {
                '0x7250739de134d33ec7ab1ee592711e15098c9d2d': 1586359844192,
                '0x8e5d75d60224ea0c33d0041e75de68b1c3cb6dd5': 1586359844192,
              },
              'lastApproved': 1586359844192,
            },
          },
        },
        permissionsDescriptions: {
          'eth_accounts': "View the addresses of the user's chosen accounts.",
        },
      },
    }

    it('should return a list of connected accounts', function () {
      assert.deepEqual(getOrderedConnectedAccountsForActiveTab(mockState), [{
        address: '0x8e5d75d60224ea0c33d0041e75de68b1c3cb6dd5',
        name: 'Account 1',
        lastActive: 1586359844192,
      }, {
        address: '0x7250739de134d33ec7ab1ee592711e15098c9d2d',
        name: 'Really Long Name That Should Be Truncated',
        lastActive: 1586359844192,
      }])
    })
  })

  describe('getPermissionsForActiveTab', function () {
    const mockState = {
      activeTab: {
        'title': 'Eth Sign Tests',
        'origin': 'remix.ethereum.org',
        'protocol': 'https:',
        'url': 'https://remix.ethereum.org/',
      },
      metamask: {
        identities: {
          '0x7250739de134d33ec7ab1ee592711e15098c9d2d': {
            'address': '0x7250739de134d33ec7ab1ee592711e15098c9d2d',
            'name': 'Really Long Name That Should Be Truncated',
          },
          '0x8e5d75d60224ea0c33d0041e75de68b1c3cb6dd5': {
            'address': '0x8e5d75d60224ea0c33d0041e75de68b1c3cb6dd5',
            'name': 'Account 1',
          },
          '0xb3958fb96c8201486ae20be1d5c9f58083df343a': {
            'address': '0xb3958fb96c8201486ae20be1d5c9f58083df343a',
            'name': 'Account 2',
          },
        },
        domains: {
          'remix.ethereum.org': {
            'permissions': [
              {
                '@context': [
                  'https://github.com/MetaMask/rpc-cap',
                ],
                'caveats': [
                  {
                    'name': 'exposedAccounts',
                    'type': 'filterResponse',
                    'value': [
                      '0x8e5d75d60224ea0c33d0041e75de68b1c3cb6dd5',
                      '0x7250739de134d33ec7ab1ee592711e15098c9d2d',
                    ],
                  },
                ],
                'date': 1586359844177,
                'id': '3aa65a8b-3bcb-4944-941b-1baa5fe0ed8b',
                'invoker': 'remix.ethereum.org',
                'parentCapability': 'eth_accounts',
              },
            ],
          },
          'peepeth.com': {
            'permissions': [
              {
                '@context': [
                  'https://github.com/MetaMask/rpc-cap',
                ],
                'caveats': [
                  {
                    'name': 'exposedAccounts',
                    'type': 'filterResponse',
                    'value': [
                      '0x8e5d75d60224ea0c33d0041e75de68b1c3cb6dd5',
                    ],
                  },
                ],
                'date': 1585676177970,
                'id': '840d72a0-925f-449f-830a-1aa1dd5ce151',
                'invoker': 'peepeth.com',
                'parentCapability': 'eth_accounts',
              },
            ],
          },
          'uniswap.exchange': {
            'permissions': [
              {
                '@context': [
                  'https://github.com/MetaMask/rpc-cap',
                ],
                'caveats': [
                  {
                    'name': 'exposedAccounts',
                    'type': 'filterResponse',
                    'value': [
                      '0x8e5d75d60224ea0c33d0041e75de68b1c3cb6dd5',
                    ],
                  },
                ],
                'date': 1585616816623,
                'id': 'ce625215-f2e9-48e7-93ca-21ba193244ff',
                'invoker': 'uniswap.exchange',
                'parentCapability': 'eth_accounts',
              },
            ],
          },
        },
        domainMetadata: {
          'remix.ethereum.org': {
            'icon': 'https://remix.ethereum.org/icon.png',
            'name': 'Remix - Ethereum IDE',
          },
        },
        permissionsHistory: {
          'remix.ethereum.org': {
            'eth_accounts': {
              'accounts': {
                '0x7250739de134d33ec7ab1ee592711e15098c9d2d': 1586359844192,
                '0x8e5d75d60224ea0c33d0041e75de68b1c3cb6dd5': 1586359844192,
              },
              'lastApproved': 1586359844192,
            },
          },
        },
        permissionsDescriptions: {
          'eth_accounts': "View the addresses of the user's chosen accounts.",
        },
      },
    }

    it('should return a list of permissions strings', function () {
      assert.deepEqual(getPermissionsForActiveTab(mockState), [{
        key: 'eth_accounts',
        description: "View the addresses of the user's chosen accounts.",
      }])
    })
  })

})
