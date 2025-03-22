import React from 'react';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { Box } from '../../components/component-library';
import {
  BlockSize,
  Display,
  JustifyContent,
  FlexDirection,
  AlignItems,
  TextVariant,
} from '../../helpers/constants/design-system';
import Preloader from '../../components/ui/icon/preloader/preloader-icon.component';
import { selectIsMetamaskNotificationsEnabled } from '../../selectors/metamask-notifications/metamask-notifications';
import { useI18nContext } from '../../hooks/useI18nContext';
import { NotificationListItem } from '../../components/multichain';
import { NotificationListItemIconType } from '../../components/multichain/notification-list-item-icon/notification-list-item-icon';
import { createTextItems } from '../../helpers/utils/notification.util';
import { NOTIFICATIONS_ROUTE } from '../../helpers/constants/routes';
import { NotificationsPlaceholder } from './notifications-list-placeholder';
import { NotificationsListTurnOnNotifications } from './notifications-list-turn-on-notifications';
import { NotificationsListItem } from './notifications-list-item';
import type { Notification } from './notifications';
import { NotificationsListReadAllButton } from './notifications-list-read-all-button';
import { useRevokeNotification } from './revoke-notification.hooks';

export type NotificationsListProps = {
  activeTab: TAB_KEYS;
  notifications: Notification[];
  isLoading: boolean;
  isError: boolean;
  notificationsCount: number;
};

// NOTE - Tab filters could change once we support more notifications.
export const enum TAB_KEYS {
  // Shows all notifications
  ALL = 'notifications-all-tab',

  // These are only on-chain notifications (no snaps or feature announcements)
  WALLET = 'notifications-wallet-tab',

  // These are 3rd party notifications (snaps, feature announcements, web3 alerts)
  WEB3 = 'notifications-other-tab',
}

function LoadingContent() {
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
}

function EmptyContent() {
  const t = useI18nContext();
  return (
    <NotificationsPlaceholder
      title={t('notificationsPageEmptyTitle')}
      text={t('notificationsPageNoNotificationsContent')}
    />
  );
}

function ErrorContent() {
  const t = useI18nContext();
  return (
    <NotificationsPlaceholder
      title={t('notificationsPageErrorTitle')}
      text={t('notificationsPageErrorContent')}
    />
  );
}

function NotificationItem(props: { notification: Notification }) {
  const { notification } = props;
  return <NotificationsListItem notification={notification} />;
}

function NotificationsListStates({
  activeTab,
  notifications,
  isLoading,
  isError,
}: NotificationsListProps) {
  const isMetamaskNotificationsEnabled = useSelector(
    selectIsMetamaskNotificationsEnabled,
  );
  const history = useHistory();

  const testNotif = useRevokeNotification();

  // Case when a user has not enabled wallet notifications yet
  if (activeTab === TAB_KEYS.WALLET && !isMetamaskNotificationsEnabled) {
    return <NotificationsListTurnOnNotifications />;
  }

  // Loading State
  if (isLoading || testNotif.loading) {
    return <LoadingContent />;
  }

  // Error State
  if (isError) {
    return <ErrorContent />;
  }

  if (notifications.length === 0) {
    return <EmptyContent />;
  }

  const revokeNotif = testNotif.notification;

  return (
    <>
      {/* Revoke Notification */}
      {revokeNotif ? (
        <NotificationListItem
          id={revokeNotif.id}
          isRead={revokeNotif.isRead}
          createdAt={new Date(revokeNotif.createdAt)}
          icon={{
            type: NotificationListItemIconType.Token,
            value: './images/icons/security-time.svg',
          }}
          title={createTextItems(
            [`You have ${revokeNotif.data.length} total approvals`],
            TextVariant.bodySm,
          )}
          description={createTextItems(
            [`Lets cleanup some tokens you are not using`],
            TextVariant.bodyMd,
          )}
          onClick={() =>
            history.push(`${NOTIFICATIONS_ROUTE}/${revokeNotif.id}`)
          }
        />
      ) : null}

      {/* Other Notifications */}
      {notifications.map((notification) => (
        <NotificationItem key={notification.id} notification={notification} />
      ))}
    </>
  );
}

export function NotificationsList(props: NotificationsListProps) {
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
}
