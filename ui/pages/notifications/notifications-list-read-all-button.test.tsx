import React from 'react';
import { fireEvent } from '@testing-library/react';
import { createMockNotificationEthSent } from '@metamask/notification-services-controller/notification-services/mocks';
import { processNotification } from '@metamask/notification-services-controller/notification-services';

import * as UseNotificationModule from '../../hooks/metamask-notifications/useNotifications';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import configureStore from '../../store/store';
import mockState from '../../../test/data/mock-state.json';
import { NotificationsListReadAllButton } from './notifications-list-read-all-button';

const mockNotification = (isRead: boolean) => {
  const n = processNotification(createMockNotificationEthSent());
  n.isRead = isRead;
  return n;
};

describe('NotificationsListReadAllButton', () => {
  const store = configureStore(mockState);

  it('renders correctly and handles click', () => {
    const { getByTestId } = renderWithProvider(
      <NotificationsListReadAllButton notifications={[]} />,
      store,
    );

    const button = getByTestId('notifications-list-read-all-button');
    expect(button).toBeInTheDocument();
  });

  it('presses and marks all unread notifications as read', async () => {
    const mockMarkAsReadCallback = jest.fn();
    jest
      .spyOn(UseNotificationModule, 'useMarkNotificationAsRead')
      .mockReturnValue({ markNotificationAsRead: mockMarkAsReadCallback });

    const notificationList = [
      mockNotification(true),
      mockNotification(false),
      mockNotification(false),
      mockNotification(false),
      mockNotification(true),
    ];

    const { getByTestId } = renderWithProvider(
      <NotificationsListReadAllButton notifications={notificationList} />,
      store,
    );

    const button = getByTestId('notifications-list-read-all-button');
    fireEvent.click(button);

    expect(mockMarkAsReadCallback).toHaveBeenCalled();
    const mockCall = mockMarkAsReadCallback.mock.lastCall[0];
    expect(mockCall.length).toBe(3); // 3 unread notifications sent
  });
});
