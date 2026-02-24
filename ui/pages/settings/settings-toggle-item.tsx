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
  description?: React.ReactNode;
  value: boolean;
  onToggle: (value: boolean) => void;
  containerDataTestId?: string;
  dataTestId: string;
  sectionRef?: React.RefObject<HTMLDivElement>;
};

export const SettingsToggleItem = ({
  title,
  description,
  value,
  onToggle,
  containerDataTestId,
  dataTestId,
  sectionRef,
}: SettingsToggleItemProps) => (
  <Box
    ref={sectionRef}
    flexDirection={BoxFlexDirection.Column}
    gap={1}
    marginTop={4}
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
        />
      </div>
    </Box>
    {description && (
      <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
        {description}
      </Text>
    )}
  </Box>
);
