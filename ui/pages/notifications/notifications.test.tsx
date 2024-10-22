import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../test/data/mock-state.json';
import Notifications from './notifications';

const mockDispatch = jest.fn();

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => mockDispatch,
}));

jest.mock(
  '../../contexts/metamask-notifications/metamask-notifications',
  () => ({
    useMetamaskNotificationsContext: () => ({
      listNotifications: jest.fn(),
      isLoading: false,
      error: null,
    }),
  }),
);

jest.mock('../../store/actions', () => ({
  ...jest.requireActual('../../store/actions'),
  markMetamaskNotificationsAsRead: jest.fn(),
}));

const initialState = {
  metamask: {
    ...mockState.metamask,
    theme: 'light',
    isMetamaskNotificationsEnabled: true,
    isFeatureAnnouncementsEnabled: true,
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
};

const middlewares = [thunk];
const mockStore = configureStore(middlewares);
const store = mockStore(initialState);

describe('Notifications Component', () => {
  it('renders correctly', () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <MemoryRouter>
          <Notifications />
        </MemoryRouter>
      </Provider>,
    );

    expect(getByTestId('notifications-page')).toBeInTheDocument();
  });

  it('navigates to default route on back button click', () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <MemoryRouter>
          <Notifications />
        </MemoryRouter>
      </Provider>,
    );

    fireEvent.click(getByTestId('back-button'));
  });

  it('navigates to settings on settings button click', () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <MemoryRouter>
          <Notifications />
        </MemoryRouter>
      </Provider>,
    );

    fireEvent.click(getByTestId('notifications-settings-button'));
  });
});
