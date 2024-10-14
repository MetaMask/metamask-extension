import React, { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, useLocation } from 'react-router-dom';
import { Box } from '../../components/component-library';
import {
  BlockSize,
  Display,
  FlexDirection,
  JustifyContent,
} from '../../helpers/constants/design-system';
import { NOTIFICATIONS_ROUTE } from '../../helpers/constants/routes';
import { NotificationsPage } from '../../components/multichain';
import { Content } from '../../components/multichain/pages/page';
import { useMarkNotificationAsRead } from '../../hooks/metamask-notifications/useNotifications';
import { getMetamaskNotificationById } from '../../selectors/metamask-notifications/metamask-notifications';
import {
  NotificationComponents,
  TRIGGER_TYPES,
  hasNotificationComponents,
} from '../notifications/notification-components';
import { getNotificationById } from '../../selectors';
import { type Notification } from '../notifications/notification-components/types/notifications/notifications';
import { markNotificationsAsRead as markSnapNotificationsAsRead } from '../../store/actions';
import { processSnapNotifications } from '../notifications/snap/utils/utils';
import { RawSnapNotification } from '../notifications/snap/types/types';
import { getExtractIdentifier } from './utils/utils';
import { NotificationDetailsHeader } from './notification-details-header/notification-details-header';
import { NotificationDetailsBody } from './notification-details-body/notification-details-body';
import { NotificationDetailsFooter } from './notification-details-footer/notification-details-footer';

function useModalNavigation() {
  const history = useHistory();

  const redirectToNotifications = useCallback(() => {
    history.push(NOTIFICATIONS_ROUTE);
  }, [history]);

  return {
    redirectToNotifications,
  };
}

function useNotificationByPath() {
  const { pathname } = useLocation();
  const id = getExtractIdentifier(pathname);
  let notification = useSelector(
    getMetamaskNotificationById(id),
  ) as unknown as Notification;
  if (!notification) {
    // we only reach here if it is a snap notification
    const snapNotification = useSelector((state) =>
      // @ts-expect-error improperly typed
      getNotificationById(state, id),
    ) as unknown as RawSnapNotification;
    if (snapNotification) {
      notification = processSnapNotifications([snapNotification])[0];
    }
  }

  return {
    notification,
  };
}

function useEffectOnNotificationView(notificationData?: Notification) {
  const { markNotificationAsRead } = useMarkNotificationAsRead();
  const dispatch = useDispatch();
  useEffect(() => {
    if (notificationData) {
      if (notificationData.type === TRIGGER_TYPES.SNAP) {
        dispatch(markSnapNotificationsAsRead([notificationData.id]));
      } else {
        markNotificationAsRead([
          {
            id: notificationData.id,
            type: notificationData.type,
            isRead: notificationData.isRead,
          },
        ]);
      }
    }
  }, [markNotificationAsRead, notificationData]);
}

export default function NotificationDetails() {
  const { redirectToNotifications } = useModalNavigation();
  const { notification } = useNotificationByPath();
  useEffectOnNotificationView(notification);

  // No Notification
  if (!notification) {
    redirectToNotifications();
    return null;
  }

  // Invalid Notification
  if (!hasNotificationComponents(notification.type)) {
    redirectToNotifications();
    return null;
  }

  const ncs = NotificationComponents[notification.type];

  return (
    <NotificationsPage>
      <NotificationDetailsHeader onClickBack={redirectToNotifications}>
        <ncs.details.title notification={notification} />
      </NotificationDetailsHeader>
      <Content padding={0}>
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          gap={2}
          width={BlockSize.Full}
          height={BlockSize.Full}
          justifyContent={JustifyContent.spaceBetween}
        >
          <NotificationDetailsBody
            body={ncs.details.body}
            notification={notification}
          />
          <NotificationDetailsFooter
            footer={ncs.footer}
            notification={notification}
          />
        </Box>
      </Content>
    </NotificationsPage>
  );
}
