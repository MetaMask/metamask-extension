import React from 'react';
import type { FC } from 'react';

import { Box } from '../../component-library';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  Display,
  FlexDirection,
  JustifyContent,
  TextAlign,
} from '../../../helpers/constants/design-system';

export type NotificationDetailProps = {
  icon: JSX.Element;
  primaryTextLeft: JSX.Element;
  primaryTextRight?: JSX.Element;
  secondaryTextLeft: JSX.Element;
  secondaryTextRight?: JSX.Element;
};

/**
 * `NotificationDetail` is a component that displays a single notification item.
 *
 * @param props - The properties object.
 * @param props.icon - The icon for the notification.
 * @param props.primaryTextLeft - The primary text for the left side of the notification.
 * @param props.primaryTextRight - The primary text for the right side of the notification.
 * @param props.secondaryTextLeft - The secondary text for the left side of the notification.
 * @param props.secondaryTextRight - The secondary text for the right side of the notification.
 * @returns Returns a notification list item component.
 */
export const NotificationDetail: FC<NotificationDetailProps> = ({
  icon,
  primaryTextLeft,
  primaryTextRight,
  secondaryTextLeft,
  secondaryTextRight,
}): JSX.Element => {
  return (
    <Box
      display={Display.Flex}
      justifyContent={JustifyContent.spaceBetween}
      alignItems={AlignItems.flexStart}
      as="button"
      width={BlockSize.Full}
      paddingBottom={2}
      paddingRight={4}
      paddingLeft={4}
      paddingTop={2}
      backgroundColor={BackgroundColor.transparent}
    >
      <Box
        display={Display.Flex}
        gap={4}
        paddingRight={4}
        height={BlockSize.Full}
        alignItems={AlignItems.flexStart}
      >
        <Box height={BlockSize.Full} className="notification-detail__icon">
          {icon}
        </Box>

        <Box
          display={Display.Block}
          flexDirection={FlexDirection.Column}
          alignItems={AlignItems.flexStart}
          textAlign={TextAlign.Left}
        >
          {/* The item in the left side of the primary row */}
          {primaryTextLeft}
          {/* The item in the left side of the secondary row */}
          {secondaryTextLeft}
        </Box>
      </Box>
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.flexEnd}
        textAlign={TextAlign.Right}
        className="notification-detail__right-container"
      >
        {/* The item in the right side of the primary row */}
        {primaryTextRight ?? null}
        {/* The item in the right side of the secondary row */}
        {secondaryTextRight ?? null}
      </Box>
    </Box>
  );
};
