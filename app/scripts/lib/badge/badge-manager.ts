import { lightTheme } from '@metamask/design-tokens';
import type { ApprovalController } from '@metamask/approval-controller';
import { AccountOverviewTabKey } from '../../../../shared/constants/app-state';
import {
  REJECT_NOTIFICATION_CLOSE,
  REJECT_NOTIFICATION_CLOSE_SIG,
} from '../../../../shared/constants/metametrics';
import { isManifestV3 } from '../../../../shared/lib/mv3.utils';
import { getAttentionRequiredApprovalCount } from '../approval/utils';
import { NOTIFICATION_MANAGER_EVENTS } from '../notification-manager';

// Legacy MetaMask blue
// eslint-disable-next-line @metamask/design-tokens/color-no-hex
const BADGE_COLOR_APPROVAL = '#0376C9';
const BADGE_COLOR_FAILED = lightTheme.colors.error.default;
const BADGE_MAX_COUNT = 9;
const maxSeenFailedNonces = 99;

type BadgeActionApi = {
  setBadgeText: (details: { text: string }) => void;
  setBadgeBackgroundColor: (details: { color: string }) => void;
};

export type BadgeManagerBrowser = {
  action?: BadgeActionApi;
  browserAction?: BadgeActionApi;
};

export type BadgeManagerController = {
  approvalController: ApprovalController;
  appStateController: {
    setDefaultHomeActiveTabName: (tab: string | null) => void;
  };
  controllerMessenger: {
    subscribe: (event: string, handler: (...args: unknown[]) => void) => void;
  };
  signatureController: {
    hub: {
      on: (event: string, handler: () => void) => void;
    };
    rejectUnapproved: (reason: string) => void;
  };
  decryptMessageController: {
    rejectUnapproved: (reason: string) => void;
  };
  encryptionPublicKeyController: {
    rejectUnapproved: (reason: string) => void;
  };
  legacyBackgroundApiService: {
    rejectAllPendingApprovals: () => void;
  };
};

export type BadgeManagerNotificationManager = {
  on: (
    event: string,
    listener: (payload: { automaticallyClosed?: boolean }) => void,
  ) => void;
};

export type CreateBadgeManagerDeps = {
  getController: () => BadgeManagerController;
  browser: BadgeManagerBrowser;
  notificationManager: BadgeManagerNotificationManager;
  triggerUi: () => void | Promise<void>;
  hasPersistentUiOpen: () => boolean;
  isOnlyNotificationOpen: () => boolean;
};

export type BadgeManagerApi = {
  updateBadge: () => void;
  clearFailedTxBadge: () => void;
  getFailedTxCount: () => number;
  setClientLandingTab: (tab?: string | null) => void;
};

type TransactionStatusUpdatedPayload = {
  transactionMeta?: {
    status?: string;
    chainId?: string;
    txParams?: {
      from?: string;
      nonce?: string | number;
    };
  };
};

/**
 * Formats a count for display as a badge label.
 *
 * @param count - The count to be formatted.
 * @param maxCount - The maximum count to display before using the '+' suffix.
 * @returns The formatted badge label.
 */
export function getBadgeLabel(count: number, maxCount: number): string {
  return count > maxCount ? `${maxCount}+` : String(count);
}

/**
 * Owns toolbar badge rendering (pending-approval count vs failed-tx count),
 * failed-tx state, messenger subscriptions, and the notification POPUP_CLOSED
 * handler.
 *
 * @param options - Injected controller accessor, browser APIs, and UI presence.
 * @param options.getController - Returns the MetaMask controller when ready.
 * @param options.browser - Extension browser API used to set badge text/color.
 * @param options.notificationManager - Emits POPUP_CLOSED for notification windows.
 * @param options.triggerUi - Re-opens confirmation UI when a notification auto-closes.
 * @param options.hasPersistentUiOpen - True when popup or sidepanel is open.
 * @param options.isOnlyNotificationOpen - True when only the notification UI is open.
 */
export function createBadgeManager({
  getController,
  browser: extensionBrowser,
  notificationManager,
  triggerUi,
  hasPersistentUiOpen,
  isOnlyNotificationOpen,
}: CreateBadgeManagerDeps): BadgeManagerApi {
  let failedTxCount = 0;
  const seenFailedNonces = new Set<string>();

  const getPendingApprovalCount = () => {
    try {
      return getAttentionRequiredApprovalCount({
        approvalController: getController().approvalController,
      });
    } catch (error) {
      console.error('Failed to get pending approval count:', error);
      return 0;
    }
  };

  /**
   * Updates the Web Extension's "badge" number, on the little fox in the toolbar.
   * Failed transactions take priority and show a red count badge.
   * Pending approvals show the standard blue count badge.
   */
  const updateBadge = () => {
    const pendingApprovalCount = getPendingApprovalCount();

    let label = '';
    let badgeColor = BADGE_COLOR_APPROVAL;

    // Defer showing the failure badge until the notification closes
    if (failedTxCount > 0 && !isOnlyNotificationOpen()) {
      label = getBadgeLabel(failedTxCount, BADGE_MAX_COUNT);
      badgeColor = BADGE_COLOR_FAILED;
    } else if (pendingApprovalCount > 0) {
      label = getBadgeLabel(pendingApprovalCount, BADGE_MAX_COUNT);
    }

    try {
      const badgeText = { text: label };
      const badgeBackgroundColor = { color: badgeColor };
      const badgeApi = isManifestV3
        ? extensionBrowser.action
        : extensionBrowser.browserAction;

      badgeApi?.setBadgeText(badgeText);
      badgeApi?.setBadgeBackgroundColor(badgeBackgroundColor);
    } catch (error) {
      console.error('Error updating browser badge:', error);
    }
  };

  const setClientLandingTab = (tab?: string | null) => {
    try {
      getController().appStateController.setDefaultHomeActiveTabName(
        tab ?? null,
      );
    } catch (error) {
      console.error('Error setting landing tab:', error);
    }
  };

  const onTransactionStatusUpdated = (
    payload: TransactionStatusUpdatedPayload,
  ) => {
    const { transactionMeta } = payload;
    const { status, txParams, chainId } = transactionMeta ?? {};
    if (status !== 'failed' && status !== 'dropped') {
      return;
    }

    const { from, nonce } = txParams ?? {};
    const nonceKey =
      from && nonce !== undefined && chainId
        ? `${chainId}:${from.toLowerCase()}:${nonce}`
        : undefined;
    if (nonceKey && seenFailedNonces.has(nonceKey)) {
      return;
    }

    // Skip if a persistent UI is open, transaction status is in the Activity tab
    if (hasPersistentUiOpen()) {
      return;
    }

    if (nonceKey) {
      if (seenFailedNonces.size >= maxSeenFailedNonces) {
        seenFailedNonces.clear();
      }
      seenFailedNonces.add(nonceKey);
    }

    failedTxCount += 1;

    // Defer landing page until notification closes; close handler re-applies
    if (!isOnlyNotificationOpen()) {
      setClientLandingTab(AccountOverviewTabKey.Activity);
    }

    updateBadge();
  };

  const clearFailedTxBadge = () => {
    seenFailedNonces.clear();
    failedTxCount = 0;
    updateBadge();
  };

  const rejectUnapprovedNotifications = () => {
    const controller = getController();
    controller.signatureController.rejectUnapproved(
      REJECT_NOTIFICATION_CLOSE_SIG,
    );
    controller.decryptMessageController.rejectUnapproved(
      REJECT_NOTIFICATION_CLOSE,
    );
    controller.encryptionPublicKeyController.rejectUnapproved(
      REJECT_NOTIFICATION_CLOSE,
    );

    controller.legacyBackgroundApiService.rejectAllPendingApprovals();
  };

  const controller = getController();

  controller.controllerMessenger.subscribe(
    'DecryptMessageManager:updateBadge',
    updateBadge,
  );
  controller.controllerMessenger.subscribe(
    'EncryptionPublicKeyManager:updateBadge',
    updateBadge,
  );
  controller.signatureController.hub.on('updateBadge', updateBadge);
  controller.controllerMessenger.subscribe(
    'AppStateController:unlockChange',
    updateBadge,
  );

  controller.controllerMessenger.subscribe(
    'ApprovalController:stateChange',
    updateBadge,
  );

  controller.controllerMessenger.subscribe(
    'NotificationServicesController:notificationsListUpdated',
    updateBadge,
  );

  controller.controllerMessenger.subscribe(
    'NotificationServicesController:markNotificationsAsRead',
    updateBadge,
  );

  controller.controllerMessenger.subscribe(
    'TransactionController:transactionStatusUpdated',
    onTransactionStatusUpdated as (...args: unknown[]) => void,
  );

  notificationManager.on(
    NOTIFICATION_MANAGER_EVENTS.POPUP_CLOSED,
    ({ automaticallyClosed }) => {
      if (!automaticallyClosed) {
        rejectUnapprovedNotifications();
      } else if (getPendingApprovalCount() > 0) {
        triggerUi();
      }

      updateBadge();
    },
  );

  updateBadge();

  return {
    updateBadge,
    clearFailedTxBadge,
    getFailedTxCount: () => failedTxCount,
    setClientLandingTab,
  };
}
