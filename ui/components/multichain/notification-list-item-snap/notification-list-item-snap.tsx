import React from 'react';

import { Box, Icon, IconName, Text, IconSize } from '../../component-library';
import {
  AlignItems,
  BlockSize,
  BackgroundColor,
  Display,
  FlexDirection,
  FontWeight,
  JustifyContent,
  IconColor,
  TextColor,
  TextVariant,
  TextAlign,
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
      className={`notification-list-item ${
        isRead ? '' : 'notification-list-item--unread'
      }`}
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      justifyContent={JustifyContent.spaceBetween}
      alignItems={AlignItems.flexStart}
      width={BlockSize.Full}
      paddingBottom={3}
      paddingRight={5}
      paddingLeft={5}
      paddingTop={3}
      key={id}
      onClick={handleClick}
      style={{ cursor: 'pointer' }}
    >
      <Box
        display={Display.Flex}
        justifyContent={JustifyContent.spaceBetween}
        flexDirection={FlexDirection.Row}
        alignItems={AlignItems.flexStart}
        width={BlockSize.Full}
        backgroundColor={BackgroundColor.transparent}
        gap={4}
        height={BlockSize.Full}
        style={{ paddingLeft: '6px', paddingRight: '6px', paddingTop: '2px' }}
      >
        {!isRead && (
          <Box
            display={Display.Block}
            className="notification-list-item__unread-dot__wrapper--snap"
          >
            <Icon
              name={IconName.FullCircle}
              color={IconColor.primaryDefault}
              className="notification-list-item__unread-dot__dot"
              data-testid="unread-dot"
            />
          </Box>
        )}

        <Box height={BlockSize.Full} className="notification-list-item__icon">
          <SnapIcon snapId={snapId} avatarSize={IconSize.Md} />
        </Box>

        <Box
          display={Display.Flex}
          gap={4}
          height={BlockSize.Full}
          alignItems={AlignItems.flexStart}
          width={BlockSize.Full}
        >
          <Box
            display={Display.Block}
            flexDirection={FlexDirection.Column}
            alignItems={AlignItems.flexStart}
            textAlign={TextAlign.Left}
            width={BlockSize.Full}
          >
            <Box
              display={Display.Flex}
              flexDirection={FlexDirection.Row}
              alignItems={AlignItems.flexStart}
              justifyContent={JustifyContent.spaceBetween}
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
            <Box
              color={TextColor.textDefault}
              className="snap-notifications__item__details__message"
            >
              <SnapUIMarkdown markdown>{snapMessage}</SnapUIMarkdown>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
