import React from 'react';
import { screen } from '@testing-library/react';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import { NotificationsList, TAB_KEYS } from './notifications-list';

jest.mock('../../store/actions', () => ({
  deleteExpiredSnapNotifications: jest.fn(() => () => Promise.resolve()),
  fetchAndUpdateMetamaskNotifications: jest.fn(() => () => Promise.resolve()),
}));

const middlewares = [thunk];
const mockStore = configureStore(middlewares);
const store = mockStore({
  metamask: {
    isMetamaskNotificationsEnabled: true,
    isFeatureAnnouncementsEnabled: true,
    isBackupAndSyncEnabled: true,
    metamaskNotifications: [],
    internalAccounts: {
      accounts: [
        {
          address: '0x123',
          id: 'account1',
          metadata: {},
          options: {},
          methods: [],
          type: 'eip155:eoa',
          balance: '100',
          keyring: { type: 'type1' },
          label: 'Account 1',
        },
      ],
    },
  },
});

describe('NotificationsList', () => {
  it('renders the notifications list page', () => {
    renderWithProvider(
      <NotificationsList
        activeTab={TAB_KEYS.ALL}
        notifications={[]}
        isLoading={false}
        isError={false}
        notificationsCount={0}
      />,
      store,
    );

    expect(screen.getByTestId('notifications-list')).toBeInTheDocument();
  });
});
