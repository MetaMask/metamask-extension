import React from 'react';
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
import { NotificationsPlaceholder } from './notifications-list-placeholder';
import { NotificationsListTurnOnNotifications } from './notifications-list-turn-on-notifications';
import { NotificationsListItem } from './notifications-list-item';
import { NotificationsListReadAllButton } from './notifications-list-read-all-button';

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
