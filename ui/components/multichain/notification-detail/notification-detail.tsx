import React from 'react';
import type { FC } from 'react';

import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
} from '@metamask/design-system-react';

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
      flexDirection={BoxFlexDirection.Row}
      justifyContent={BoxJustifyContent.Between}
      alignItems={BoxAlignItems.Start}
      paddingBottom={2}
      paddingRight={4}
      paddingLeft={4}
      paddingTop={2}
      className="w-full bg-transparent"
    >
      <Box
        flexDirection={BoxFlexDirection.Row}
        gap={4}
        paddingRight={4}
        alignItems={BoxAlignItems.Start}
        className="h-full"
      >
        <Box className="notification-detail__icon h-full">{icon}</Box>

        <Box
          flexDirection={BoxFlexDirection.Column}
          alignItems={BoxAlignItems.Start}
          className="text-left"
        >
          {/* The item in the left side of the primary row */}
          {primaryTextLeft}
          {/* The item in the left side of the secondary row */}
          {secondaryTextLeft}
        </Box>
      </Box>
      <Box
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.End}
        className="notification-detail__right-container text-right"
      >
        {/* The item in the right side of the primary row */}
        {primaryTextRight ?? null}
        {/* The item in the right side of the secondary row */}
        {secondaryTextRight ?? null}
      </Box>
    </Box>
  );
};
