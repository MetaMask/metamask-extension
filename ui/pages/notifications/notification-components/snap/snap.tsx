import React from 'react';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import {
  NotificationDetailButton,
  NotificationDetailTitle,
  NotificationListItemSnap,
} from '../../../../components/multichain';
import type { SnapNotification } from '../../snap/types/types';
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
  OverflowWrap,
} from '../../../../helpers/constants/design-system';
import {
  Box,
  ButtonVariant,
  IconSize,
  Text,
} from '../../../../components/component-library';
import { isOfTypeNodeGuard } from '../node-guard';
import { TRIGGER_TYPES } from '..';
import { SnapIcon } from '../../../../components/app/snaps/snap-icon';

export const components: NotificationComponent<SnapNotification> = {
  guardFn: isOfTypeNodeGuard(['snap' as typeof TRIGGER_TYPES.SNAP]),
  item: ({ notification, onClick }) => {
    const history = useHistory();
    const snapsMetadata = useSelector(getSnapsMetadata);
    const snapsNameGetter = getSnapName(snapsMetadata);
    const handleSnapButton = () => {
      history.push(getSnapRoute(notification.data.origin));
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
              text: snapsNameGetter(notification.data.origin) ?? 'Unknown Snap',
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
        title={notification.data.expandedView?.title as string}
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
                border: '1px solid var(--color-border-muted)',
              }}
              flexDirection={FlexDirection.Column}
              padding={[4, 3, 4, 3]}
            >
              <Box
                display={Display.Flex}
                alignItems={AlignItems.center}
                paddingBottom={2}
              >
                <SnapIcon snapId={snapId} avatarSize={IconSize.Xl} />
                <Text paddingLeft={4}>{snapsNameGetter(snapId)}</Text>
              </Box>
              <Text overflowWrap={OverflowWrap.Normal}>
                {notification.data.message}
              </Text>
            </Box>
            <Box paddingLeft={1} paddingRight={1}>
              <SnapUIRenderer
                snapId={notification.data.origin}
                interfaceId={
                  notification.data.expandedView?.interfaceId as string
                }
                useDelineator={false}
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
    Link: ({ notification }) =>
      notification.data.expandedView?.footerLink ? (
        <NotificationDetailButton
          notification={notification}
          text={notification.data.expandedView?.footerLink.text as string}
          href={notification.data.expandedView?.footerLink.href as string}
          id={notification.id}
          variant={ButtonVariant.Secondary}
        />
      ) : null,
  },
};
