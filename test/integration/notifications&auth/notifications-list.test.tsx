import {
  act,
  fireEvent,
  waitFor,
  within,
  screen,
} from '@testing-library/react';
import { integrationTestRender } from '../../lib/render-helpers';
import * as backgroundConnection from '../../../ui/store/background-connection';
import { createMockImplementation } from '../helpers';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import {
  ethSentNotification,
  featureNotification,
  getMockedNotificationsState,
} from './data/notification-state';

jest.mock('../../../ui/store/background-connection', () => ({
  ...jest.requireActual('../../../ui/store/background-connection'),
  submitRequestToBackground: jest.fn(),
  callBackgroundMethod: jest.fn(),
}));

const backgroundConnectionMocked = {
  onNotification: jest.fn(),
};

const mockedBackgroundConnection = jest.mocked(backgroundConnection);

const setupSubmitRequestToBackgroundMocks = (
  mockRequests?: Record<string, unknown>,
) => {
  mockedBackgroundConnection.submitRequestToBackground.mockImplementation(
    createMockImplementation({
      ...(mockRequests ?? {}),
    }),
  );
};

const getStateWithTwoUnreadNotifications = () => {
  const state = getMockedNotificationsState();
  return {
    ...state,
    metamaskNotificationsList: [
      {
        ...state.metamaskNotificationsList[0],
        isRead: false,
      },
      {
        ...state.metamaskNotificationsList[1],
        isRead: false,
      },
    ],
  };
};

describe('Notifications List', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    setupSubmitRequestToBackgroundMocks();
  });

  afterEach(() => {
    window.history.pushState({}, '', '/'); // return to homescreen
  });

  it('should show the correct number of unread notifications on the badge', async () => {
    const mockedState = getStateWithTwoUnreadNotifications();

    await act(async () => {
      await integrationTestRender({
        preloadedState: mockedState,
        backgroundConnection: backgroundConnectionMocked,
      });
    });

    await waitFor(() => {
      const unreadCount = screen.getByTestId(
        'notifications-tag-counter__unread-dot',
      );
      expect(unreadCount).toBeInTheDocument();
      expect(unreadCount).toHaveTextContent('2');
    });
  });

  it('should render notifications list and show correct details', async () => {
    const mockedState = getStateWithTwoUnreadNotifications();

    await act(async () => {
      await integrationTestRender({
        preloadedState: mockedState,
        backgroundConnection: backgroundConnectionMocked,
      });
    });

    fireEvent.click(screen.getByTestId('account-options-menu-button'));

    await waitFor(() => {
      expect(screen.getByTestId('notifications-menu-item')).toBeInTheDocument();
      fireEvent.click(screen.getByTestId('notifications-menu-item'));
    });

    await waitFor(() => {
      const notificationsList = screen.getByTestId('notifications-list');
      expect(notificationsList).toBeInTheDocument();
      expect(notificationsList.childElementCount).toBe(3);

      // Feature notification details
      expect(
        within(notificationsList).getByText(featureNotification.data.title),
      ).toBeInTheDocument();
      expect(
        within(notificationsList).getByText(
          featureNotification.data.shortDescription,
        ),
      ).toBeInTheDocument();

      // Eth sent notification details
      const sentToElement = within(notificationsList).getByText('Sent to');
      expect(sentToElement).toBeInTheDocument();

      const addressElement = sentToElement.nextElementSibling;
      expect(addressElement).toHaveTextContent('0x881D4...D300D');

      // Read all button
      expect(
        within(notificationsList).getByTestId(
          'notifications-list-read-all-button',
        ),
      ).toBeInTheDocument();

      const unreadDot = screen.getAllByTestId('unread-dot');
      expect(unreadDot).toHaveLength(2);
    });

    await waitFor(() => {
      const notificationsInteractionsEvent =
        mockedBackgroundConnection.submitRequestToBackground.mock.calls?.find(
          (call) =>
            call[0] === 'trackMetaMetricsEvent' &&
            call[1]?.[0].category ===
              MetaMetricsEventCategory.NotificationInteraction,
        );

      expect(notificationsInteractionsEvent?.[0]).toBe('trackMetaMetricsEvent');
      const [metricsEvent] = notificationsInteractionsEvent?.[1] as unknown as [
        {
          event: string;
          category: string;
          properties: Record<string, unknown>;
        },
      ];

      expect(metricsEvent?.event).toBe(
        MetaMetricsEventName.NotificationsMenuOpened,
      );

      expect(metricsEvent?.category).toBe(
        MetaMetricsEventCategory.NotificationInteraction,
      );

      expect(metricsEvent.properties).toMatchObject({
        unread_count: 2,
        read_count: 0,
      });
    });
  });

  it('should not see mark all as read button if there are no unread notifications', async () => {
    const mockedState = getMockedNotificationsState(); // all notifications are read by default

    await act(async () => {
      await integrationTestRender({
        preloadedState: mockedState,
        backgroundConnection: backgroundConnectionMocked,
      });

      fireEvent.click(screen.getByTestId('account-options-menu-button'));

      await waitFor(() => {
        expect(
          screen.getByTestId('notifications-menu-item'),
        ).toBeInTheDocument();
        fireEvent.click(screen.getByTestId('notifications-menu-item'));
      });

      await waitFor(() => {
        const notificationsList = screen.getByTestId('notifications-list');
        expect(notificationsList).toBeInTheDocument();

        expect(notificationsList.childElementCount).toBe(2);

        expect(
          screen.queryByTestId('notifications-list-read-all-button'),
        ).not.toBeInTheDocument();

        expect(screen.queryAllByTestId('unread-dot')).toHaveLength(0);
      });
    });
  });

  it('should send request for marking notifications as read to the background with the correct params', async () => {
    const mockedState = getStateWithTwoUnreadNotifications();
    await act(async () => {
      await integrationTestRender({
        preloadedState: mockedState,
        backgroundConnection: backgroundConnectionMocked,
      });
    });

    fireEvent.click(screen.getByTestId('account-options-menu-button'));

    await waitFor(() => {
      expect(screen.getByTestId('notifications-menu-item')).toBeInTheDocument();
      fireEvent.click(screen.getByTestId('notifications-menu-item'));
    });

    fireEvent.click(screen.getByTestId('notifications-list-read-all-button'));

    await waitFor(() => {
      const markAllAsReadEvent =
        mockedBackgroundConnection.submitRequestToBackground.mock.calls?.find(
          (call) => call[0] === 'markMetamaskNotificationsAsRead',
        );

      expect(markAllAsReadEvent?.[0]).toBe('markMetamaskNotificationsAsRead');
      expect(markAllAsReadEvent?.[1]).toStrictEqual([
        [
          {
            id: featureNotification.id,
            type: featureNotification.type,
            isRead: false,
          },
          {
            id: ethSentNotification.id,
            type: ethSentNotification.type,
            isRead: false,
          },
        ],
      ]);
    });
  });
});
