import assert from 'assert'
import { getConnectedDomainsForSelectedAddress } from '../permissions'

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

})
