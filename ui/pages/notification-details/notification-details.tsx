import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom-v5-compat';
import {
  TRIGGER_TYPES,
  type INotification,
} from '@metamask/notification-services-controller/notification-services';
import { Box } from '../../components/component-library';
import {
  BlockSize,
  Display,
  FlexDirection,
  JustifyContent,
} from '../../helpers/constants/design-system';
import { NOTIFICATIONS_ROUTE } from '../../helpers/constants/routes';
import { Content, Page } from '../../components/multichain/pages/page';
import { useMarkNotificationAsRead } from '../../hooks/metamask-notifications/useNotifications';
import { getMetamaskNotificationById } from '../../selectors/metamask-notifications/metamask-notifications';
import {
  NotificationComponents,
  hasNotificationComponents,
} from '../notifications/notification-components';
import { useSnapNotificationTimeouts } from '../../hooks/useNotificationTimeouts';
import { getExtractIdentifier } from './utils/utils';
import { NotificationDetailsHeader } from './notification-details-header/notification-details-header';
import { NotificationDetailsBody } from './notification-details-body/notification-details-body';
import { NotificationDetailsFooter } from './notification-details-footer/notification-details-footer';

function useNotificationByPath(propsParams?: { uuid: string }) {
  const { pathname } = useLocation();
  // If params are provided as props, use them; otherwise extract from pathname
  const id = propsParams?.uuid || getExtractIdentifier(pathname);
  const notification = useSelector(getMetamaskNotificationById(id));

  return {
    notification,
  };
}

function useEffectOnNotificationView(notificationData?: INotification) {
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

type NotificationDetailsProps = {
  params?: { uuid: string };
  navigate?: (
    to: string | number,
    options?: { replace?: boolean; state?: Record<string, unknown> },
  ) => void;
};

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function NotificationDetails({
  params,
  navigate: navigateProp,
}: NotificationDetailsProps = {}) {
  const navigateHook = useNavigate();
  const navigate = (navigateProp || navigateHook) as NonNullable<
    typeof navigateProp
  >;
  const { notification } = useNotificationByPath(params);
  useEffectOnNotificationView(notification);

  // No Notification
  if (!notification) {
    navigate(NOTIFICATIONS_ROUTE);
    return null;
  }

  // Invalid Notification
  if (!hasNotificationComponents(notification.type)) {
    navigate(NOTIFICATIONS_ROUTE);
    return null;
  }

  const ncs = NotificationComponents[notification.type];
  if (!ncs.details) {
    return null;
  }

  return (
    <Page>
      <NotificationDetailsHeader
        onClickBack={() => navigate(NOTIFICATIONS_ROUTE)}
      >
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
            footer={ncs.details.footer}
            notification={notification}
          />
        </Box>
      </Content>
    </Page>
  );
}
