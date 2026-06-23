import React from 'react';
import { fireEvent } from '@testing-library/react';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import mockState from '../../../test/data/mock-state.json';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import Notifications from './notifications';

const mockDispatch = jest.fn();
const mockNavigate = jest.fn();

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => mockDispatch,
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('./notifications-list', () => ({
  __esModule: true,
  TAB_KEYS: { ALL: 'all', WALLET: 'wallet', WEB3: 'web3' },
  NotificationsList: () => null,
}));

jest.mock('./NewFeatureTag', () => ({
  __esModule: true,
  NewFeatureTag: () => null,
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
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders correctly', () => {
    const { getByTestId } = renderWithProvider(<Notifications />, store);

    expect(getByTestId('notifications-page')).toBeInTheDocument();
  });

  it('navigates back to the originating route from the `from` query param', () => {
    const { getByTestId } = renderWithProvider(
      <Notifications />,
      store,
      `/notifications?from=${encodeURIComponent(DEFAULT_ROUTE)}`,
    );

    fireEvent.click(getByTestId('back-button'));

    // Must navigate to the explicit pathname, not history (-1), so the
    // auto-lock + unlock cycle can't strand the user on /unlock.
    expect(mockNavigate).toHaveBeenCalledWith(DEFAULT_ROUTE);
  });

  it('falls back to DEFAULT_ROUTE when no `from` query param is present', () => {
    const { getByTestId } = renderWithProvider(
      <Notifications />,
      store,
      '/notifications',
    );

    fireEvent.click(getByTestId('back-button'));

    expect(mockNavigate).toHaveBeenCalledWith(DEFAULT_ROUTE);
  });
});
