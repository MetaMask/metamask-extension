import React, { useContext } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import {
  NotificationDetailButton,
  NotificationDetailTitle,
  NotificationListItemSnap,
} from '../../../../components/multichain';
import type { SnapNotification } from '../../snap/types/types';
import { getSnapsMetadata } from '../../../../selectors';
import { markNotificationsAsRead } from '../../../../store/actions';
import { getSnapRoute, getSnapName } from '../../../../helpers/utils/util';
import {
  NotificationComponent,
  NotificationComponentType,
} from '../types/notifications/notifications';
import { formatIsoDateString } from '../../../../helpers/utils/notification.util';
import { SnapUIRenderer } from '../../../../components/app/snaps/snap-ui-renderer';
import {
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
    const dispatch = useDispatch();
    const history = useHistory();
    const trackEvent = useContext(MetaMetricsContext);
    const snapsMetadata = useSelector(getSnapsMetadata);
    const snapsNameGetter = getSnapName(snapsMetadata);
    const handleSnapButton = () => {
      dispatch(markNotificationsAsRead([notification.id]));
      trackEvent({
        category: MetaMetricsEventCategory.NotificationInteraction,
        event: MetaMetricsEventName.NotificationClicked,
        properties: {
          notification_id: notification.id,
          notification_type: notification.type,
          previously_read: notification.isRead,
        },
      });
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
            >
              <Box display={Display.Flex}>
                <SnapIcon snapId={snapId} avatarSize={IconSize.Xl} />
                <Text paddingLeft={1}>{snapsNameGetter(snapId)}</Text>
              </Box>
              <Text overflowWrap={OverflowWrap.Normal}>
                {notification.data.message}
              </Text>
            </Box>
            <SnapUIRenderer
              snapId={notification.data.origin}
              interfaceId={
                notification.data.expandedView?.interfaceId as string
              }
              useDelineator={false}
              contentBackgroundColor={BackgroundColor.backgroundDefault}
            />
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
