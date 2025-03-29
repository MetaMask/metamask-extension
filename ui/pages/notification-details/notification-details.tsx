/* eslint-disable @metamask/design-tokens/color-no-hex */
import React, { useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useHistory, useLocation } from 'react-router-dom';
import { TRIGGER_TYPES } from '@metamask/notification-services-controller/notification-services';
import {
  Box,
  Button,
  ButtonSize,
  ButtonVariant,
  Icon,
  IconName,
} from '../../components/component-library';
import {
  BlockSize,
  Display,
  FlexDirection,
  IconColor,
  JustifyContent,
} from '../../helpers/constants/design-system';
import { NOTIFICATIONS_ROUTE } from '../../helpers/constants/routes';
import {
  NotificationDetailTitle,
  NotificationsPage,
} from '../../components/multichain';
import { Content } from '../../components/multichain/pages/page';
import { useMarkNotificationAsRead } from '../../hooks/metamask-notifications/useNotifications';
import { getMetamaskNotificationById } from '../../selectors/metamask-notifications/metamask-notifications';
import {
  NotificationComponents,
  hasNotificationComponents,
} from '../notifications/notification-components';
import { type Notification } from '../notifications/notification-components/types/notifications/notifications';
import { useSnapNotificationTimeouts } from '../../hooks/useNotificationTimeouts';
import {
  TEST_REVOKE_NOTIFICATION_ID,
  useRevokeNotification,
} from '../notifications/revoke-notification.hooks';
import { formatIsoDateString } from '../../helpers/utils/notification.util';
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

function NotificationDetailsMain() {
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

function RevokeNotificationDetails() {
  const { redirectToNotifications } = useModalNavigation();
  const { notification } = useRevokeNotification();

  return (
    <NotificationsPage>
      <NotificationDetailsHeader onClickBack={redirectToNotifications}>
        <NotificationDetailTitle
          title={'Manage your token approvals'}
          date={
            notification?.createdAt &&
            formatIsoDateString(notification.createdAt)
          }
        />
      </NotificationDetailsHeader>
      <Content padding={0}>
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          gap={2}
          height={BlockSize.Full}
          width={BlockSize.Full}
          justifyContent={JustifyContent.spaceBetween}
        >
          {notification && (
            <Box
              style={{
                paddingTop: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                paddingLeft: '1rem',
                paddingRight: '1rem',
              }}
            >
              <Box
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem',
                }}
              >
                <p style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
                  You have
                </p>
                <p
                  style={{
                    fontSize: '2.25rem',
                    fontWeight: 'bold',
                    color: '#60a5fa',
                  }}
                >
                  {notification.data.length}
                </p>
                <p style={{ fontSize: '0.875rem', color: '#d1d5db' }}>
                  total approvals
                </p>
              </Box>

              {/* Honeypot warning - highlighted and moved up in priority */}
              <Box
                style={{
                  backgroundColor: '#1f2937',
                  borderLeft: '4px solid #ef4444',
                  padding: '1rem',
                  borderRadius: '0.375rem',
                }}
              >
                <Box style={{ display: 'flex', alignItems: 'start' }}>
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                      }}
                    >
                      <Icon
                        name={IconName.Danger}
                        color={IconColor.errorDefault}
                      />
                      <p
                        style={{
                          fontSize: '1.875rem',
                          fontWeight: 'bold',
                          color: '#ef4444',
                        }}
                      >
                        1
                      </p>
                    </div>
                    <p style={{ fontSize: '0.875rem', color: '#d1d5db' }}>
                      is tagged as a{' '}
                      <span style={{ fontWeight: '600', color: '#f87171' }}>
                        honeypot
                      </span>{' '}
                      and may be malicious
                    </p>
                  </div>
                </Box>
              </Box>

              <Box
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem',
                }}
              >
                <p
                  style={{
                    fontSize: '1.875rem',
                    fontWeight: 'bold',
                    color: '#fbbf24',
                  }}
                >
                  {Math.min(5, notification.data.length)}
                </p>
                <p style={{ fontSize: '0.875rem', color: '#d1d5db' }}>
                  are older than 14 days
                </p>
              </Box>

              <Box
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem',
                }}
              >
                <p
                  style={{
                    fontSize: '1.875rem',
                    fontWeight: 'bold',
                    color: '#fb7185',
                  }}
                >
                  {Math.min(2, notification.data.length)}
                </p>
                <p style={{ fontSize: '0.875rem', color: '#d1d5db' }}>
                  have really large approval limits
                </p>
              </Box>
              <p
                style={{
                  fontSize: '0.875rem',
                  color: '#9ca3af',
                  paddingTop: '0.5rem',
                }}
              >
                Visit Portfolio to manage your tokens
              </p>
            </Box>
          )}

          <Box
            width={BlockSize.Full}
            display={Display.Flex}
            flexDirection={FlexDirection.Row}
            justifyContent={JustifyContent.spaceBetween}
            padding={4}
            gap={4}
          >
            <Button
              variant={ButtonVariant.Primary}
              externalLink={true}
              size={ButtonSize.Lg}
              width={BlockSize.Full}
              endIconName={IconName.Arrow2UpRight}
              href="http://localhost:4173/revoke-tokens"
            >
              Visit Portfolio
            </Button>
          </Box>
        </Box>
      </Content>
    </NotificationsPage>
  );
}

export default function NotificationDetails() {
  const { pathname } = useLocation();
  const id = getExtractIdentifier(pathname);

  if (id === TEST_REVOKE_NOTIFICATION_ID) {
    return <RevokeNotificationDetails />;
  }

  return <NotificationDetailsMain />;
}
