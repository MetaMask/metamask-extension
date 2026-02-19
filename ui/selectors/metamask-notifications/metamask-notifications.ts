// @ts-check
import { createSelector } from 'reselect';
import {
  NotificationServicesControllerState,
  INotification as Notification,
  TRIGGER_TYPES,
  defaultState,
  processNotification,
} from '@metamask/notification-services-controller/notification-services';
import {
  // Marketing
  createMockFeatureAnnouncementRaw,

  // Wallet
  createMockNotificationEthSent,
  createMockNotificationEthReceived,
  createMockNotificationERC20Sent,
  createMockNotificationERC20Received,
  createMockNotificationMetaMaskSwapsCompleted,
  createMockNotificationERC721Sent,
  createMockNotificationERC721Received,
  createMockNotificationERC1155Sent,
  createMockNotificationERC1155Received,
  createMockNotificationLidoReadyToBeWithdrawn,
  createMockNotificationLidoStakeCompleted,
  createMockNotificationLidoWithdrawalCompleted,
  createMockNotificationLidoWithdrawalRequested,
  createMockNotificationRocketPoolStakeCompleted,
  createMockNotificationRocketPoolUnStakeCompleted,

  // Snap
  createMockSnapNotification,

  // Platform
  createMockPlatformNotification,
} from '@metamask/notification-services-controller/notification-services/mocks';
import { createDeepEqualSelector } from '../../../shared/modules/selectors/util';
import {
  getRemoteFeatureFlags,
  type RemoteFeatureFlagsState,
} from '../remote-feature-flags';

// Modify Snap Notif
const snapNotif = createMockSnapNotification();
snapNotif.data.origin = 'npm:@metamask/example-snap';

// Modify NFT Notifs
const erc721SentNotif = createMockNotificationERC721Sent();
if (erc721SentNotif.type === TRIGGER_TYPES.ERC721_SENT) {
  erc721SentNotif.payload.data.nft.image =
    'https://storage.googleapis.com/nftimagebucket/tokens/0x769272677fab02575e84945f03eca517acc544cc/preview/8680.gif';
}
const erc721ReceivedNotif = createMockNotificationERC721Received();
if (erc721ReceivedNotif.type === TRIGGER_TYPES.ERC721_RECEIVED) {
  erc721ReceivedNotif.payload.data.nft.image =
    'https://static.looksnice.org/0xC379e535CaFf250a01CAa6C3724Ed1359Fe5c29B/0x48c15915855e3d02e80f9d6934cd280076b23373d091870b956b35f428c4864f';
}
const erc1155SentNotif = createMockNotificationERC1155Sent();
if (erc1155SentNotif.type === TRIGGER_TYPES.ERC1155_SENT) {
  if (erc1155SentNotif.payload.data.nft) {
    erc1155SentNotif.payload.data.nft.image =
      'https://lh3.googleusercontent.com/W77_LXFiV8D5uhi_IgN0TxmrB_vTCQf1xOcZxPzQgY6GBP1Wkc4g19pEbc0rYpVIQSGreYt3x3YGn84bB-UBWopU5GEV0LZo2hq920o=w650';
  }
}
const erc1155ReceivedNotif = createMockNotificationERC1155Received();
if (erc1155ReceivedNotif.type === TRIGGER_TYPES.ERC1155_RECEIVED) {
  if (erc1155ReceivedNotif.payload.data.nft) {
    erc1155ReceivedNotif.payload.data.nft.image =
      'https://lh3.googleusercontent.com/W77_LXFiV8D5uhi_IgN0TxmrB_vTCQf1xOcZxPzQgY6GBP1Wkc4g19pEbc0rYpVIQSGreYt3x3YGn84bB-UBWopU5GEV0LZo2hq920o=w650';
  }
}

const mockNotifications = [
  // Marketing
  processNotification(createMockFeatureAnnouncementRaw()),

  // Wallet
  processNotification(createMockNotificationEthSent()),
  processNotification(createMockNotificationEthReceived()),
  processNotification(createMockNotificationERC20Sent()),
  processNotification(createMockNotificationERC20Received()),
  processNotification(createMockNotificationMetaMaskSwapsCompleted()),
  processNotification(erc721SentNotif),
  processNotification(erc721ReceivedNotif),
  processNotification(erc1155SentNotif),
  processNotification(erc1155ReceivedNotif),
  processNotification(createMockNotificationLidoReadyToBeWithdrawn()),
  processNotification(createMockNotificationLidoStakeCompleted()),
  processNotification(createMockNotificationLidoWithdrawalCompleted()),
  processNotification(createMockNotificationLidoWithdrawalRequested()),
  processNotification(createMockNotificationRocketPoolStakeCompleted()),
  processNotification(createMockNotificationRocketPoolUnStakeCompleted()),

  // Snap
  processNotification(snapNotif),

  // Platform
  processNotification(createMockPlatformNotification()),
].map((notif, index) => {
  // modify date so notifications are in descending order
  const date = new Date();
  date.setDate(date.getDate() - index);
  notif.createdAt = date.toISOString();
  notif.isRead = false;
  notif.id = `${notif.id}-${index}`;

  return notif;
});

console.log('TESTING', {
  x: processNotification(createMockNotificationEthSent()),
  y: mockNotifications[0],
});

export type NotificationAppState = RemoteFeatureFlagsState & {
  metamask: Partial<NotificationServicesControllerState>;
};

const getMetamask = (state: NotificationAppState) => ({
  ...defaultState,
  ...state.metamask,
});

/**
 * Get the state of the `defiPositionsEnabled` remote feature flag.
 *
 * @param state
 * @returns The state of the `defiPositionsEnabled` remote feature flag.
 */
export function getIsNotificationEnabledByDefaultFeatureFlag(
  state: NotificationAppState,
) {
  const { assetsEnableNotificationsByDefaultV2 } = getRemoteFeatureFlags(state);
  const result =
    assetsEnableNotificationsByDefaultV2 &&
    typeof assetsEnableNotificationsByDefaultV2 === 'object' &&
    'value' in assetsEnableNotificationsByDefaultV2 &&
    Boolean(assetsEnableNotificationsByDefaultV2.value);

  return Boolean(result);
}

/**
 * Selector to get the list of MetaMask notifications.
 *
 * @param {NotificationAppState} state - The current state of the Redux store.
 * @returns {Notification[]} An array of notifications.
 */
export const getMetamaskNotifications = createSelector(
  [getMetamask],
  (_metamask): Notification[] => {
    return mockNotifications;
  },
);

/**
 * Factory function to create a selector that retrieves a specific MetaMask notification by ID.
 *
 * This function returns a selector that is tailored to fetch a notification by its ID.
 *
 * @param id - The ID of the notification to retrieve.
 * @returns A selector function that takes the AppState and returns the notification.
 */
export const getMetamaskNotificationById = (id: string) => {
  return createDeepEqualSelector(
    [getMetamaskNotifications],
    (notifications: Notification[]): Notification | undefined => {
      return notifications.find((notification) => notification.id === id);
    },
  );
};

/**
 * Selector to get the list of read MetaMask notifications.
 *
 * @param {NotificationAppState} state - The current state of the Redux store.
 * @returns {string[]} An array of notifications that have been read.
 */
export const getMetamaskNotificationsReadList = createSelector(
  [getMetamask],
  (metamask): string[] => metamask.metamaskNotificationsReadList,
);

/**
 * Selector to get the count of unread MetaMask notifications.
 *
 * @param {NotificationAppState} state - The current state of the Redux store.
 * @returns {number} The count of notifications that have not been read.
 */
export const getMetamaskNotificationsUnreadCount = createSelector(
  [getMetamaskNotifications],
  (notifications: Notification[]): number => {
    return notifications
      ? notifications.filter((notification) => !notification.isRead).length
      : 0;
  },
);

/**
 * Selector to get the count of unread feature announcement notifications.
 *
 * @param {NotificationAppState} state - The current state of the Redux store.
 * @returns {number} The count of unread feature announcement notifications.
 */
export const getFeatureAnnouncementsUnreadCount = createSelector(
  [getMetamaskNotifications],
  (notifications: Notification[]): number => {
    return notifications
      ? notifications.filter(
          (notification) =>
            !notification.isRead &&
            notification.type === TRIGGER_TYPES.FEATURES_ANNOUNCEMENT,
        ).length
      : 0;
  },
);

/**
 * Selector to get the count of read feature announcement notifications.
 *
 * @param {NotificationAppState} state - The current state of the Redux store.
 * @returns {number} The count of read feature announcement notifications.
 */
export const getFeatureAnnouncementsReadCount = createSelector(
  [getMetamaskNotifications],
  (notifications: Notification[]) => {
    return notifications
      ? notifications.filter(
          (notification) =>
            notification.isRead &&
            notification.type === TRIGGER_TYPES.FEATURES_ANNOUNCEMENT,
        ).length
      : 0;
  },
);

/**
 * Selector to get the count of unread snap notifications.
 *
 * @param {NotificationAppState} state - The current state of the Redux store.
 * @returns {number} The count of unread snap notifications.
 */
export const getSnapNotificationsUnreadCount = createSelector(
  [getMetamaskNotifications],
  (notifications: Notification[]): number => {
    return notifications
      ? notifications.filter(
          (notification) =>
            !notification.isRead && notification.type === TRIGGER_TYPES.SNAP,
        ).length
      : 0;
  },
);

/**
 * Selector to get the count of read snap notifications.
 *
 * @param {NotificationAppState} state - The current state of the Redux store.
 * @returns {number} The count of read snap notifications.
 */
export const getSnapNotificationsReadCount = createSelector(
  [getMetamaskNotifications],
  (notifications: Notification[]) => {
    return notifications
      ? notifications.filter(
          (notification) =>
            notification.isRead && notification.type === TRIGGER_TYPES.SNAP,
        ).length
      : 0;
  },
);

/**
 * Selector to get the count of unread non-feature announcement notifications.
 *
 * @param {NotificationAppState} state - The current state of the Redux store.
 * @returns {number} The count of unread non-feature announcement notifications.
 */
export const getOnChainMetamaskNotificationsUnreadCount = createSelector(
  [getMetamaskNotifications],
  (notifications: Notification[]): number => {
    return notifications
      ? notifications.filter(
          (notification) =>
            !notification.isRead &&
            notification.type !== TRIGGER_TYPES.FEATURES_ANNOUNCEMENT &&
            notification.type !== TRIGGER_TYPES.SNAP,
        ).length
      : 0;
  },
);

/**
 * Selector to get the count of read non-feature announcement notifications.
 *
 * @param {NotificationAppState} state - The current state of the Redux store.
 * @returns {number} The count of read non-feature announcement notifications.
 */
export const getOnChainMetamaskNotificationsReadCount = createSelector(
  [getMetamaskNotifications],
  (notifications: Notification[]): number => {
    return notifications
      ? notifications.filter(
          (notification) =>
            notification.isRead &&
            notification.type !== TRIGGER_TYPES.FEATURES_ANNOUNCEMENT &&
            notification.type !== TRIGGER_TYPES.SNAP,
        ).length
      : 0;
  },
);

/**
 * Selector to determine if the MetaMask notifications feature has been seen by the user.
 *
 * @param {NotificationAppState} state - The current state of the Redux store.
 * @returns {boolean} Returns true if the MetaMask notifications feature has been seen, false otherwise.
 */
export const selectIsMetamaskNotificationsFeatureSeen = createSelector(
  [getMetamask],
  (metamask) => metamask.isMetamaskNotificationsFeatureSeen,
);

/**
 * Selector to determine if MetaMask notifications are enabled.
 *
 * @param {NotificationAppState} state - The current state of the Redux store.
 * @returns {boolean} Returns true if MetaMask notifications are enabled, false otherwise.
 */
export const selectIsMetamaskNotificationsEnabled = createSelector(
  [getMetamask],
  (metamask): boolean => metamask.isNotificationServicesEnabled,
);

/**
 * Selector to determine if feature announcements are enabled.
 *
 * @param {NotificationAppState} state - The current state of the Redux store.
 * @returns {boolean} Returns true if feature announcements are enabled, false otherwise.
 */
export const selectIsFeatureAnnouncementsEnabled = createSelector(
  [getMetamask],
  (metamask): boolean => metamask.isFeatureAnnouncementsEnabled,
);

/**
 * Selector to determine if MetaMask notifications are currently being created.
 *
 * This selector checks the `isUpdatingMetamaskNotifications` property of the `metamask` state to see if the notifications are in the process of being created.
 * It uses the `createSelector` function from 'reselect' for memoization, improving performance by avoiding unnecessary recalculations.
 *
 * @param state - The current state of the Redux store.
 * @returns Returns true if MetaMask notifications are being created, false otherwise.
 */
export const getIsUpdatingMetamaskNotifications = createSelector(
  [getMetamask],
  (metamask): boolean => metamask.isUpdatingMetamaskNotifications,
);

/**
 * Selector to determine if MetaMask notifications are currently being fetched.
 *
 * This selector accesses the `isFetchingMetamaskNotifications` property from the `metamask` state to check if the notifications are currently being fetched.
 * It leverages the `createSelector` function for memoization, which helps in optimizing the performance by caching the result until the input selectors' outputs change.
 *
 * @param {NotificationAppState} state - The current state of the Redux store.
 * @returns {boolean} Returns true if MetaMask notifications are being fetched, false otherwise.
 */
export const isFetchingMetamaskNotifications = createSelector(
  [getMetamask],
  (metamask): boolean => metamask.isFetchingMetamaskNotifications,
);

/**
 * Selector to determine if the MetaMask notifications account is currently being updated.
 *
 * This selector checks the `isUpdatingMetamaskNotificationsAccount` property of the `metamask` state to see if the account associated with MetaMask notifications is in the process of being updated.
 * It uses the `createSelector` function from 'reselect' for memoization, improving performance by avoiding unnecessary recalculations.
 *
 * @param {NotificationAppState} state - The current state of the Redux store.
 * @returns {string[]} Returns list of accounts that are currently being updated.
 */
export const getIsUpdatingMetamaskNotificationsAccount = createSelector(
  [getMetamask],
  (metamask): string[] => {
    return metamask.isUpdatingMetamaskNotificationsAccount;
  },
);

/**
 * Selector to determine if the presence of accounts is currently being checked.
 *
 * This selector accesses the `isCheckingAccountsPresence` property from the `metamask` state to check if the system is currently verifying the presence of accounts.
 * It leverages the `createSelector` function for memoization, which helps in optimizing performance by caching the result until the input selectors' outputs change.
 *
 * @param {NotificationAppState} state - The current state of the Redux store.
 * @returns {boolean} Returns true if the account presence check is ongoing, false otherwise.
 */
export const getIsCheckingAccountsPresence = createSelector(
  [getMetamask],
  (metamask): boolean => metamask.isCheckingAccountsPresence,
);

export const getValidNotificationAccounts = createSelector(
  [getMetamask],
  (metamask): string[] => metamask.subscriptionAccountsSeen,
);
