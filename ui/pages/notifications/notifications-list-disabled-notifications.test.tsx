import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { NOTIFICATIONS_SETTINGS_ROUTE } from '../../helpers/constants/routes';
import { NotificationsListDisabledNotifications } from './notifications-list-disabled-notifications';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('NotificationsListDisabledNotifications', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders correctly', () => {
    render(<NotificationsListDisabledNotifications />);

    expect(
      screen.getByTestId('notifications-list-disabled-notifications'),
    ).toBeInTheDocument();
  });

  it('navigates to notifications settings when cta is clicked', () => {
    render(<NotificationsListDisabledNotifications />);

    fireEvent.click(screen.getByRole('button'));

    expect(mockNavigate).toHaveBeenCalledWith(NOTIFICATIONS_SETTINGS_ROUTE);
  });
});
