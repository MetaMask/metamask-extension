import React from 'react';

import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
} from '@metamask/design-system-react';
import { Icon, IconName, Text, IconSize } from '../../component-library';
import {
  FontWeight,
  IconColor,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import type { NotificationListItemTextProps } from '../notification-list-item-text/notification-list-item-text';
import { NotificationListItemText } from '../notification-list-item-text';
import { formatMenuItemDate } from '../../../helpers/utils/notification.util';
import { SnapUIMarkdown } from '../../app/snaps/snap-ui-markdown';
import { SnapIcon } from '../../app/snaps/snap-icon';

export type NotificationListItemSnapProps = {
  id: string;
  snapId: string;
  isRead: boolean;
  title: NotificationListItemTextProps;
  snapMessage: string;
  createdAt: Date;
  handleSnapClick?: () => void;
  handleSnapButton?: () => void;
};

/**
 * `NotificationListItem` is a component that displays a single notification item.
 *
 * @param props - The properties object.
 * @param props.isRead - Indicates whether the notification has been read.
 * @param props.title - The title of the notification.
 * @param props.createdAt - The date of the notification.
 * @param props.id - The id of the notification.
 * @param props.snapId - The id of the Snap that created the notification.
 * @param props.handleSnapClick - The function to call when the notification is clicked.
 * @param props.handleSnapButton - The function to call when the snap button is clicked.
 * @param props.snapMessage - The snap message to display on the notification.
 * @returns Returns a notification list item component.
 */
export const NotificationListItemSnap = ({
  id,
  isRead,
  title,
  snapMessage,
  createdAt,
  snapId,
  handleSnapClick,
  handleSnapButton,
}: NotificationListItemSnapProps) => {
  const handleClick = () => {
    handleSnapClick?.();
  };

  const handleButtonClick = () => {
    handleSnapButton?.();
  };

  return (
    <Box
      className={`notification-list-item w-full ${
        isRead ? '' : 'notification-list-item--unread'
      }`}
      flexDirection={BoxFlexDirection.Column}
      justifyContent={BoxJustifyContent.Between}
      alignItems={BoxAlignItems.Start}
      paddingBottom={3}
      paddingRight={5}
      paddingLeft={5}
      paddingTop={3}
      key={id}
      onClick={handleClick}
      style={{ cursor: 'pointer' }}
    >
      <Box
        flexDirection={BoxFlexDirection.Row}
        justifyContent={BoxJustifyContent.Between}
        alignItems={BoxAlignItems.Start}
        gap={4}
        className="w-full h-full bg-transparent"
        style={{ paddingLeft: '6px', paddingRight: '6px', paddingTop: '2px' }}
      >
        {!isRead && (
          <Box className="notification-list-item__unread-dot__wrapper--snap block">
            <Icon
              name={IconName.FullCircle}
              color={IconColor.primaryDefault}
              className="notification-list-item__unread-dot__dot"
              data-testid="unread-dot"
            />
          </Box>
        )}

        <Box className="notification-list-item__icon h-full">
          <SnapIcon snapId={snapId} avatarSize={IconSize.Md} />
        </Box>

        <Box
          flexDirection={BoxFlexDirection.Row}
          gap={4}
          alignItems={BoxAlignItems.Start}
          className="w-full h-full"
        >
          <Box className="block text-left w-full">
            <Box
              flexDirection={BoxFlexDirection.Row}
              alignItems={BoxAlignItems.Start}
              justifyContent={BoxJustifyContent.Between}
            >
              {/* Notification Title */}
              <Box onClick={handleButtonClick}>
                <NotificationListItemText
                  {...title}
                  color={TextColor.primaryDefault}
                />
              </Box>

              {/* Date */}
              <Text
                color={TextColor.textMuted}
                variant={TextVariant.bodySm}
                fontWeight={FontWeight.Normal}
                as="p"
              >
                {formatMenuItemDate(createdAt)}
              </Text>
            </Box>

            {/* Snap Message */}
            <Box className="snap-notifications__item__details__message text-default">
              <SnapUIMarkdown markdown>{snapMessage}</SnapUIMarkdown>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
