import { integrationTestRender } from '../../lib/render-helpers';
import * as backgroundConnection from '../../../ui/store/background-connection';
import {
  act,
  fireEvent,
  waitFor,
  within,
  screen,
  cleanup,
} from '@testing-library/react';
import { createMockImplementation } from '../helpers';
import {
  ethSentNotification,
  featureNotification,
  getMockedNotificationsState,
} from './notification-state';

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

describe('Notifications', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    setupSubmitRequestToBackgroundMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('should show the correct number of unread notifications on the badge', async () => {
    const mockedState = getStateWithTwoUnreadNotifications();

    await act(async () => {
      const { getByTestId } = await integrationTestRender({
        preloadedState: mockedState,
        backgroundConnection: backgroundConnectionMocked,
      });

      const unreadCount = getByTestId('notifications-tag-counter__unread-dot');
      expect(unreadCount).toBeInTheDocument();
      expect(unreadCount).toHaveTextContent('2');
    });
  });

  it('should render notifications list and show correct details', async () => {
    const mockedState = getStateWithTwoUnreadNotifications();

    await act(async () => {
      const { getByTestId, getAllByTestId } = await integrationTestRender({
        preloadedState: mockedState,
        backgroundConnection: backgroundConnectionMocked,
      });

      fireEvent.click(getByTestId('account-options-menu-button'));

      await waitFor(() => {
        expect(getByTestId('notifications-menu-item')).toBeInTheDocument();
        fireEvent.click(getByTestId('notifications-menu-item'));
      });

      const notificationsList = getByTestId('notifications-list');
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
      expect(addressElement).toHaveTextContent('0x998c0...2190d');

      // Read all button
      expect(
        within(notificationsList).getByTestId(
          'notifications-list-read-all-button',
        ),
      ).toBeInTheDocument();

      const unreadDot = getAllByTestId('unread-dot');
      expect(unreadDot).toHaveLength(2);
    });
  });

  it('should not see mark all as read button if there are no unread notifications', async () => {
    const mockedState = getStateWithTwoUnreadNotifications();

    await act(async () => {
      const { getByTestId, container } = await integrationTestRender({
        preloadedState: mockedState,
        backgroundConnection: backgroundConnectionMocked,
      });

      fireEvent.click(getByTestId('account-options-menu-button'));

      await waitFor(() => {
        expect(getByTestId('notifications-menu-item')).toBeInTheDocument();
        fireEvent.click(getByTestId('notifications-menu-item'));
      });

      const notificationsList = getByTestId('notifications-list');
      expect(notificationsList).toBeInTheDocument();
      expect(notificationsList.childElementCount).toBe(2);

      expect(
        screen.queryByTestId('notifications-list-read-all-button'),
      ).not.toBeInTheDocument();

      expect(screen.queryAllByTestId('unread-dot')).toHaveLength(0);
    });
  });

  it('should send request for marking notifications as read to the background with the correct params', async () => {
    const mockedState = getStateWithTwoUnreadNotifications();
    await act(async () => {
      const { getByTestId, getAllByTestId } = await integrationTestRender({
        preloadedState: mockedState,
        backgroundConnection: backgroundConnectionMocked,
      });

      fireEvent.click(getByTestId('account-options-menu-button'));

      await waitFor(() => {
        expect(getByTestId('notifications-menu-item')).toBeInTheDocument();
        fireEvent.click(getByTestId('notifications-menu-item'));
      });

      fireEvent.click(getByTestId('notifications-list-read-all-button'));

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
});
