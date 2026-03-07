import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { INotification } from '@metamask/notification-services-controller/notification-services';
import { Box } from '../../components/component-library';
import {
  BlockSize,
  Display,
  JustifyContent,
  FlexDirection,
  AlignItems,
} from '../../helpers/constants/design-system';
import Preloader from '../../components/ui/icon/preloader/preloader-icon.component';
import { selectIsMetamaskNotificationsEnabled } from '../../selectors/metamask-notifications/metamask-notifications';
import { useI18nContext } from '../../hooks/useI18nContext';
import { useMarkNotificationAsRead } from '../../hooks/metamask-notifications/useNotifications';
import { NotificationsPlaceholder } from './notifications-list-placeholder';
import { NotificationsListTurnOnNotifications } from './notifications-list-turn-on-notifications';
import { NotificationsListItem } from './notifications-list-item';
import { NotificationsListReadAllButton } from './notifications-list-read-all-button';

// Time in milliseconds a notification must be visible before marking as read
const VISIBILITY_DELAY_MS = 2000;
// Time in milliseconds to wait before batching mark-as-read calls
const BATCH_DELAY_MS = 500;

export type NotificationsListProps = {
  activeTab: TAB_KEYS;
  notifications: INotification[];
  isLoading: boolean;
  isError: boolean;
  notificationsCount: number;
};

// NOTE - Tab filters could change once we support more notifications.
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export const enum TAB_KEYS {
  // Shows all notifications
  ALL = 'notifications-all-tab',

  // These are only on-chain notifications (no snaps or feature announcements)
  WALLET = 'notifications-wallet-tab',

  // These are 3rd party notifications (snaps, feature announcements, web3 alerts)
  WEB3 = 'notifications-other-tab',
}

const LoadingContent = () => {
  return (
    <Box
      height={BlockSize.Full}
      width={BlockSize.Full}
      display={Display.Flex}
      justifyContent={JustifyContent.center}
      alignItems={AlignItems.center}
      flexDirection={FlexDirection.Column}
      data-testid="notifications-list-loading"
    >
      <Preloader size={36} />
    </Box>
  );
};

const EmptyContent = () => {
  const t = useI18nContext();
  return (
    <NotificationsPlaceholder
      title={t('notificationsPageEmptyTitle')}
      text={t('notificationsPageNoNotificationsContent')}
    />
  );
};

const ErrorContent = () => {
  const t = useI18nContext();
  return (
    <NotificationsPlaceholder
      title={t('notificationsPageErrorTitle')}
      text={t('notificationsPageErrorContent')}
    />
  );
};

const NotificationItem = (props: { notification: INotification }) => {
  const { notification } = props;
  return <NotificationsListItem notification={notification} />;
};

const NotificationsListStates = ({
  activeTab,
  notifications,
  isLoading,
  isError,
}: NotificationsListProps) => {
  const isMetamaskNotificationsEnabled = useSelector(
    selectIsMetamaskNotificationsEnabled,
  );

  const { markNotificationAsRead } = useMarkNotificationAsRead();

  // Refs for tracking visibility timers and pending reads
  const visibilityTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const pendingSeenIds = useRef<Set<string>>(new Set());
  const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Build a map of id -> notification for quick lookup when marking as read
  const notificationMap = useMemo(
    () => new Map(notifications.map((n) => [n.id, n])),
    [notifications],
  );

  // Function to flush pending reads in a batch
  const flushPendingReads = useCallback(() => {
    if (pendingSeenIds.current.size === 0) {
      return;
    }

    const toMark = Array.from(pendingSeenIds.current)
      .map((id) => notificationMap.get(id))
      .filter((n): n is INotification => n !== undefined)
      .filter((n) => !n.isRead) // Only mark unread notifications
      .map((n) => ({ id: n.id, type: n.type, isRead: n.isRead }));

    if (toMark.length > 0) {
      markNotificationAsRead(toMark);
    }
    pendingSeenIds.current.clear();
  }, [markNotificationAsRead, notificationMap]);

  // Set up IntersectionObserver to detect when notifications become visible
  useEffect(() => {
    // Only set up observer when we have notifications to display
    const shouldObserve =
      !isLoading &&
      !isError &&
      notifications.length > 0 &&
      (activeTab !== TAB_KEYS.WALLET || isMetamaskNotificationsEnabled);

    if (!shouldObserve) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.getAttribute('data-notification-id');
          if (!id) {
            return;
          }

          if (entry.isIntersecting) {
            // Start timer if not already running
            if (!visibilityTimers.current.has(id)) {
              const timer = setTimeout(() => {
                pendingSeenIds.current.add(id);
                visibilityTimers.current.delete(id);

                // Schedule batch flush
                if (batchTimeoutRef.current) {
                  clearTimeout(batchTimeoutRef.current);
                }
                batchTimeoutRef.current = setTimeout(
                  flushPendingReads,
                  BATCH_DELAY_MS,
                );
              }, VISIBILITY_DELAY_MS);
              visibilityTimers.current.set(id, timer);
            }
          } else {
            // Item left viewport - cancel timer
            const timer = visibilityTimers.current.get(id);
            if (timer) {
              clearTimeout(timer);
              visibilityTimers.current.delete(id);
            }
          }
        });
      },
      { threshold: 1.0 }, // Fully visible
    );

    // Query for unread items and observe them
    // Use requestAnimationFrame to ensure DOM is ready after render
    const rafId = requestAnimationFrame(() => {
      const unreadItems = document.querySelectorAll(
        '.notification-list-item--unread[data-notification-id]',
      );
      unreadItems.forEach((el) => observer.observe(el));
    });

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
      visibilityTimers.current.forEach((timer) => clearTimeout(timer));
      visibilityTimers.current.clear();
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }
    };
  }, [
    notifications,
    flushPendingReads,
    isLoading,
    isError,
    activeTab,
    isMetamaskNotificationsEnabled,
  ]);

  // Case when a user has not enabled wallet notifications yet
  if (activeTab === TAB_KEYS.WALLET && !isMetamaskNotificationsEnabled) {
    return <NotificationsListTurnOnNotifications />;
  }

  // Loading State
  if (isLoading) {
    return <LoadingContent />;
  }

  // Error State
  if (isError) {
    return <ErrorContent />;
  }

  if (notifications.length === 0) {
    return <EmptyContent />;
  }

  return (
    <>
      {notifications.map((notification) => (
        <NotificationItem key={notification.id} notification={notification} />
      ))}
    </>
  );
};

export const NotificationsList = (props: NotificationsListProps) => {
  return (
    <Box
      data-testid="notifications-list"
      height={BlockSize.Full}
      width={BlockSize.Full}
      className="notifications__list"
    >
      {/* Actual list (handling all states) */}
      <NotificationsListStates {...props} />

      {/* Read All Button */}
      {props.notifications.length > 0 && props.notificationsCount > 0 ? (
        <NotificationsListReadAllButton notifications={props.notifications} />
      ) : null}
    </Box>
  );
};
