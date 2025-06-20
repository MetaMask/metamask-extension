import React from 'react';
import { Box, Icon, IconName, IconSize, Text } from '../../component-library';
import {
  BlockSize,
  Display,
  JustifyContent,
  FlexDirection,
  AlignItems,
  TextVariant,
  TextAlign,
  TextColor,
} from '../../../helpers/constants/design-system';

export type NotificationsSettingsTypeProps = {
  icon?: IconName;
  title: string;
  text?: string;
};

export function NotificationsSettingsType({
  icon,
  title,
  text,
}: NotificationsSettingsTypeProps) {
  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      alignItems={AlignItems.center}
      gap={4}
    >
      {icon && <Icon name={icon} size={IconSize.Lg} data-testid="icon" />}
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.stretch}
        justifyContent={JustifyContent.spaceBetween}
        width={BlockSize.Full}
      >
        <Text variant={TextVariant.bodyLgMedium} textAlign={TextAlign.Left}>
          {title}
        </Text>
        {text && (
          <Text
            variant={TextVariant.bodyMd}
            textAlign={TextAlign.Left}
            color={TextColor.textAlternative}
          >
            {text}
          </Text>
        )}
      </Box>
    </Box>
  );
}
