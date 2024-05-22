import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { TRIGGER_TYPES } from '../../../app/scripts/controllers/metamask-notifications/constants/notification-schema';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import { Box } from '../../components/component-library';
import { useMetamaskNotificationsContext } from '../../contexts/metamask-notifications/metamask-notifications';
import {
  BlockSize,
  Display,
  JustifyContent,
  FlexDirection,
  AlignItems,
} from '../../helpers/constants/design-system';
import Preloader from '../../components/ui/icon/preloader/preloader-icon.component';
import {
  selectIsMetamaskNotificationsEnabled,
  selectIsMetamaskNotificationsFeatureSeen,
} from '../../selectors/metamask-notifications/metamask-notifications';
import { useI18nContext } from '../../hooks/useI18nContext';
import type { Notification } from '../../../app/scripts/controllers/metamask-notifications/types/notification/notification';
import { deleteExpiredNotifications } from '../../store/actions';
import { SnapComponent } from './notification-components/snap/snap';
import { NotificationsPlaceholder } from './notifications-list-placeholder';
import { NotificationsListTurnOnNotifications } from './notifications-list-turn-on-notifications';
import { NotificationsListItem } from './notifications-list-item';
import { SnapNotificationWithoutSnapName, SNAP } from './snap/types/types';
import type { NotificationType } from './notifications';
import { NotificationsListReadAllButton } from './notifications-list-read-all-button';

export type NotificationsListProps = {
  activeTab: string;
  notifications: NotificationType[];
};

const enum TAB_KEYS {
  ALL = 'notifications-all-tab',
  WALLET = 'notifications-wallet-tab',
  OTHER = 'notifications-other-tab',
}

export function NotificationsList({
  activeTab,
  notifications,
}: NotificationsListProps) {
  const dispatch = useDispatch();

  const t = useI18nContext();
  const history = useHistory();
  const { isLoading, error } = useMetamaskNotificationsContext();

  const isMetamaskNotificationsEnabled = useSelector(
    selectIsMetamaskNotificationsEnabled,
  );
  const isMetamaskNotificationsFeatureSeen = useSelector(
    selectIsMetamaskNotificationsFeatureSeen,
  );

  if (!isMetamaskNotificationsFeatureSeen) {
    history.push(DEFAULT_ROUTE);
  }

  useEffect(() => {
    return () => {
      dispatch(deleteExpiredNotifications());
    };
  }, [dispatch]);

  const renderNotificationsContent = () => {
    if (!isMetamaskNotificationsEnabled) {
      return <NotificationsListTurnOnNotifications />;
    }

    if (isLoading) {
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

    if (error) {
      return (
        <NotificationsPlaceholder
          title={t('notificationsPageErrorTitle')}
          text={t('notificationsPageErrorContent')}
        />
      );
    }

    if (!notifications || notifications.length === 0) {
      return (
        <NotificationsPlaceholder
          title={t('notificationsPageEmptyTitle')}
          text={t('notificationsPageNoNotificationsContent')}
        />
      );
    }

    let filteredNotifications = notifications;

    switch (activeTab) {
      case TAB_KEYS.WALLET:
        filteredNotifications = notifications.filter(
          (notification) =>
            notification.type !== TRIGGER_TYPES.FEATURES_ANNOUNCEMENT &&
            notification.type !== SNAP,
        );
        break;
      case TAB_KEYS.OTHER:
        filteredNotifications = notifications.filter(
          (notification) =>
            notification.type === TRIGGER_TYPES.FEATURES_ANNOUNCEMENT ||
            notification.type === SNAP,
        );
        break;
      case TAB_KEYS.ALL:
      default:
        filteredNotifications = notifications;
        break;
    }

    return filteredNotifications.map((notification) => {
      if (notification.type === SNAP) {
        return (
          <SnapComponent
            key={notification.id}
            snapNotification={notification as SnapNotificationWithoutSnapName}
          />
        );
      }
      return (
        <NotificationsListItem
          key={notification.id}
          notification={notification as Notification}
        />
      );
    });
  };

  return (
    <Box
      data-testid="notifications-list"
      height={BlockSize.Full}
      width={BlockSize.Full}
      className="notifications__list"
    >
      {renderNotificationsContent()}
      <NotificationsListReadAllButton notifications={notifications} />
    </Box>
  );
}
