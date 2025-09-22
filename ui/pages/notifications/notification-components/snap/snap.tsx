import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom-v5-compat';
import { TRIGGER_TYPES } from '@metamask/notification-services-controller/notification-services';
import {
  NotificationDetailTitle,
  NotificationListItemSnap,
} from '../../../../components/multichain';
import { getSnapsMetadata } from '../../../../selectors';
import { getSnapRoute, getSnapName } from '../../../../helpers/utils/util';
import {
  NotificationComponent,
  NotificationComponentType,
} from '../types/notifications/notifications';
import { formatIsoDateString } from '../../../../helpers/utils/notification.util';
import { SnapUIRenderer } from '../../../../components/app/snaps/snap-ui-renderer';
import {
  AlignItems,
  BackgroundColor,
  Display,
  FlexDirection,
  FontWeight,
} from '../../../../helpers/constants/design-system';
import { Box, IconSize, Text } from '../../../../components/component-library';
import { isOfTypeNodeGuard } from '../node-guard';
import { SnapIcon } from '../../../../components/app/snaps/snap-icon';
import { useMarkNotificationAsRead } from '../../../../hooks/metamask-notifications/useNotifications';
import { SnapUIMarkdown } from '../../../../components/app/snaps/snap-ui-markdown';
import { DetailedViewData, SnapNotification } from './types';
import { SnapFooterButton } from './snap-footer-button';

export const components: NotificationComponent<SnapNotification> = {
  guardFn: isOfTypeNodeGuard([TRIGGER_TYPES.SNAP]),
  item: ({ notification, onClick }) => {
    const navigate = useNavigate();
    const snapsMetadata = useSelector(getSnapsMetadata);
    const snapsNameGetter = getSnapName(snapsMetadata);
    const { markNotificationAsRead } = useMarkNotificationAsRead();

    const handleSnapButton = () => {
      if (!notification.isRead) {
        markNotificationAsRead([
          {
            id: notification.id,
            type: notification.type,
            isRead: notification.isRead,
          },
        ]);
      }

      navigate(getSnapRoute(notification.data.origin));
    };

    return (
      <NotificationListItemSnap
        id={notification.id}
        snapId={notification.data.origin}
        isRead={notification.isRead}
        createdAt={new Date(notification.createdAt)}
        title={{
          items: [
            {
              text: snapsNameGetter(notification.data.origin),
            },
          ],
        }}
        snapMessage={notification.data.message}
        handleSnapClick={onClick}
        handleSnapButton={handleSnapButton}
      />
    );
  },
  details: {
    title: ({ notification }) => (
      <NotificationDetailTitle
        title={
          (notification.data as DetailedViewData).detailedView.title as string
        }
        date={formatIsoDateString(notification.createdAt)}
      />
    ),
    body: {
      type: NotificationComponentType.SnapBody,
      Content: ({ notification }) => {
        const snapsMetadata = useSelector(getSnapsMetadata);
        const snapsNameGetter = getSnapName(snapsMetadata);
        const snapId = notification.data.origin;
        return (
          <>
            <Box
              display={Display.Flex}
              style={{
                borderBottom: '1px solid var(--color-border-muted)',
              }}
              flexDirection={FlexDirection.Column}
              padding={[4, 2, 4, 4]}
            >
              <Box
                display={Display.Flex}
                alignItems={AlignItems.center}
                paddingBottom={2}
              >
                <SnapIcon snapId={snapId} avatarSize={IconSize.Xl} />
                <Text paddingLeft={4} fontWeight={FontWeight.Medium}>
                  {snapsNameGetter(snapId)}
                </Text>
              </Box>
              <SnapUIMarkdown markdown>
                {notification.data.message}
              </SnapUIMarkdown>
            </Box>
            <Box paddingLeft={1} paddingRight={1}>
              <SnapUIRenderer
                snapId={notification.data.origin}
                interfaceId={
                  (notification.data as DetailedViewData).detailedView
                    .interfaceId as string
                }
                contentBackgroundColor={BackgroundColor.backgroundDefault}
              />
            </Box>
          </>
        );
      },
    },
  },
  footer: {
    type: NotificationComponentType.SnapFooter,
    Link: SnapFooterButton,
  },
};
