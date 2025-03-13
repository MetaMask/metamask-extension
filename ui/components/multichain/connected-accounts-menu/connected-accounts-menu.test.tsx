import React from 'react';
import { fireEvent } from '@testing-library/react';
import { EthAccountType, EthMethod } from '@metamask/keyring-api';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { createMockInternalAccount } from '../../../../test/jest/mocks';
import { ConnectedAccountsMenu } from '.';

const mockInternalAccount = createMockInternalAccount();

const DEFAULT_PROPS = {
  isOpen: true,
  onClose: jest.fn(),
  account: {
    ...mockInternalAccount,
    balance: '0x123',
    label: mockInternalAccount.metadata.name,
  },
  anchorElement: null,
  disableAccountSwitcher: false,
  onActionClick: jest.fn(),
  activeTabOrigin: 'metamask.github.io',
};

const renderComponent = (props = {}, stateChanges = {}) => {
  const store = configureStore({
    ...mockState,
    ...stateChanges,
    activeTab: {
      origin: 'https://remix.ethereum.org',
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
            'endowment:caip25': {
              caveats: [
                {
                  type: 'authorizedScopes',
                  value: {
                    requiredScopes: {},
                    optionalScopes: {
                      'eip155:1': {
                        accounts: [
                          'eip155:1:0x8e5d75d60224ea0c33d0041e75de68b1c3cb6dd5',
                          'eip155:1:0x7250739de134d33ec7ab1ee592711e15098c9d2d',
                        ],
                      },
                    },
                    isMultichainOrigin: false,
                  },
                },
              ],
              date: 1586359844177,
              id: '3aa65a8b-3bcb-4944-941b-1baa5fe0ed8b',
              invoker: 'https://remix.ethereum.org',
              parentCapability: 'endowment:caip25',
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
  });
  document.body.innerHTML = '<div id="anchor"></div>';
  const anchorElement = document.getElementById('anchor');
  return renderWithProvider(
    <ConnectedAccountsMenu
      {...DEFAULT_PROPS}
      {...props}
      anchorElement={anchorElement}
    />,
    store,
  );
};

describe('ConnectedAccountsMenu', () => {
  it('renders permission details menu item', async () => {
    const { getByTestId } = renderComponent();
    expect(getByTestId('permission-details-menu-item')).toBeInTheDocument();
  });

  it('renders switch to this account menu item if account switcher is enabled', async () => {
    const { getByTestId } = renderComponent();
    expect(getByTestId('switch-account-menu-item')).toBeInTheDocument();
  });

  it('does not render switch to this account menu item if account switcher is disabled', async () => {
    const { queryByTestId } = renderComponent({ disableAccountSwitcher: true });
    expect(queryByTestId('switch-account-menu-item')).toBeNull();
  });

  it('renders disconnect menu item', async () => {
    const { getByTestId } = renderComponent();
    expect(getByTestId('disconnect-menu-item')).toBeInTheDocument();
  });

  it('closes the menu on tab key down when focus is within the menu', async () => {
    const onClose = jest.fn();
    const { getByTestId } = renderComponent({ onClose });
    const menu = getByTestId('permission-details-menu-item');
    fireEvent.keyDown(menu, { key: 'Tab' });
    expect(onClose).toHaveBeenCalled();
  });
});
