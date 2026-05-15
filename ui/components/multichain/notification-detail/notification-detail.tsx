import React from 'react';

import { Box, BoxAlignItems, BoxBackgroundColor, BoxFlexDirection, BoxJustifyContent } from '@metamask/design-system-react';
import {
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
export const NotificationDetail = ({
  icon,
  primaryTextLeft,
  primaryTextRight,
  secondaryTextLeft,
  secondaryTextRight,
}: NotificationDetailProps): JSX.Element => {
  return (
    <Box
      justifyContent={BoxJustifyContent.Between}
      alignItems={BoxAlignItems.Start}
      className="w-full"
      paddingBottom={2}
      paddingRight={4}
      paddingLeft={4}
      paddingTop={2}
      backgroundColor={BoxBackgroundColor.Transparent}
    >
      <Box
        gap={4}
        paddingRight={4}
        className="h-full"
        alignItems={BoxAlignItems.Start}
      >
        <Box className="h-full notification-detail__icon">
          {icon}
        </Box>

        <Box
          className="block text-left"
          flexDirection={BoxFlexDirection.Column}
          alignItems={BoxAlignItems.Start}
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
        className="text-right notification-detail__right-container"
      >
        {/* The item in the right side of the primary row */}
        {primaryTextRight ?? null}
        {/* The item in the right side of the secondary row */}
        {secondaryTextRight ?? null}
      </Box>
    </Box>
  );
};
