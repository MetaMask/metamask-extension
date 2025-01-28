import React, { useContext } from 'react';
import type { NotificationServicesController } from '@metamask/notification-services-controller';
import { TRIGGER_TYPES } from '@metamask/notification-services-controller/notification-services';
import { MetaMetricsContext } from '../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import { useI18nContext } from '../../hooks/useI18nContext';
import { useMarkNotificationAsRead } from '../../hooks/metamask-notifications/useNotifications';
import { Box, Button, ButtonVariant } from '../../components/component-library';
import { BlockSize } from '../../helpers/constants/design-system';
import { useSnapNotificationTimeouts } from '../../hooks/useNotificationTimeouts';

type Notification = NotificationServicesController.Types.INotification;
type MarkAsReadNotificationsParam =
  NotificationServicesController.Types.MarkAsReadNotificationsParam;

export type NotificationsListReadAllButtonProps = {
  notifications: Notification[];
};

export const NotificationsListReadAllButton = ({
  notifications,
}: NotificationsListReadAllButtonProps) => {
  const t = useI18nContext();
  const { markNotificationAsRead } = useMarkNotificationAsRead();
  const trackEvent = useContext(MetaMetricsContext);
  const { setNotificationTimeout } = useSnapNotificationTimeouts();

  const handleOnClick = () => {
    let notificationsRead: MarkAsReadNotificationsParam = [];

    if (notifications && notifications.length > 0) {
      notificationsRead = notifications
        .filter(
          (notification): notification is Notification =>
            (notification as Notification).id !== undefined,
        )
        .map((notification: Notification) => ({
          id: notification.id,
          type: notification.type,
          isRead: notification.isRead,
        }));

      notificationsRead
        .filter((notification) => notification.type === TRIGGER_TYPES.SNAP)
        .forEach((snapNotification) =>
          setNotificationTimeout(snapNotification.id),
        );
    }

    trackEvent({
      category: MetaMetricsEventCategory.NotificationInteraction,
      event: MetaMetricsEventName.MarkAllNotificationsRead,
    });

    // Mark all metamask notifications as read
    markNotificationAsRead(notificationsRead);
  };

  return (
    <Box
      paddingLeft={4}
      paddingRight={4}
      paddingTop={4}
      paddingBottom={4}
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
