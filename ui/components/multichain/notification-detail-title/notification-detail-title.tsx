import React from 'react';

import {
  TextVariant,
  TextAlign,
  OverflowWrap,
} from '../../../helpers/constants/design-system';
import { Box, BoxAlignItems, BoxFlexDirection, BoxJustifyContent } from '@metamask/design-system-react';
import { Text } from '../../component-library';

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
      justifyContent={BoxJustifyContent.Center}
      alignItems={BoxAlignItems.Center}
      className="w-full"
      flexDirection={BoxFlexDirection.Column}
      paddingInlineStart={8}
      paddingInlineEnd={8}
    >
      <Text
        variant={TextVariant.headingSm}
        textAlign={TextAlign.Center}
        overflowWrap={OverflowWrap.BreakWord}
      >
        {title}
      </Text>
      <Text variant={TextVariant.bodyXs}>{date}</Text>
    </Box>
  );
};
