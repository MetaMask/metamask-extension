import React from 'react';
import {
  Box,
  Text,
  TextColor,
  TextVariant,
  FontWeight,
  BoxFlexDirection,
  BoxJustifyContent,
  BoxAlignItems,
} from '@metamask/design-system-react';
import ToggleButton from '../../components/ui/toggle-button';

export type SettingsToggleItemProps = {
  title: string;
  description?: string | React.ReactNode;
  value: boolean;
  onToggle: (value: boolean) => void;
  containerDataTestId?: string;
  dataTestId: string;
  disabled?: boolean;
};

export const SettingsToggleItem = ({
  title,
  description,
  value,
  onToggle,
  containerDataTestId,
  dataTestId,
  disabled,
}: SettingsToggleItemProps) => (
  <Box
    flexDirection={BoxFlexDirection.Column}
    gap={1}
    paddingVertical={3}
    paddingHorizontal={4}
  >
    <Box
      flexDirection={BoxFlexDirection.Row}
      justifyContent={BoxJustifyContent.Between}
      alignItems={BoxAlignItems.Center}
    >
      <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
        {title}
      </Text>
      <div data-testid={containerDataTestId}>
        <ToggleButton
          value={value}
          onToggle={onToggle}
          dataTestId={dataTestId}
          containerStyle={{ width: '40px' }}
          disabled={disabled}
        />
      </div>
    </Box>
    {description &&
      (typeof description === 'string' ? (
        <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
          {description}
        </Text>
      ) : (
        <Text
          variant={TextVariant.BodyMd}
          color={TextColor.TextAlternative}
          asChild
        >
          <div>{description}</div>
        </Text>
      ))}
  </Box>
);
