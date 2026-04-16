import React from 'react';
import { screen } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import { useAccountSettingsProps } from '../../hooks/metamask-notifications/useSwitchNotifications';
import { NotificationsSettingsContent } from './notifications-settings';

jest.mock('./notifications-settings-allow-notifications', () => ({
  NotificationsSettingsAllowNotifications: () => (
    <div data-testid="notifications-settings-allow" />
  ),
}));

jest.mock('./notifications-settings-types', () => ({
  NotificationsSettingsTypes: () => (
    <div data-testid="notifications-settings-types" />
  ),
}));

jest.mock('./notifications-settings-per-account', () => ({
  NotificationsSettingsPerAccount: ({
    address,
    name,
  }: {
    address: string;
    name: string;
  }) => (
    <div data-testid={`notifications-settings-account-${address}`}>{name}</div>
  ),
}));

jest.mock('../../hooks/metamask-notifications/useSwitchNotifications', () => ({
  useAccountSettingsProps: jest.fn(),
}));

const mockStore = configureMockStore([thunk]);

const createInternalAccount = ({
  id,
  address,
  type,
  name,
}: {
  id: string;
  address: string;
  type: string;
  name: string;
}) => ({
  id,
  address,
  type,
  options: {},
  methods: [],
  metadata: {
    name,
    keyring: {},
    importTime: 0,
  },
  scopes: ['eip155:1'],
});

describe('NotificationsSettingsContent', () => {
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleWarnSpy = jest
      .spyOn(console, 'warn')
      .mockImplementation(() => undefined);
    jest.mocked(useAccountSettingsProps).mockReturnValue({
      data: {},
      initialLoading: false,
      error: null,
      accountsBeingUpdated: [],
      update: jest.fn(),
    });
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
    jest.clearAllMocks();
  });

  it('renders notification accounts grouped by wallet', () => {
    const account1 = createInternalAccount({
      id: 'account-1',
      address: '0x1111111111111111111111111111111111111111',
      type: 'eip155:eoa',
      name: 'Account 1',
    });
    const account2 = createInternalAccount({
      id: 'account-2',
      address: '0x2222222222222222222222222222222222222222',
      type: 'eip155:eoa',
      name: 'Account 2',
    });
    const account3 = createInternalAccount({
      id: 'account-3',
      address: '0x3333333333333333333333333333333333333333',
      type: 'eip155:eoa',
      name: 'Imported 1',
    });
    const nonEvmAccount = createInternalAccount({
      id: 'account-4',
      address: 'SolanaAddress222222222222222222222222222222',
      type: 'solana:data-account',
      name: 'Imported 2',
    });

    const store = mockStore({
      metamask: {
        isNotificationServicesEnabled: true,
        isUpdatingMetamaskNotifications: false,
        isUpdatingMetamaskNotificationsAccount: [],
        subscriptionAccountsSeen: [
          account1.address,
          account2.address,
          account3.address,
        ],
        accountTree: {
          selectedAccountGroup: 'entropy:wallet-1/0',
          wallets: {
            'entropy:wallet-1': {
              id: 'entropy:wallet-1',
              type: 'entropy',
              metadata: { name: 'Wallet 1' },
              groups: {
                'entropy:wallet-1/0': {
                  id: 'entropy:wallet-1/0',
                  type: 'multichain-account',
                  metadata: {
                    name: 'Account 1',
                    pinned: false,
                    hidden: false,
                  },
                  accounts: [account1.id],
                },
                'entropy:wallet-1/1': {
                  id: 'entropy:wallet-1/1',
                  type: 'multichain-account',
                  metadata: {
                    name: 'Account 2',
                    pinned: false,
                    hidden: false,
                  },
                  accounts: [account2.id],
                },
              },
            },
            'keyring:wallet-2': {
              id: 'keyring:wallet-2',
              type: 'keyring',
              metadata: { name: 'Imported wallet' },
              groups: {
                'keyring:wallet-2/0': {
                  id: 'keyring:wallet-2/0',
                  type: 'multichain-account',
                  metadata: {
                    name: 'Imported 1',
                    pinned: false,
                    hidden: false,
                  },
                  accounts: [account3.id],
                },
                'keyring:wallet-2/1': {
                  id: 'keyring:wallet-2/1',
                  type: 'multichain-account',
                  metadata: {
                    name: 'Imported 2',
                    pinned: false,
                    hidden: false,
                  },
                  accounts: [nonEvmAccount.id],
                },
              },
            },
          },
        },
        internalAccounts: {
          selectedAccount: account1.id,
          accounts: {
            [account1.id]: account1,
            [account2.id]: account2,
            [account3.id]: account3,
            [nonEvmAccount.id]: nonEvmAccount,
          },
        },
      },
    });

    renderWithProvider(<NotificationsSettingsContent />, store);

    expect(
      screen.getByTestId('notifications-settings-per-account'),
    ).toBeInTheDocument();
    expect(screen.getByText('Wallet 1')).toBeInTheDocument();
    expect(screen.getByText('Imported wallet')).toBeInTheDocument();
    expect(
      screen.getByTestId(
        'notifications-settings-account-0x1111111111111111111111111111111111111111',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(
        'notifications-settings-account-0x2222222222222222222222222222222222222222',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(
        'notifications-settings-account-0x3333333333333333333333333333333333333333',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText('Imported 2')).not.toBeInTheDocument();
  });

  it('hides the account section when there are no notification-eligible accounts', () => {
    const account = createInternalAccount({
      id: 'account-1',
      address: '0x1111111111111111111111111111111111111111',
      type: 'eip155:eoa',
      name: 'Account 1',
    });

    const store = mockStore({
      metamask: {
        isNotificationServicesEnabled: true,
        isUpdatingMetamaskNotifications: false,
        isUpdatingMetamaskNotificationsAccount: [],
        subscriptionAccountsSeen: [],
        accountTree: {
          selectedAccountGroup: 'entropy:wallet-1/0',
          wallets: {
            'entropy:wallet-1': {
              id: 'entropy:wallet-1',
              type: 'entropy',
              metadata: { name: 'Wallet 1' },
              groups: {
                'entropy:wallet-1/0': {
                  id: 'entropy:wallet-1/0',
                  type: 'multichain-account',
                  metadata: {
                    name: 'Account 1',
                    pinned: false,
                    hidden: false,
                  },
                  accounts: [account.id],
                },
              },
            },
          },
        },
        internalAccounts: {
          selectedAccount: account.id,
          accounts: {
            [account.id]: account,
          },
        },
      },
    });

    renderWithProvider(<NotificationsSettingsContent />, store);

    expect(
      screen.queryByTestId('notifications-settings-per-account'),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Wallet 1')).not.toBeInTheDocument();
  });
});
