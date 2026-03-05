import React, { type ReactNode } from 'react';
import {
  Box,
  Text,
  TextVariant,
  FontWeight,
  BoxFlexDirection,
  BoxJustifyContent,
  BoxAlignItems,
  IconName,
  ButtonIcon,
  ButtonIconSize,
  TextColor,
} from '@metamask/design-system-react';

type SettingsSelectItemProps = {
  label: string;
  /** Text value to display, or a ReactNode for custom content (e.g., icon + text) */
  value: string | ReactNode;
  onPress: () => void;
  ariaLabel: string;
};

export const SettingsSelectItem = ({
  label,
  value,
  onPress,
  ariaLabel,
}: SettingsSelectItemProps) => {
  return (
    <Box
      flexDirection={BoxFlexDirection.Row}
      justifyContent={BoxJustifyContent.Between}
      alignItems={BoxAlignItems.Center}
      paddingVertical={3}
    >
      <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
        {label}
      </Text>
      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        gap={1}
      >
        {typeof value === 'string' ? (
          <Text
            color={TextColor.TextAlternative}
            variant={TextVariant.BodyMd}
            fontWeight={FontWeight.Medium}
          >
            {value}
          </Text>
        ) : (
          value
        )}
        <ButtonIcon
          iconName={IconName.ArrowRight}
          size={ButtonIconSize.Sm}
          className="text-icon-alternative"
          onClick={onPress}
          ariaLabel={ariaLabel}
        />
      </Box>
    </Box>
  );
};
