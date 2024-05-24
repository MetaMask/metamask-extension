import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
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
  hasNotificationComponents,
} from '../notifications/notification-components';
import type { Notification } from '../../../app/scripts/controllers/metamask-notifications/types/types';
import { getExtractIdentifier } from './utils/utils';
import { NotificationDetailsHeader } from './notification-details-header/notification-details-header';
import { NotificationDetailsBody } from './notification-details-body/notification-details-body';
import { NotificationDetailsFooter } from './notification-details-footer/notification-details-footer';

export default function NotificationDetails() {
  const history = useHistory();

  const { pathname } = useLocation();
  const id = getExtractIdentifier(pathname);

  const redirectToNotifications = () => {
    history.push(NOTIFICATIONS_ROUTE);
  };

  const notificationSelector = useMemo(
    () => getMetamaskNotificationById(id),
    [id],
  );
  const notificationData = useSelector(notificationSelector);

  const [notification, setNotification] = useState<Notification | undefined>(
    notificationData,
  );

  useEffect(() => {
    if (!id || !notificationData) {
      redirectToNotifications();
    }
    if (notificationData) {
      setNotification(notificationData);
    }
  }, [id, notificationData]);

  if (!notification) {
    redirectToNotifications();
    return null;
  }

  const { markNotificationAsRead } = useMarkNotificationAsRead();

  const onClickBack = () => {
    markNotificationAsRead([
      {
        id: notification.id,
        type: notification.type,
        isRead: notification.isRead,
      },
    ]);
    history.push(NOTIFICATIONS_ROUTE);
  };

  if (!hasNotificationComponents(notification.type)) {
    return null;
  }
  const ncs = NotificationComponents[notification.type];

  return (
    <NotificationsPage>
      <NotificationDetailsHeader onClickBack={onClickBack}>
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
