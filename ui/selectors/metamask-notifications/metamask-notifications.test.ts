import {
  NotificationServicesControllerState,
  INotification as Notification,
  processNotification,
} from '@metamask/notification-services-controller/notification-services';
import { createMockNotificationEthReceived } from '@metamask/notification-services-controller/notification-services/mocks';
import {
  selectIsMetamaskNotificationsEnabled,
  getMetamaskNotifications,
  getMetamaskNotificationsReadList,
  getMetamaskNotificationsUnreadCount,
  selectIsFeatureAnnouncementsEnabled,
  getValidNotificationAccounts,
} from './metamask-notifications';

type AppState = {
  metamask: Partial<NotificationServicesControllerState>;
};

const mockNotifications: Notification[] = [
  processNotification(createMockNotificationEthReceived()),
];

describe('Metamask Notifications Selectors', () => {
  const mockState = (): AppState => ({
    metamask: {
      subscriptionAccountsSeen: [] as string[],
      isMetamaskNotificationsFeatureSeen: true,
      isNotificationServicesEnabled: true,
      isFeatureAnnouncementsEnabled: true,
      metamaskNotificationsList: mockNotifications,
      metamaskNotificationsReadList: [],
      isFetchingMetamaskNotifications: false,
      isUpdatingMetamaskNotifications: false,
      isUpdatingMetamaskNotificationsAccount: [],
      isCheckingAccountsPresence: false,
    },
  });

  it('should select the isMetamaskNotificationsFeatureSeen state', () => {
    expect(selectIsMetamaskNotificationsEnabled(mockState())).toBe(true);
  });

  it('should select the isMetamaskNotificationsEnabled state', () => {
    expect(selectIsMetamaskNotificationsEnabled(mockState())).toBe(true);
  });

  it('should select the metamaskNotificationsList from state', () => {
    expect(getMetamaskNotifications(mockState())).toStrictEqual(
      mockNotifications,
    );
  });

  it('should handle missing metamaskNotificationsList state', () => {
    const state = mockState();
    delete state.metamask.metamaskNotificationsList;
    expect(getMetamaskNotifications(state)).toStrictEqual([]);
  });

  it('should select the metamaskNotificationsReadList from state', () => {
    expect(getMetamaskNotificationsReadList(mockState())).toStrictEqual([]);
  });

  it('should select the count of unread MetaMask notifications from state', () => {
    const expectedUnreadNotificationsCount = mockNotifications.filter(
      (notification) => !notification.isRead,
    ).length;
    expect(getMetamaskNotificationsUnreadCount(mockState())).toStrictEqual(
      expectedUnreadNotificationsCount,
    );
  });

  it('should select the isFeatureAnnouncementsEnabled state', () => {
    expect(selectIsFeatureAnnouncementsEnabled(mockState())).toBe(true);
  });

  it('should select the valid accounts that can enable notifications', () => {
    const state = mockState();
    state.metamask.subscriptionAccountsSeen = ['0x1111'];
    expect(getValidNotificationAccounts(state)).toStrictEqual(['0x1111']);
  });
});
