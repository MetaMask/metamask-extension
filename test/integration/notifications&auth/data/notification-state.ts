import {
  INotification,
  TRIGGER_TYPES,
  processNotification,
} from '@metamask/notification-services-controller/notification-services';
import {
  createMockNotificationEthSent,
  createMockFeatureAnnouncementRaw,
} from '@metamask/notification-services-controller/notification-services/mocks';
import mockMetaMaskState from '../../data/integration-init-state.json';

const notificationsAccountAddress =
  mockMetaMaskState.internalAccounts.accounts[
    mockMetaMaskState.internalAccounts
      .selectedAccount as keyof typeof mockMetaMaskState.internalAccounts.accounts
  ].address;

export const ethSentNotification = processNotification(
  createMockNotificationEthSent(),
) as Extract<INotification, { type: TRIGGER_TYPES.ETH_SENT }>;

if (ethSentNotification.type === TRIGGER_TYPES.ETH_SENT) {
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
    isBackupAndSyncEnabled: true,
    isBackupAndSyncUpdateLoading: false,
    hasAccountSyncingSyncedAtLeastOnce: false,
    isAccountSyncingReadyToBeDispatched: false,
    isAccountSyncingInProgress: false,
    isContactSyncingEnabled: true,
    isContactSyncingInProgress: false,
    isMetamaskNotificationsFeatureSeen: true,
    isNotificationServicesEnabled: true,
    isFeatureAnnouncementsEnabled: true,
    notifications: {},
    metamaskNotificationsReadList: [featureNotification.id],
    metamaskNotificationsList: [featureNotification, ethSentNotification],
    isUpdatingMetamaskNotifications: false,
    isFetchingMetamaskNotifications: false,
    isUpdatingMetamaskNotificationsAccount: [],
    useExternalServices: true,
    pendingApprovalCount: 0,
    pendingApprovals: {},
    subscriptionAccountsSeen: [notificationsAccountAddress],
  };
};
