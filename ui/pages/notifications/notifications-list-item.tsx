import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { hasProperty } from '@metamask/utils';
import {
  isOnChainNotification,
  type INotification,
} from '@metamask/notification-services-controller/notification-services';
import { useAnalytics } from '../../hooks/useAnalytics';
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

export function NotificationsListItem({
  notification,
}: {
  notification: INotification;
}) {
  const navigate = useNavigate();
  const { trackEvent, createEventBuilder } = useAnalytics();
  const { setNotificationTimeout } = useSnapNotificationTimeouts();

  const { markNotificationAsRead } = useMarkNotificationAsRead();

  const handleNotificationClick = useCallback(() => {
    const otherNotificationProperties = () => {
      if (
        'notification_type' in notification &&
        isOnChainNotification(notification) &&
        notification.payload.chain_id
      ) {
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        return { chain_id: notification.payload.chain_id };
      }

      return undefined;
    };

    trackEvent(
      createEventBuilder(MetaMetricsEventName.NotificationClicked)
        .addCategory(MetaMetricsEventCategory.NotificationInteraction)
        .addProperties({
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          /* eslint-disable @typescript-eslint/naming-convention */
          notification_id: notification.id,
          notification_type: notification.type,
          ...otherNotificationProperties(),
          previously_read: notification.isRead,
          data: notification, // data blob for feature teams to analyse their notification shapes
          /* eslint-enable @typescript-eslint/naming-convention */
        })
        .build(),
    );

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

    // If details component, perform navigation
    if (
      hasNotificationComponents(notification.type) &&
      NotificationComponents[notification.type]?.details
    ) {
      navigate(`${NOTIFICATIONS_ROUTE}/${notification.id}`);
    }
  }, [
    createEventBuilder,
    trackEvent,
    notification,
    markNotificationAsRead,
    navigate,
    setNotificationTimeout,
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
      data-testid={`notification-list-item-${notification.id}`}
    >
      <ncs.item notification={notification} onClick={handleNotificationClick} />
    </Box>
  );
}
