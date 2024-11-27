import React, { useContext, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';
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
import { markNotificationsAsRead as markSnapNotificationsAsRead } from '../../store/actions';
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
  const dispatch = useDispatch();
  const trackEvent = useContext(MetaMetricsContext);

  const { markNotificationAsRead } = useMarkNotificationAsRead();

  const handleNotificationClick = useCallback(() => {
    trackEvent({
      category: MetaMetricsEventCategory.NotificationInteraction,
      event: MetaMetricsEventName.NotificationClicked,
      properties: {
        notification_id: notification.id,
        notification_type: notification.type,
        ...(notification.type !== TRIGGER_TYPES.FEATURES_ANNOUNCEMENT &&
          notification.type !== TRIGGER_TYPES.SNAP && {
            chain_id: notification?.chain_id,
          }),
        previously_read: notification.isRead,
      },
    });

    // In the future will move snap notifications into the notification services controller
    if (notification.type === TRIGGER_TYPES.SNAP) {
      dispatch(markSnapNotificationsAsRead([notification.id]));
    } else {
      markNotificationAsRead([
        {
          id: notification.id,
          type: notification.type,
          isRead: notification.isRead,
        },
      ]);
    }

    if (
      notification.type === TRIGGER_TYPES.SNAP &&
      !notification.data.expandedView
    ) {
      return;
    }

    history.push(`${NOTIFICATIONS_ROUTE}/${notification.id}`);
  }, [
    notification,
    markNotificationAsRead,
    markSnapNotificationsAsRead,
    dispatch,
    history,
  ]);

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
