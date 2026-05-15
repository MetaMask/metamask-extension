import React from 'react';

import {
  Button,
  ButtonSize,
  ButtonVariant,
  Icon,
  IconName,
  IconColor,
  IconSize,
  Box,
  BoxAlignItems,
  BoxBackgroundColor,
  BoxFlexDirection,
  BoxJustifyContent,
} from '@metamask/design-system-react';
import { Text } from '../../component-library';
import {
  FontWeight,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import type { NotificationListItemIconProps } from '../notification-list-item-icon/notification-list-item-icon';
import type { NotificationListItemTextProps } from '../notification-list-item-text/notification-list-item-text';
import { NotificationListItemIcon } from '../notification-list-item-icon';
import { NotificationListItemText } from '../notification-list-item-text';
import { formatMenuItemDate } from '../../../helpers/utils/notification.util';

type BaseProps = {
  id: string;
  isRead: boolean;
  icon: NotificationListItemIconProps;
  title: NotificationListItemTextProps;
  description: NotificationListItemTextProps;
  createdAt: Date;
  onClick: () => void;
};

type BaseNotification = BaseProps;
type NotificationToken = BaseProps & { amount: string };
type NotificationPlatform = BaseProps & {
  cta?: { content: string; link: string };
};

export type NotificationListItemProps =
  | BaseNotification
  | NotificationToken
  | NotificationPlatform;

const CTAButton = (props: {
  content: string;
  link: string;
  onClick: () => void;
}) => (
  <Button
    variant={ButtonVariant.Secondary}
    size={ButtonSize.Md}
    onClick={() => {
      props.onClick();
      global.platform.openTab({ url: props.link });
    }}
    isFullWidth
    endIconName={IconName.Arrow2UpRight}
  >
    {props.content}
  </Button>
);

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
 * @param props.onClick - The function to call when the notification is clicked.
 * @returns Returns a notification list item component.
 */
export const NotificationListItem = ({
  id,
  isRead,
  icon,
  title,
  description,
  createdAt,
  onClick,
  ...restProps
}: NotificationListItemProps) => {
  const handleClick = () => {
    onClick();
  };

  return (
    <Box
      justifyContent={BoxJustifyContent.Between}
      alignItems={BoxAlignItems.Start}
      className={`w-full flex-col notification-list-item ${
        isRead ? '' : 'notification-list-item--unread'
      }`}
      paddingBottom={3}
      paddingRight={5}
      paddingLeft={5}
      paddingTop={3}
      gap={2}
      key={id}
    >
      <Box
        asChild
        justifyContent={BoxJustifyContent.Between}
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Start}
        className="w-full"
        backgroundColor={BoxBackgroundColor.Transparent}
      >
        <button onClick={handleClick}>
          {!isRead && (
            <Box className="block notification-list-item__unread-dot__wrapper">
              <Icon
                name={IconName.FullCircle}
                color={IconColor.InfoDefault}
                size={IconSize.Xs}
                className="notification-list-item__unread-dot__dot"
                data-testid="unread-dot"
              />
            </Box>
          )}

          <Box
            gap={4}
            paddingRight={4}
            className="h-full"
            alignItems={BoxAlignItems.Start}
          >
            <Box className="h-full notification-list-item__icon">
              <NotificationListItemIcon {...icon} />
            </Box>

            <Box
              className="block w-full text-left"
              flexDirection={BoxFlexDirection.Column}
              alignItems={BoxAlignItems.Start}
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
            flexDirection={BoxFlexDirection.Column}
            alignItems={BoxAlignItems.End}
            className="text-right notification-list-item__right-container"
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
            {'amount' in restProps && (
              <Text
                color={TextColor.textDefault}
                variant={TextVariant.bodyMd}
                fontWeight={FontWeight.Normal}
                as="p"
              >
                {restProps.amount}
              </Text>
            )}
          </Box>
        </button>
      </Box>

      {/* CTA Button */}
      {'cta' in restProps && restProps.cta && (
        <CTAButton
          content={restProps.cta.content}
          link={restProps.cta.link}
          onClick={handleClick}
        />
      )}
    </Box>
  );
};
