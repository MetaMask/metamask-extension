import React from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
} from '@metamask/design-system-react';
import {
  IconName,
  IconSize,
  Text,
  Icon,
} from '../../components/component-library';
import { TextVariant, TextAlign } from '../../helpers/constants/design-system';

type NotificationsPlaceholderProps = {
  title: string;
  text: string;
};

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export function NotificationsPlaceholder({
  title,
  text,
}: NotificationsPlaceholderProps) {
  return (
    <Box
      className="h-full w-full"
      justifyContent={BoxJustifyContent.Center}
      alignItems={BoxAlignItems.Center}
      flexDirection={BoxFlexDirection.Column}
      gap={2}
      data-testid="notifications-list-placeholder"
    >
      <Icon name={IconName.Notification} size={IconSize.Xl} />
      <Text variant={TextVariant.headingSm}>{title}</Text>
      <Text variant={TextVariant.bodyMd} textAlign={TextAlign.Center}>
        {text}
      </Text>
    </Box>
  );
}
