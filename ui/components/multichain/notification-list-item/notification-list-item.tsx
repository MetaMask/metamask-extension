import React from 'react';

import { Box, Icon, IconName, Text } from '../../component-library';
import {
  AlignItems,
  BlockSize,
  Display,
  FlexDirection,
  FontWeight,
  JustifyContent,
  IconColor,
  TextColor,
  TextVariant,
  TextAlign,
} from '../../../helpers/constants/design-system';
import type { NotificationListItemIconProps } from '../notification-list-item-icon/notification-list-item-icon';
import type { NotificationListItemTextProps } from '../notification-list-item-text/notification-list-item-text';
import { NotificationListItemIcon } from '../notification-list-item-icon';
import { NotificationListItemText } from '../notification-list-item-text';
import { formatMenuItemDate } from '../../../helpers/utils/notification.util';

export interface NotificationListItemProps {
  id: string;
  isRead: boolean;
  icon: NotificationListItemIconProps;
  title: NotificationListItemTextProps;
  description: NotificationListItemTextProps;
  createdAt: Date;
  amount?: string;
}

/**
 * `NotificationListItem` is a component that displays a single notification item.
 *
 * @param props - The properties object.
 * @param props.isRead - Indicates whether the notification has been read.
 * @param props.icon - The icon of the notification.
 * @param props.title - The title of the notification.
 * @param props.description - The description of the notification.
 * @param props.createdAt - The date of the notification.
 * @param props.amount - The amount associated with the notification, if applicable.
 * @param props.id - The id of the notification.
 * @returns Returns a notification list item component.
 */
export const NotificationListItem = ({
  id,
  isRead,
  icon,
  title,
  description,
  createdAt,
  amount,
}: NotificationListItemProps) => {
  const handleClick = () => {
    console.log('clicked', id);
  };

  return (
    <Box
      className={`notification-list-item ${
        isRead ? '' : 'notification-list-item--unread'
      }`}
      display={Display.Flex}
      justifyContent={JustifyContent.spaceBetween}
      alignItems={AlignItems.flexStart}
      as="button"
      width={BlockSize.Full}
      paddingBottom={3}
      paddingRight={5}
      paddingLeft={5}
      paddingTop={3}
      onClick={handleClick}
    >
      {!isRead && (
        <Box
          display={Display.Block}
          className="notification-list-item__unread-dot__wrapper"
        >
          <Icon
            name={IconName.FullCircle}
            color={IconColor.primaryDefault}
            className="notification-list-item__unread-dot__dot"
            data-testid="unread-dot"
          />
        </Box>
      )}

      <Box
        display={Display.Flex}
        gap={4}
        paddingRight={4}
        height={BlockSize.Full}
        alignItems={AlignItems.flexStart}
      >
        <Box height={BlockSize.Full} className="notification-list-item__icon">
          <NotificationListItemIcon {...icon} />
        </Box>

        <Box
          display={Display.Block}
          flexDirection={FlexDirection.Column}
          alignItems={AlignItems.flexStart}
          textAlign={TextAlign.Left}
        >
          {/* Notification Title */}
          <NotificationListItemText
            {...title}
            color={TextColor.textAlternative}
          />
          {/* Notification Description */}
          <NotificationListItemText {...description} />
        </Box>
      </Box>
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.flexEnd}
        textAlign={TextAlign.Right}
        className="notification-list-item__right-container"
      >
        {/* Date */}
        <Text
          color={TextColor.textMuted}
          variant={TextVariant.bodySm}
          fontWeight={FontWeight.Normal}
          as="p"
        >
          {formatMenuItemDate(createdAt)}
        </Text>
        {/* Amount */}
        {amount && (
          <Text
            color={TextColor.textDefault}
            variant={TextVariant.bodyMd}
            fontWeight={FontWeight.Normal}
            as="p"
          >
            {amount}
          </Text>
        )}
      </Box>
    </Box>
  );
};
