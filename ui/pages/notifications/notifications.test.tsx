import React from 'react';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import mockState from '../../../test/data/mock-state.json';
import Notifications from './notifications';

const mockDispatch = jest.fn();
const mockNavigate = jest.fn();

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => mockDispatch,
}));

jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'),
  useNavigate: () => mockNavigate,
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
  confirmTransaction: {
    txData: {},
  },
};

const middlewares = [thunk];
const mockStore = configureStore(middlewares);
const store = mockStore(initialState);

describe('Notifications Component', () => {
  it('renders correctly', () => {
    const { getByTestId } = renderWithProvider(<Notifications />, store);

    expect(getByTestId('notifications-page')).toBeInTheDocument();
  });
});
