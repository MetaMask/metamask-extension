import React from 'react';
import { fireEvent, screen, within } from '@testing-library/react';
import {
  processNotification,
  TRIGGER_TYPES,
  type INotification,
} from '@metamask/notification-services-controller/notification-services';
import { createMockNotificationEthSent } from '@metamask/notification-services-controller/notification-services/mocks';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import { NOTIFICATIONS_ROUTE } from '../../helpers/constants/routes';
import { NotificationComponents } from './notification-components';
import { NotificationsListItem } from './notifications-list-item';

const mockNavigate = jest.fn();
const mockTrackEvent = jest.fn();
const mockMarkNotificationAsRead = jest.fn();
const apiTemplate = {
  title: 'Localized API title',
  body: 'Localized API description',
};

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../../hooks/useAnalytics', () => {
  const { createEventBuilder } = jest.requireActual(
    '../../../shared/lib/analytics/create-event-builder',
  );

  return {
    useAnalytics: () => ({
      trackEvent: mockTrackEvent,
      createEventBuilder,
    }),
  };
});

jest.mock('../../hooks/metamask-notifications/useNotifications', () => ({
  useMarkNotificationAsRead: () => ({
    markNotificationAsRead: mockMarkNotificationAsRead,
  }),
}));

jest.mock('../../hooks/useNotificationTimeouts', () => ({
  useSnapNotificationTimeouts: () => ({
    setNotificationTimeout: jest.fn(),
  }),
}));

describe('NotificationsListItem', () => {
  const notification = {
    ...processNotification(createMockNotificationEthSent()),
    template: apiTemplate,
    isRead: false,
  } as Extract<INotification, { type: TRIGGER_TYPES.ETH_SENT }>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders wallet activity copy from the API template', () => {
    renderWithProvider(<NotificationsListItem notification={notification} />);

    expect(screen.getByText(apiTemplate.title)).toBeInTheDocument();
    expect(screen.getByText(apiTemplate.body)).toBeInTheDocument();
  });

  it('renders the notification details title from the API template', () => {
    const DetailsTitle =
      NotificationComponents[notification.type].details?.title;

    if (!DetailsTitle) {
      throw new Error('Expected notification details title');
    }

    renderWithProvider(<DetailsTitle notification={notification} />);

    expect(screen.getByText(apiTemplate.title)).toBeInTheDocument();
  });

  it('tracks Notification Clicked when the notification item is clicked', () => {
    renderWithProvider(<NotificationsListItem notification={notification} />);

    const notificationListItem = screen.getByTestId(
      `notification-list-item-${notification.id}`,
    );
    fireEvent.click(within(notificationListItem).getByRole('button'));

    expect(mockTrackEvent).toHaveBeenCalledTimes(1);
    expect(mockTrackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: MetaMetricsEventName.NotificationClicked,
        properties: expect.objectContaining({
          category: MetaMetricsEventCategory.NotificationInteraction,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          /* eslint-disable @typescript-eslint/naming-convention */
          notification_id: notification.id,
          notification_type: 'wallet_activity',
          notification_subtype: 'eth_sent',
          chain_id: notification.payload.chain_id,
          /* eslint-enable @typescript-eslint/naming-convention */
        }),
      }),
    );
    expect(mockMarkNotificationAsRead).toHaveBeenCalledWith([
      {
        id: notification.id,
        type: notification.type,
        isRead: false,
      },
    ]);
    expect(mockNavigate).toHaveBeenCalledWith(
      `${NOTIFICATIONS_ROUTE}/${notification.id}`,
    );
  });
});
