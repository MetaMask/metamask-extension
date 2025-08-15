import React, { useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom-v5-compat';
import { TRIGGER_TYPES } from '@metamask/notification-services-controller/notification-services';
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
  hasNotificationComponents,
} from '../notifications/notification-components';
import { type Notification } from '../notifications/notification-components/types/notifications/notifications';
import { useSnapNotificationTimeouts } from '../../hooks/useNotificationTimeouts';
import { getExtractIdentifier } from './utils/utils';
import { NotificationDetailsHeader } from './notification-details-header/notification-details-header';
import { NotificationDetailsBody } from './notification-details-body/notification-details-body';
import { NotificationDetailsFooter } from './notification-details-footer/notification-details-footer';

function useModalNavigation() {
  const navigate = useNavigate();

  const redirectToNotifications = useCallback(() => {
    navigate(NOTIFICATIONS_ROUTE);
  }, [navigate]);

  return {
    redirectToNotifications,
  };
}

function useNotificationByPath() {
  const { pathname } = useLocation();
  const id = getExtractIdentifier(pathname);
  const notification = useSelector(getMetamaskNotificationById(id));

  return {
    notification,
  };
}

function useEffectOnNotificationView(notificationData?: Notification) {
  const { markNotificationAsRead } = useMarkNotificationAsRead();
  const { setNotificationTimeout } = useSnapNotificationTimeouts();

  useEffect(() => {
    if (notificationData) {
      markNotificationAsRead([
        {
          id: notificationData.id,
          type: notificationData.type,
          isRead: notificationData.isRead,
        },
      ]);
    }

    return () => {
      if (notificationData?.type === TRIGGER_TYPES.SNAP) {
        setNotificationTimeout(notificationData.id);
      }
    };
  }, []);
}

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
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
