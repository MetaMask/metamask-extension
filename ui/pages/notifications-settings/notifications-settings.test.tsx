import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { BrowserRouter as Router } from 'react-router-dom';
import type { Store } from 'redux';
import thunk from 'redux-thunk';
import { MetamaskNotificationsProvider } from '../../contexts/metamask-notifications/metamask-notifications';
import NotificationsSettings from '.';

jest.mock('@metamask/controller-utils', () => ({
  ...jest.requireActual('@metamask/controller-utils'),
  toChecksumHexAddress: jest.fn().mockImplementation((address) => address),
}));

jest.mock('../../store/actions', () => ({
  showConfirmTurnOnMetamaskNotifications: jest.fn(
    () => () => Promise.resolve(),
  ),
  checkAccountsPresence: jest.fn(() => () => Promise.resolve()),
  showModal: jest.fn(() => () => Promise.resolve()),
  fetchAndUpdateMetamaskNotifications: jest.fn(() => () => Promise.resolve()),
}));

const middlewares = [thunk];
const mockStore = configureStore(middlewares);

const initialState = {
  metamask: {
    isMetamaskNotificationsEnabled: true,
    isSnapNotificationsEnabled: false,
    isFeatureAnnouncementsEnabled: true,
    isProfileSyncingEnabled: true,
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

describe('NotificationsSettings', () => {
  let store: Store;

  beforeEach(() => {
    store = mockStore(initialState);
    jest.clearAllMocks();
  });

  it('renders the notifications settings page', () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <MetamaskNotificationsProvider>
          <Router>
            <NotificationsSettings />
          </Router>
        </MetamaskNotificationsProvider>
      </Provider>,
    );

    expect(
      getByTestId('notifications-settings-allow-notifications'),
    ).toBeInTheDocument();
    expect(getByTestId('notifications-settings-per-types')).toBeInTheDocument();
    expect(
      getByTestId('notifications-settings-per-account'),
    ).toBeInTheDocument();
  });

  it('conditionally renders notification types and accounts based on the toggle state', () => {
    store = mockStore({
      ...initialState,
      metamask: {
        ...initialState.metamask,
        isMetamaskNotificationsEnabled: false,
        isProfileSyncingEnabled: false,
      },
    });

    const { queryByTestId } = render(
      <Provider store={store}>
        <MetamaskNotificationsProvider>
          <Router>
            <NotificationsSettings />
          </Router>
        </MetamaskNotificationsProvider>
      </Provider>,
    );

    expect(
      queryByTestId('notifications-settings-per-types'),
    ).not.toBeInTheDocument();
    expect(
      queryByTestId('notifications-settings-per-account'),
    ).not.toBeInTheDocument();
  });
});
