import React from 'react';
import configureStore from 'redux-mock-store';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import { AppHeader } from '.';

describe('App Header', () => {
  it('should match snapshot', () => {
    const mockState = {
      activeTab: {
        title: 'Eth Sign Tests',
        origin: 'https://remix.ethereum.org',
        protocol: 'https:',
        url: 'https://remix.ethereum.org/',
      },
      metamask: {
        provider: {
          chainId: CHAIN_IDS.GOERLI,
        },
        accounts: {
          '0x7250739de134d33ec7ab1ee592711e15098c9d2d': {
            address: '0x7250739de134d33ec7ab1ee592711e15098c9d2d',
          },
          '0x8e5d75d60224ea0c33d0041e75de68b1c3cb6dd5': {
            address: '0x8e5d75d60224ea0c33d0041e75de68b1c3cb6dd5',
          },
        },
        preferences: {
          showTestNetworks: true,
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
        },
        keyrings: [
          {
            accounts: [
              '0x8e5d75d60224ea0c33d0041e75de68b1c3cb6dd5',
              '0x7250739de134d33ec7ab1ee592711e15098c9d2d',
            ],
          },
        ],
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

    const mockStore = configureStore();
    const store = mockStore(mockState);
    const { container } = renderWithProvider(<AppHeader />, store);
    expect(container).toMatchSnapshot();
  });
});
