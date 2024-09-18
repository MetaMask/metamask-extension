import React from 'react';
import configureStore from 'redux-mock-store';
import { EthAccountType, EthMethod } from '@metamask/keyring-api';
import { fireEvent, renderWithProvider } from '../../../../test/jest';
import { ETH_EOA_METHODS } from '../../../../shared/constants/eth-methods';
import { PermissionDetailsModal } from '.';

describe('PermissionDetailsModal', () => {
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
      internalAccounts: {
        accounts: {
          'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3': {
            address: '0x7250739de134d33ec7ab1ee592711e15098c9d2d',
            id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
            metadata: {
              name: 'Really Long Name That Should Be Truncated',
              importTime: 1724252448,
              lastSelected: 1724252448,
              keyring: {
                type: 'HD Key Tree',
              },
            },
            options: {},
            methods: [...Object.values(EthMethod)],
            type: EthAccountType.Eoa,
          },
          '07c2cfec-36c9-46c4-8115-3836d3ac9047': {
            address: '0x8e5d75d60224ea0c33d0041e75de68b1c3cb6dd5',
            id: '07c2cfec-36c9-46c4-8115-3836d3ac9047',
            metadata: {
              name: 'Account 1',
              lastSelected: 1586359844192,
              importTime: 1586359844192,
              lastActive: 1586359844192,
              keyring: {
                type: 'HD Key Tree',
              },
            },
            options: {},
            methods: [...Object.values(EthMethod)],
            type: EthAccountType.Eoa,
          },
        },
        selectedAccount: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
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
  const store = configureStore()(mockState);
  const onClick = jest.fn();

  const args = {
    onClose: jest.fn(),
    onClick,
    account: {
      address: 'mockAddress',
      balance: 'mockBalance',
      id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
      metadata: {
        name: 'mockName',
        importTime: 1724256979,
        keyring: {
          type: 'HD Key Tree',
        },
      },
      options: {},
      methods: ETH_EOA_METHODS,
      type: EthAccountType.Eoa,
      label: '',
    },
    isOpen: true,
    permissions: [
      {
        key: 'eth_accounts',
        value: {
          caveats: [
            {
              type: 'restrictReturnedAccounts',
              value: ['0xd8ad671f1fcc94bcf0ebc6ec4790da35e8d5e1e1'],
            },
          ],
          date: 1710853457632,
          id: '5yj8do_LYnLHstT0tWjdu',
          invoker: 'https://app.uniswap.org',
          parentCapability: 'eth_accounts',
        },
      },
    ],
  };

  it('should render correctly', () => {
    const { getByTestId } = renderWithProvider(
      <PermissionDetailsModal {...args} />,
      store,
    );
    expect(getByTestId('permission-details-modal')).toBeInTheDocument();
  });

  it('should render account name correctly', () => {
    const { getByText } = renderWithProvider(
      <PermissionDetailsModal {...args} />,
      store,
    );
    expect(getByText('mockName')).toBeInTheDocument();
  });

  it('should fire onClick when Disconnect All button is clicked', () => {
    const { getByTestId } = renderWithProvider(
      <PermissionDetailsModal {...args} />,
      store,
    );
    const disconnectAllButton = getByTestId('disconnect');
    expect(disconnectAllButton).toBeInTheDocument();
    fireEvent.click(disconnectAllButton);
    expect(onClick).toHaveBeenCalled();
  });
});
