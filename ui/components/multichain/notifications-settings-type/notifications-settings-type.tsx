import React from 'react';
import {
  Box,
  Icon,
  IconName,
  IconSize,
  Text,
  BoxFlexDirection,
  BoxAlignItems,
  BoxJustifyContent,
  TextVariant,
  TextAlign,
  TextColor,
  FontWeight,
} from '@metamask/design-system-react';

export type NotificationsSettingsTypeProps = {
  icon?: IconName;
  title: string;
  text?: string;
};

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860

export function NotificationsSettingsType({
  icon,
  title,
  text,
}: NotificationsSettingsTypeProps) {
  return (
    <Box
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.Center}
      gap={4}
    >
      {icon && <Icon name={icon} size={IconSize.Lg} data-testid="icon" />}
      <Box
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.Stretch}
        justifyContent={BoxJustifyContent.Between}
        className="w-full"
      >
        <Text
          variant={TextVariant.BodyMd}
          fontWeight={FontWeight.Medium}
          textAlign={TextAlign.Left}
        >
          {title}
        </Text>
        {text && (
          <Text
            variant={TextVariant.BodyMd}
            fontWeight={FontWeight.Regular}
            textAlign={TextAlign.Left}
            color={TextColor.TextAlternative}
          >
            {text}
          </Text>
        )}
      </Box>
    </Box>
  );
}
