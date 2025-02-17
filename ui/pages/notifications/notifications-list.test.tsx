import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter as Router } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { MetamaskNotificationsProvider } from '../../contexts/metamask-notifications/metamask-notifications';
import { NotificationsList } from './notifications-list';
import { TAB_KEYS } from './notifications';

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
    isProfileSyncingEnabled: true,
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
    render(
      <Provider store={store}>
        <Router>
          <MetamaskNotificationsProvider>
            <NotificationsList
              activeTab={TAB_KEYS.ALL}
              notifications={[]}
              isLoading={false}
              isError={false}
              notificationsCount={0}
            />
          </MetamaskNotificationsProvider>
        </Router>
      </Provider>,
    );

    expect(screen.getByTestId('notifications-list')).toBeInTheDocument();
  });
});
