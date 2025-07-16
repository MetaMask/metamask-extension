import React from 'react';
import {
  Box,
  IconName,
  IconSize,
  Text,
  Icon,
} from '../../components/component-library';
import {
  BlockSize,
  Display,
  JustifyContent,
  FlexDirection,
  AlignItems,
  TextVariant,
  TextAlign,
} from '../../helpers/constants/design-system';

type NotificationsPlaceholderProps = {
  title: string;
  text: string;
};

export function NotificationsPlaceholder({
  title,
  text,
}: NotificationsPlaceholderProps) {
  return (
    <Box
      height={BlockSize.Full}
      width={BlockSize.Full}
      display={Display.Flex}
      justifyContent={JustifyContent.center}
      alignItems={AlignItems.center}
      flexDirection={FlexDirection.Column}
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
