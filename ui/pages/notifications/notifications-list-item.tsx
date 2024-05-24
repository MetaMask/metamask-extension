import React, { useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import type { Notification } from '../../../app/scripts/controllers/metamask-notifications/types/notification/notification';
import { Box } from '../../components/component-library';
import {
  BlockSize,
  Display,
  FlexDirection,
} from '../../helpers/constants/design-system';
import { NOTIFICATIONS_ROUTE } from '../../helpers/constants/routes';
import { useMarkNotificationAsRead } from '../../hooks/metamask-notifications/useNotifications';
import {
  NotificationComponents,
  hasNotificationComponents,
} from './notification-components';

export function NotificationsListItem({
  notification,
}: {
  notification: Notification;
}) {
  const history = useHistory();

  const { markNotificationAsRead } = useMarkNotificationAsRead();

  const handleNotificationClick = useCallback(() => {
    markNotificationAsRead([
      {
        id: notification.id,
        type: notification.type,
        isRead: notification.isRead,
      },
    ]);
    history.push(`${NOTIFICATIONS_ROUTE}/${notification.id}`);
  }, [notification, markNotificationAsRead, history]);

  if (!hasNotificationComponents(notification.type)) {
    return null;
  }
  const ncs = NotificationComponents[notification.type];

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      width={BlockSize.Full}
      onClick={handleNotificationClick}
    >
      <ncs.item notification={notification} onClick={handleNotificationClick} />
    </Box>
  );
}
