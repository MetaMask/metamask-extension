import React from 'react';
import { useAppSelector } from '../../store/store';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import { NOTIFICATIONS_ROUTE } from '../../helpers/constants/routes';
import NotificationDetails from './notification-details';

const configureStore = jest.requireActual('../../store/store').default;

const mockUseNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockUseNavigate,
}));

jest.mock('../../store/store', () => {
  const actual = jest.requireActual('../../store/store');
  return {
    ...actual,
    useAppSelector: jest.fn(),
  };
});

jest.mock('../../hooks/metamask-notifications/useNotifications', () => ({
  useMarkNotificationAsRead: () => ({
    markNotificationAsRead: jest.fn(),
  }),
}));

jest.mock('../../hooks/useNotificationTimeouts', () => ({
  useSnapNotificationTimeouts: () => ({
    setNotificationTimeout: jest.fn(),
  }),
}));

describe('NotificationDetails', () => {
  beforeEach(() => {
    mockUseNavigate.mockClear();
    jest.mocked(useAppSelector).mockReturnValue(undefined);
  });

  it('navigates to the notifications list when the notification is not found', () => {
    const store = configureStore({});

    renderWithProvider(
      <NotificationDetails />,
      store,
      `${NOTIFICATIONS_ROUTE}/missing-id`,
    );

    expect(mockUseNavigate).toHaveBeenCalledWith(NOTIFICATIONS_ROUTE);
    expect(useAppSelector).toHaveBeenCalled();
  });
});
