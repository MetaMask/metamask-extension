import React from 'react';
import type { FC } from 'react';

import {
  AlignItems,
  BlockSize,
  Display,
  FlexDirection,
  JustifyContent,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { Box, Text } from '../../component-library';

export type NotificationDetailTitleProps = {
  title: string;
  date?: string;
};

/**
 * NotificationDetailTitle component.
 * This component displays the title and date of a notification.
 *
 * @param props - Component props.
 * @param props.title - The title of the notification.
 * @param props.date - The date of the notification.
 * @returns The NotificationDetailTitle component.
 */
export const NotificationDetailTitle: FC<NotificationDetailTitleProps> = ({
  title,
  date,
}): JSX.Element => {
  return (
    <Box
      display={Display.Flex}
      justifyContent={JustifyContent.center}
      alignItems={AlignItems.center}
      width={BlockSize.Full}
      flexDirection={FlexDirection.Column}
    >
      <Text variant={TextVariant.headingSm}>{title}</Text>
      <Text variant={TextVariant.bodyXs}>{date}</Text>
    </Box>
  );
};
