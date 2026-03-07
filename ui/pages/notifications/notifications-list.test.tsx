import React from 'react';
import { screen, act, waitFor } from '@testing-library/react';
import configureStore from 'redux-mock-store';
import { processNotification } from '@metamask/notification-services-controller/notification-services';
import {
  createMockNotificationEthSent,
  createMockNotificationEthReceived,
  createMockNotificationERC20Sent,
  createMockNotificationERC20Received,
  createMockNotificationERC721Sent,
  createMockNotificationERC721Received,
  createMockNotificationERC1155Sent,
  createMockNotificationERC1155Received,
  createMockNotificationLidoReadyToBeWithdrawn,
  createMockNotificationLidoStakeCompleted,
  createMockNotificationLidoWithdrawalCompleted,
  createMockNotificationLidoWithdrawalRequested,
  createMockNotificationMetaMaskSwapsCompleted,
  createMockNotificationRocketPoolStakeCompleted,
  createMockNotificationRocketPoolUnStakeCompleted,
  createMockFeatureAnnouncementRaw,
  createMockPlatformNotification,
} from '@metamask/notification-services-controller/notification-services/mocks';

import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import { NotificationsList, TAB_KEYS } from './notifications-list';

const mockMarkNotificationAsRead = jest.fn();

jest.mock('../../hooks/metamask-notifications/useNotifications', () => ({
  useMarkNotificationAsRead: () => ({
    markNotificationAsRead: mockMarkNotificationAsRead,
  }),
}));

jest.mock('../../store/actions', () => ({
  deleteExpiredSnapNotifications: jest.fn(() => () => Promise.resolve()),
  fetchAndUpdateMetamaskNotifications: jest.fn(() => () => Promise.resolve()),
  markMetamaskNotificationsAsRead: jest.fn(() => () => Promise.resolve()),
}));

// Mock IntersectionObserver with controllable callbacks
type IntersectionCallback = (entries: IntersectionObserverEntry[]) => void;
let intersectionCallback: IntersectionCallback | null = null;
const mockObserve = jest.fn();
const mockUnobserve = jest.fn();
const mockDisconnect = jest.fn();

class MockIntersectionObserver {
  constructor(callback: IntersectionCallback) {
    intersectionCallback = callback;
  }

  observe = mockObserve;

  unobserve = mockUnobserve;

  disconnect = mockDisconnect;
}

// Helper to simulate intersection events
const simulateIntersection = (
  element: Element,
  isIntersecting: boolean,
): void => {
  if (intersectionCallback) {
    intersectionCallback([
      {
        target: element,
        isIntersecting,
        intersectionRatio: isIntersecting ? 1 : 0,
      } as IntersectionObserverEntry,
    ]);
  }
};

const middlewares = [thunk];
const mockStore = configureStore(middlewares);
const store = mockStore({
  metamask: {
    isMetamaskNotificationsEnabled: true,
    isFeatureAnnouncementsEnabled: true,
    isBackupAndSyncEnabled: true,
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
});

const mockNotifications = [
  processNotification(createMockNotificationEthSent()),
  processNotification(createMockNotificationEthReceived()),
  processNotification(createMockNotificationERC20Sent()),
  processNotification(createMockNotificationERC20Received()),
  processNotification(createMockNotificationERC721Sent()),
  processNotification(createMockNotificationERC721Received()),
  processNotification(createMockNotificationERC1155Sent()),
  processNotification(createMockNotificationERC1155Received()),
  processNotification(createMockNotificationLidoReadyToBeWithdrawn()),
  processNotification(createMockNotificationLidoStakeCompleted()),
  processNotification(createMockNotificationLidoWithdrawalCompleted()),
  processNotification(createMockNotificationLidoWithdrawalRequested()),
  processNotification(createMockNotificationMetaMaskSwapsCompleted()),
  processNotification(createMockNotificationRocketPoolStakeCompleted()),
  processNotification(createMockNotificationRocketPoolUnStakeCompleted()),
  processNotification(createMockFeatureAnnouncementRaw()),
  processNotification(createMockPlatformNotification()),
];

describe('NotificationsList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    intersectionCallback = null;
    window.IntersectionObserver =
      MockIntersectionObserver as unknown as typeof IntersectionObserver;
  });

  it('renders the notifications list page', () => {
    renderWithProvider(
      <NotificationsList
        activeTab={TAB_KEYS.ALL}
        notifications={mockNotifications}
        isLoading={false}
        isError={false}
        notificationsCount={0}
      />,
      store,
    );

    expect(screen.getByTestId('notifications-list')).toBeInTheDocument();
    expect(screen.queryAllByTestId(/notification-list-item-/u)).toHaveLength(
      mockNotifications.length,
    );
  });

  describe('visibility-based mark as read', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('marks notification as read after being visible for 2 seconds', async () => {
      const unreadNotification = {
        ...processNotification(createMockNotificationEthSent()),
        isRead: false,
      };

      renderWithProvider(
        <NotificationsList
          activeTab={TAB_KEYS.ALL}
          notifications={[unreadNotification]}
          isLoading={false}
          isError={false}
          notificationsCount={1}
        />,
        store,
      );

      // Wait for requestAnimationFrame
      await act(async () => {
        jest.advanceTimersByTime(16);
      });

      // Get the notification element
      const notificationElement = screen.getByTestId(
        `notification-list-item-${unreadNotification.id}`,
      );

      // Simulate the notification becoming visible
      act(() => {
        simulateIntersection(notificationElement, true);
      });

      // Advance time by less than 2 seconds - should not be marked as read yet
      await act(async () => {
        jest.advanceTimersByTime(1500);
      });
      expect(mockMarkNotificationAsRead).not.toHaveBeenCalled();

      // Advance past 2 seconds
      await act(async () => {
        jest.advanceTimersByTime(600);
      });

      // Advance past batch delay (500ms)
      await act(async () => {
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(mockMarkNotificationAsRead).toHaveBeenCalledWith([
          {
            id: unreadNotification.id,
            type: unreadNotification.type,
            isRead: unreadNotification.isRead,
          },
        ]);
      });
    });

    it('cancels timer when notification leaves viewport before 2 seconds', async () => {
      const unreadNotification = {
        ...processNotification(createMockNotificationEthSent()),
        isRead: false,
      };

      renderWithProvider(
        <NotificationsList
          activeTab={TAB_KEYS.ALL}
          notifications={[unreadNotification]}
          isLoading={false}
          isError={false}
          notificationsCount={1}
        />,
        store,
      );

      // Wait for requestAnimationFrame
      await act(async () => {
        jest.advanceTimersByTime(16);
      });

      const notificationElement = screen.getByTestId(
        `notification-list-item-${unreadNotification.id}`,
      );

      // Simulate the notification becoming visible
      act(() => {
        simulateIntersection(notificationElement, true);
      });

      // Advance time by 1 second
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      // Simulate the notification leaving the viewport (fast scroll)
      act(() => {
        simulateIntersection(notificationElement, false);
      });

      // Advance past what would have been the mark-as-read time
      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      // Should not have been called because the timer was canceled
      expect(mockMarkNotificationAsRead).not.toHaveBeenCalled();
    });

    it('batches multiple notifications into a single mark-as-read call', async () => {
      const unreadNotifications = [
        {
          ...processNotification(createMockNotificationEthSent()),
          isRead: false,
        },
        {
          ...processNotification(createMockNotificationEthReceived()),
          isRead: false,
        },
      ];

      renderWithProvider(
        <NotificationsList
          activeTab={TAB_KEYS.ALL}
          notifications={unreadNotifications}
          isLoading={false}
          isError={false}
          notificationsCount={2}
        />,
        store,
      );

      // Wait for requestAnimationFrame
      await act(async () => {
        jest.advanceTimersByTime(16);
      });

      const notificationElement1 = screen.getByTestId(
        `notification-list-item-${unreadNotifications[0].id}`,
      );
      const notificationElement2 = screen.getByTestId(
        `notification-list-item-${unreadNotifications[1].id}`,
      );

      // Simulate both notifications becoming visible
      act(() => {
        simulateIntersection(notificationElement1, true);
        simulateIntersection(notificationElement2, true);
      });

      // Advance past 2 seconds visibility delay
      await act(async () => {
        jest.advanceTimersByTime(2100);
      });

      // Advance past batch delay (500ms)
      await act(async () => {
        jest.advanceTimersByTime(500);
      });

      // Should be called once with both notifications
      await waitFor(() => {
        expect(mockMarkNotificationAsRead).toHaveBeenCalledTimes(1);
        expect(mockMarkNotificationAsRead).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({ id: unreadNotifications[0].id }),
            expect.objectContaining({ id: unreadNotifications[1].id }),
          ]),
        );
      });
    });

    it('does not observe already-read notifications', async () => {
      const readNotification = {
        ...processNotification(createMockNotificationEthSent()),
        isRead: true,
      };

      renderWithProvider(
        <NotificationsList
          activeTab={TAB_KEYS.ALL}
          notifications={[readNotification]}
          isLoading={false}
          isError={false}
          notificationsCount={0}
        />,
        store,
      );

      // Wait for requestAnimationFrame
      await act(async () => {
        jest.advanceTimersByTime(16);
      });

      // The read notification should not have the unread class,
      // so it won't be observed by the IntersectionObserver
      // Advance all timers
      await act(async () => {
        jest.advanceTimersByTime(3000);
      });

      expect(mockMarkNotificationAsRead).not.toHaveBeenCalled();
    });
  });
});
