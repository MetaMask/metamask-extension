import mockMetaMaskState from '../../data/integration-init-state.json';
import {
  INotification,
  TRIGGER_TYPES,
  processNotification,
} from '@metamask/notification-services-controller/notification-services';
import {
  createMockNotificationEthSent,
  createMockFeatureAnnouncementRaw,
} from '@metamask/notification-services-controller/notification-services/mocks';

const notificationsAccountAddress =
  mockMetaMaskState.internalAccounts.accounts[
    mockMetaMaskState.internalAccounts
      .selectedAccount as keyof typeof mockMetaMaskState.internalAccounts.accounts
  ].address;

export const ethSentNotification = processNotification(
  createMockNotificationEthSent(),
) as Extract<INotification, { type: TRIGGER_TYPES.ERC20_SENT }>;

if (ethSentNotification.type === TRIGGER_TYPES.ERC20_SENT) {
  ethSentNotification.address = notificationsAccountAddress;
  ethSentNotification.data.from = notificationsAccountAddress;
  ethSentNotification.isRead = true;
}

export const featureNotification = processNotification(
  createMockFeatureAnnouncementRaw(),
) as Extract<INotification, { type: TRIGGER_TYPES.FEATURES_ANNOUNCEMENT }>;

if (featureNotification.type === TRIGGER_TYPES.FEATURES_ANNOUNCEMENT) {
  featureNotification.isRead = true;
}

export const getMockedNotificationsState = () => {
  return {
    ...mockMetaMaskState,
    isProfileSyncingEnabled: true,
    isProfileSyncingUpdateLoading: false,
    isMetamaskNotificationsFeatureSeen: true,
    isNotificationServicesEnabled: true,
    isFeatureAnnouncementsEnabled: true,
    notifications: {},
    metamaskNotificationsReadList: [],
    metamaskNotificationsList: [featureNotification, ethSentNotification],
    isUpdatingMetamaskNotifications: false,
    isFetchingMetamaskNotifications: false,
    isUpdatingMetamaskNotificationsAccount: [],
    useExternalServices: true,
    preferences: {
      ...mockMetaMaskState.preferences,
      showMultiRpcModal: false,
    },
    pendingApprovalCount: 0,
    pendingApprovals: {},
  };
};
