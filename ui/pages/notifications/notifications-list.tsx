import React from 'react';
import { useSelector } from 'react-redux';
import { NotificationServicesController } from '@metamask/notification-services-controller';
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
import { SnapComponent } from './notification-components/snap/snap';
import { NotificationsPlaceholder } from './notifications-list-placeholder';
import { NotificationsListTurnOnNotifications } from './notifications-list-turn-on-notifications';
import { NotificationsListItem } from './notifications-list-item';
import { type Notification, TAB_KEYS } from './notifications';
import { NotificationsListReadAllButton } from './notifications-list-read-all-button';

const { TRIGGER_TYPES } = NotificationServicesController.Constants;

export type NotificationsListProps = {
  activeTab: TAB_KEYS;
  notifications: Notification[];
  isLoading: boolean;
  isError: boolean;
  notificationsCount: number;
};

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
  if (notification.type === TRIGGER_TYPES.SNAP) {
    return <SnapComponent snapNotification={notification} />;
  }

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
