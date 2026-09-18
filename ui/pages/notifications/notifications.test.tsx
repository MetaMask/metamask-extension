import React from 'react';
import { waitFor } from '@testing-library/react';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import mockState from '../../../test/data/mock-state.json';
import { deleteExpiredNotifications } from '../../store/actions';
import Notifications from './notifications';

const mockDispatch = jest.fn();
const mockUseNotificationListPerformance = jest.fn();

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

jest.mock(
  '../../selectors/metamask-notifications/metamask-notifications',
  () => ({
    ...jest.requireActual(
      '../../selectors/metamask-notifications/metamask-notifications',
    ),
    getIsUpdatingMetamaskNotifications: () => false,
    isFetchingMetamaskNotifications: () => false,
  }),
);

jest.mock(
  '../../hooks/metamask-notifications/useNotificationListPerformance',
  () => ({
    useNotificationListPerformance: (...args: unknown[]) =>
      mockUseNotificationListPerformance(...args),
  }),
);

jest.mock('./notifications-list', () => ({
  TAB_KEYS: {
    ALL: 'all',
    WALLET: 'wallet',
    WEB3: 'web3',
  },
  NotificationsList: () => <div data-testid="notifications-list" />,
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

  it('renders correctly', async () => {
    const { getByTestId } = renderWithProvider(<Notifications />, store);

    expect(getByTestId('notifications-page')).toBeInTheDocument();
    await waitFor(() => {
      expect(mockUseNotificationListPerformance).toHaveBeenCalledWith(
        expect.objectContaining({
          enabled: expect.any(Boolean),
          isPending: false,
          notificationCount: expect.any(Number),
        }),
      );
    });
  });

  it('dispatches deleteExpiredNotifications on mount', async () => {
    renderWithProvider(<Notifications />, store);

    await waitFor(() => {
      expect(deleteExpiredNotifications).toHaveBeenCalledTimes(1);
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'MOCK_DELETE_EXPIRED_NOTIFICATIONS',
      });
      expect(mockUseNotificationListPerformance).toHaveBeenCalledWith(
        expect.objectContaining({ isPending: false }),
      );
    });
  });
});
