import React from 'react';

import {
  Text,
  TextVariant,
  TextAlign,
  OverflowWrap,
} from '@metamask/design-system-react';
import {
  AlignItems,
  BlockSize,
  Display,
  FlexDirection,
  JustifyContent,
} from '../../../helpers/constants/design-system';
import { Box } from '../../component-library';

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
export const NotificationDetailTitle = ({
  title,
  date,
}: NotificationDetailTitleProps): JSX.Element => {
  return (
    <Box
      display={Display.Flex}
      justifyContent={JustifyContent.center}
      alignItems={AlignItems.center}
      width={BlockSize.Full}
      flexDirection={FlexDirection.Column}
      paddingInlineStart={8}
      paddingInlineEnd={8}
    >
      <Text
        variant={TextVariant.HeadingSm}
        textAlign={TextAlign.Center}
        overflowWrap={OverflowWrap.BreakWord}
        data-testid="notification-details-title"
      >
        {title}
      </Text>
      <Text variant={TextVariant.BodyXs}>{date}</Text>
    </Box>
  );
};
