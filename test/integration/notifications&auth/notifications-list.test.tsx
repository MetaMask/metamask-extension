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
import { createMockNotificationPreferences } from '../../../ui/hooks/metamask-notifications/mocks';
import {
  ethSentNotification,
  featureNotification,
  getMockedNotificationsState,
} from './data/notification-state';

jest.mock('../../../ui/store/background-connection', () => ({
  ...jest.requireActual('../../../ui/store/background-connection'),
  submitRequestToBackground: jest.fn(),
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
      getNotificationPreferences: createMockNotificationPreferences(),
      ...mockRequests,
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

const clickByTestId = async (testId: string) => {
  const element = await screen.findByTestId(testId);
  await act(async () => {
    fireEvent.click(element);
  });
};

describe('Notifications List', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    setupSubmitRequestToBackgroundMocks();
  });

  afterEach(() => {
    window.location.hash = '#/'; // return to homescreen
  });

  it('should show the correct number of unread notifications on the badge', async () => {
    const mockedState = getStateWithTwoUnreadNotifications();

    await integrationTestRender({
      preloadedState: mockedState,
      backgroundConnection: backgroundConnectionMocked,
    });

    await waitFor(() => {
      expect(
        screen.getByTestId('notifications-tag-counter__unread-dot'),
      ).toHaveTextContent('2');
    });
  });

  it('should render notifications list and show correct details', async () => {
    const mockedState = getStateWithTwoUnreadNotifications();

    await integrationTestRender({
      preloadedState: {
        ...mockedState,
        completedMetaMetricsOnboarding: true,
        optedIn: true,
        dataCollectionForMarketing: false,
      },
      backgroundConnection: backgroundConnectionMocked,
    });

    await clickByTestId('account-options-menu-button');
    await clickByTestId('notifications-menu-item');

    const notificationsList = await screen.findByTestId('notifications-list');
    expect(notificationsList).toBeInTheDocument();

    await waitFor(() => {
      expect(notificationsList.childElementCount).toBe(3);
    });

    // Feature notification details
    expect(
      await within(notificationsList).findByText(
        featureNotification.data.title,
      ),
    ).toBeInTheDocument();
    expect(
      await within(notificationsList).findByText(
        featureNotification.data.shortDescription,
      ),
    ).toBeInTheDocument();

    // Eth sent notification details
    const sentToElement = await within(notificationsList).findByText('Sent to');
    expect(sentToElement).toBeInTheDocument();

    const addressElement = sentToElement.nextElementSibling;
    expect(addressElement).toHaveTextContent('0x881D4...D300D');

    // Read all button
    expect(
      await within(notificationsList).findByTestId(
        'notifications-list-read-all-button',
      ),
    ).toBeInTheDocument();

    expect(await screen.findAllByTestId('unread-dot')).toHaveLength(2);

    await waitFor(() => {
      const notificationsInteractionsEvent =
        mockedBackgroundConnection.submitRequestToBackground.mock.calls?.find(
          (call) =>
            call[0] === 'trackAnalyticsEvent' &&
            call[1]?.[0]?.properties?.category ===
              MetaMetricsEventCategory.NotificationInteraction,
        );

      expect(notificationsInteractionsEvent?.[0]).toBe('trackAnalyticsEvent');
      const [metricsEvent] = notificationsInteractionsEvent?.[1] as unknown as [
        {
          name: string;
          properties: Record<string, unknown>;
        },
      ];

      expect(metricsEvent?.name).toBe(
        MetaMetricsEventName.NotificationsMenuOpened,
      );

      expect(metricsEvent?.properties?.category).toBe(
        MetaMetricsEventCategory.NotificationInteraction,
      );

      expect(metricsEvent.properties).toMatchObject({
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        unread_count: 2,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        read_count: 0,
      });
    });
  });

  it('should not see mark all as read button if there are no unread notifications', async () => {
    const mockedState = getMockedNotificationsState(); // all notifications are read by default

    await integrationTestRender({
      preloadedState: mockedState,
      backgroundConnection: backgroundConnectionMocked,
    });

    await clickByTestId('account-options-menu-button');
    await clickByTestId('notifications-menu-item');

    const notificationsList = await screen.findByTestId('notifications-list');
    expect(notificationsList).toBeInTheDocument();

    await waitFor(() => {
      expect(notificationsList.childElementCount).toBe(2);
      expect(
        screen.queryByTestId('notifications-list-read-all-button'),
      ).not.toBeInTheDocument();
      expect(screen.queryAllByTestId('unread-dot')).toHaveLength(0);
    });
  });

  it('should send request for marking notifications as read to the background with the correct params', async () => {
    const mockedState = getStateWithTwoUnreadNotifications();
    await integrationTestRender({
      preloadedState: mockedState,
      backgroundConnection: backgroundConnectionMocked,
    });

    await clickByTestId('account-options-menu-button');
    await clickByTestId('notifications-menu-item');
    await clickByTestId('notifications-list-read-all-button');

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
