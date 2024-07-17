import { NotificationServicesController } from '@metamask/notification-services-controller';
import {
  selectIsNotificationServicesEnabled,
  selectIsMetamaskNotificationsFeatureSeen,
  getMetamaskNotifications,
  getMetamaskNotificationsReadList,
  getMetamaskNotificationsUnreadCount,
  selectIsFeatureAnnouncementsEnabled,
} from './metamask-notifications';

const { TRIGGER_TYPES } = NotificationServicesController.Constants;
type Notification = NotificationServicesController.Types.INotification;

const mockNotifications: Notification[] = [
  {
    type: TRIGGER_TYPES.ETH_RECEIVED,
    id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    trigger_id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    chain_id: 1,
    block_number: 17485840,
    block_timestamp: '2022-03-01T00:00:00Z',
    tx_hash: '0x881D40237659C251811CEC9c364ef91dC08D300C',
    unread: true,
    created_at: '2022-03-01T00:00:00Z',
    createdAt: '2022-03-01T00:00:00Z',
    isRead: false,
    address: '0x881D40237659C251811CEC9c364ef91dC08D300C',
    data: {
      kind: 'eth_received',
      network_fee: {
        gas_price: '207806259583',
        native_token_price_in_usd: '0.83',
      },
      from: '0x881D40237659C251811CEC9c364ef91dC08D300C',
      to: '0x881D40237659C251811CEC9c364ef91dC08D300D',
      amount: {
        usd: '670.64',
        eth: '808.000000000000000000',
      },
    },
  },
];

describe('Metamask Notifications Selectors', () => {
  const mockState = {
    metamask: {
      subscriptionAccountsSeen: [],
      isMetamaskNotificationsFeatureSeen: true,
      isNotificationServicesEnabled: true,
      isFeatureAnnouncementsEnabled: true,
      metamaskNotificationsList: mockNotifications,
      metamaskNotificationsReadList: [],
      isProfileSyncingUpdateLoading: false,
      isFetchingMetamaskNotifications: false,
      isUpdatingMetamaskNotifications: false,
      isUpdatingMetamaskNotificationsAccount: [],
      isCheckingAccountsPresence: false,
    },
  };

  it('should select the isMetamaskNotificationsFeatureSeen state', () => {
    expect(selectIsMetamaskNotificationsFeatureSeen(mockState)).toBe(true);
  });

  it('should select the isNotificationServicesEnabled state', () => {
    expect(selectIsNotificationServicesEnabled(mockState)).toBe(true);
  });

  it('should select the metamaskNotificationsList from state', () => {
    expect(getMetamaskNotifications(mockState)).toEqual(mockNotifications);
  });

  it('should select the metamaskNotificationsReadList from state', () => {
    expect(getMetamaskNotificationsReadList(mockState)).toEqual([]);
  });

  it('should select the count of unread MetaMask notifications from state', () => {
    const expectedUnreadNotificationsCount = mockNotifications.filter(
      (notification) => !notification.isRead,
    ).length;
    expect(getMetamaskNotificationsUnreadCount(mockState)).toEqual(
      expectedUnreadNotificationsCount,
    );
  });

  it('should select the isFeatureAnnouncementsEnabled state', () => {
    expect(selectIsFeatureAnnouncementsEnabled(mockState)).toBe(true);
  });
});
