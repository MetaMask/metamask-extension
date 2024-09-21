import React, { useContext } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { NotificationServicesController } from '@metamask/notification-services-controller';
import { MetaMetricsContext } from '../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import { useI18nContext } from '../../hooks/useI18nContext';
import { useMarkNotificationAsRead } from '../../hooks/metamask-notifications/useNotifications';
import { getUnreadNotifications } from '../../selectors';
import { markNotificationsAsRead } from '../../store/actions';
import { Box, Button, ButtonVariant } from '../../components/component-library';
import { BlockSize } from '../../helpers/constants/design-system';
import type { NotificationType } from './notifications';
import { SNAP } from './snap/types/types';

type Notification = NotificationServicesController.Types.INotification;
type MarkAsReadNotificationsParam =
  NotificationServicesController.Types.MarkAsReadNotificationsParam;

export type NotificationsListReadAllButtonProps = {
  notifications: NotificationType[];
};

export const NotificationsListReadAllButton = ({
  notifications,
}: NotificationsListReadAllButtonProps) => {
  const dispatch = useDispatch();
  const t = useI18nContext();
  const { markNotificationAsRead } = useMarkNotificationAsRead();
  const trackEvent = useContext(MetaMetricsContext);
  const unreadNotifications = useSelector(getUnreadNotifications);

  const handleOnClick = () => {
    let notificationsRead: MarkAsReadNotificationsParam = [];

    if (notifications && notifications.length > 0) {
      notificationsRead = notifications
        .filter(
          (notification): notification is Notification =>
            (notification as Notification).id !== undefined &&
            notification.type !== SNAP,
        )
        .map((notification: Notification) => ({
          id: notification.id,
          type: notification.type,
          isRead: notification.isRead,
        }));
    }

    trackEvent({
      category: MetaMetricsEventCategory.NotificationInteraction,
      event: MetaMetricsEventName.MarkAllNotificationsRead,
    });

    // Mark all metamask notifications as read
    markNotificationAsRead(notificationsRead);

    // Mark all snap notifications as read
    const unreadNotificationIds = unreadNotifications.map(({ id }) => id);
    dispatch(markNotificationsAsRead(unreadNotificationIds));
  };

  return (
    <Box
      paddingLeft={4}
      paddingRight={4}
      paddingTop={4}
      className="notifications__list__read__all__button"
    >
      <Button
        onClick={handleOnClick}
        variant={ButtonVariant.Primary}
        width={BlockSize.Full}
        data-testid="notifications-list-read-all-button"
      >
        {t('notificationsMarkAllAsRead')}
      </Button>
    </Box>
  );
};
