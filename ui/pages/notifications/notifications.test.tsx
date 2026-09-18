import React from 'react';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import mockState from '../../../test/data/mock-state.json';
import { deleteExpiredNotifications } from '../../store/actions';
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
  deleteExpiredNotifications: jest.fn(() => ({
    type: 'MOCK_DELETE_EXPIRED_NOTIFICATIONS',
  })),
  getNotificationPreferences: jest.fn(() => () => Promise.resolve(null)),
}));

const initialState = {
  metamask: {
    ...mockState.metamask,
    theme: 'light',
    isMetamaskNotificationsEnabled: true,
    isFeatureAnnouncementsEnabled: false,
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
  beforeEach(() => {
    mockDispatch.mockClear();
    (deleteExpiredNotifications as jest.Mock).mockClear();
  });

  it('renders correctly', () => {
    const { getByTestId } = renderWithProvider(<Notifications />, store);

    expect(getByTestId('notifications-page')).toBeInTheDocument();
  });

  it('dispatches deleteExpiredNotifications on mount', () => {
    renderWithProvider(<Notifications />, store);

    expect(deleteExpiredNotifications).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'MOCK_DELETE_EXPIRED_NOTIFICATIONS',
    });
  });
});
