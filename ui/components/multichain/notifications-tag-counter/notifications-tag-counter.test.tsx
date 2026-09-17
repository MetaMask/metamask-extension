import React from 'react';
import { render, screen } from '@testing-library/react';
import { NotificationsTagCounter } from './notifications-tag-counter';

const mockUnreadCount = jest.fn().mockReturnValue(0);

jest.mock('../../../hooks/metamask-notifications/useCounter', () => ({
  useUnreadNotificationsCounter: () => ({
    notificationsUnreadCount: mockUnreadCount(),
  }),
}));

describe('NotificationsTagCounter', () => {
  describe('with a label', () => {
    it('renders the unread count', () => {
      mockUnreadCount.mockReturnValue(3);
      render(<NotificationsTagCounter />);

      expect(
        screen.getByTestId('global-menu-notification-count'),
      ).toHaveTextContent('3');
    });

    it('caps the unread count at 9+', () => {
      mockUnreadCount.mockReturnValue(10);
      render(<NotificationsTagCounter />);

      expect(
        screen.getByTestId('global-menu-notification-count'),
      ).toHaveTextContent('9+');
    });
  });

  describe('without a label', () => {
    it('renders the unread count', () => {
      mockUnreadCount.mockReturnValue(3);
      render(<NotificationsTagCounter noLabel />);

      expect(
        screen.getByTestId('notifications-tag-counter__unread-dot'),
      ).toHaveTextContent('3');
    });

    it('caps the unread count at 9+', () => {
      mockUnreadCount.mockReturnValue(10);
      render(<NotificationsTagCounter noLabel />);

      expect(
        screen.getByTestId('notifications-tag-counter__unread-dot'),
      ).toHaveTextContent('9+');
    });
  });

  it('renders nothing when there are no unread notifications', () => {
    mockUnreadCount.mockReturnValue(0);
    const { container } = render(<NotificationsTagCounter noLabel />);

    expect(container).toBeEmptyDOMElement();
  });
});
