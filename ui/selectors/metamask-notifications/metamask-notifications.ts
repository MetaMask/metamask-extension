import { createSelector } from 'reselect';
import type { MetamaskNotificationsControllerState } from '../../../app/scripts/controllers/metamask-notifications/metamask-notifications';

type AppState = {
  metamask: MetamaskNotificationsControllerState;
};

const getMetamask = (state: AppState) => state.metamask;

/**
 * Selector to get the list of MetaMask notifications.
 *
 * @param {AppState} state - The current state of the Redux store.
 * @returns {Notification[]} An array of notifications.
 */
export const getMetamaskNotifications = createSelector(
  [getMetamask],
  (metamask) => metamask.metamaskNotificationsList,
);

/**
 * Selector to get the list of read MetaMask notifications.
 *
 * @param {AppState} state - The current state of the Redux store.
 * @returns {Notification[]} An array of notifications that have been read.
 */
export const getMetamaskNotificationsReadList = createSelector(
  [getMetamask],
  (metamask) => metamask.metamaskNotificationsReadList,
);

/**
 * Selector to determine if MetaMask notifications are enabled.
 *
 * @param {AppState} state - The current state of the Redux store.
 * @returns {boolean} Returns true if MetaMask notifications are enabled, false otherwise.
 */
export const selectIsMetamaskNotificationsEnabled = createSelector(
  [getMetamask],
  (metamask) => metamask.isMetamaskNotificationsEnabled,
);

/**
 * Selector to determine if Snap notifications are enabled.
 *
 * @param {AppState} state - The current state of the Redux store.
 * @returns {boolean} Returns true if Snap notifications are enabled, false otherwise.
 */
export const selectIsSnapNotificationsEnabled = createSelector(
  [getMetamask],
  (metamask) => metamask.isSnapNotificationsEnabled,
);

/**
 * Selector to determine if feature announcements are enabled.
 *
 * @param {AppState} state - The current state of the Redux store.
 * @returns {boolean} Returns true if feature announcements are enabled, false otherwise.
 */
export const selectIsFeatureAnnouncementsEnabled = createSelector(
  [getMetamask],
  (metamask) => metamask.isFeatureAnnouncementsEnabled,
);
