import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { MetamaskNotificationsProvider } from '../../contexts/metamask-notifications/metamask-notifications';
import { NotificationsListTurnOnNotifications } from './notifications-list-turn-on-notifications';

const initialState = {
  metamask: {
    theme: 'light',
    isMetamaskNotificationsEnabled: true,
    isFeatureAnnouncementsEnabled: true,
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
};

const middlewares = [thunk];
const mockStore = configureStore(middlewares);
const store = mockStore(initialState);

describe('NotificationsListTurnOnNotifications', () => {
  it('renders correctly', () => {
    render(
      <Provider store={store}>
        <MetamaskNotificationsProvider>
          <NotificationsListTurnOnNotifications />
        </MetamaskNotificationsProvider>
      </Provider>,
    );
    expect(
      screen.getByTestId('notifications-list-turn-on-notifications'),
    ).toBeInTheDocument();
  });
});
