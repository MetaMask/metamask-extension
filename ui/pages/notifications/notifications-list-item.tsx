import React, { useContext, useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import { hasProperty } from '@metamask/utils';
import { MetaMetricsContext } from '../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import { Box } from '../../components/component-library';
import {
  BlockSize,
  Display,
  FlexDirection,
} from '../../helpers/constants/design-system';
import { NOTIFICATIONS_ROUTE } from '../../helpers/constants/routes';
import { useMarkNotificationAsRead } from '../../hooks/metamask-notifications/useNotifications';
import { useSnapNotificationTimeouts } from '../../hooks/useNotificationTimeouts';
import {
  NotificationComponents,
  TRIGGER_TYPES,
  hasNotificationComponents,
} from './notification-components';
import { type Notification } from './notification-components/types/notifications/notifications';

export function NotificationsListItem({
  notification,
}: {
  notification: Notification;
}) {
  const history = useHistory();
  const trackEvent = useContext(MetaMetricsContext);
  const { setNotificationTimeout } = useSnapNotificationTimeouts();

  const { markNotificationAsRead } = useMarkNotificationAsRead();

  const handleNotificationClick = useCallback(() => {
    trackEvent({
      category: MetaMetricsEventCategory.NotificationInteraction,
      event: MetaMetricsEventName.NotificationClicked,
      properties: {
        notification_id: notification.id,
        notification_type: notification.type,
        ...('chain_id' in notification && {
          chain_id: notification.chain_id,
        }),
        previously_read: notification.isRead,
      },
    });

    markNotificationAsRead([
      {
        id: notification.id,
        type: notification.type,
        isRead: notification.isRead,
      },
    ]);

    if (
      notification.type === TRIGGER_TYPES.SNAP &&
      !hasProperty(notification.data, 'detailedView')
    ) {
      setNotificationTimeout(notification.id);
      return;
    }

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
    >
      <ncs.item notification={notification} onClick={handleNotificationClick} />
    </Box>
  );
}
