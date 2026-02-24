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
import ToggleButton from '../../../components/ui/toggle-button';

export type ExperimentalTabItemProps = {
  title: string;
  description: React.ReactNode;
  toggleValue: boolean;
  toggleCallback: (value: boolean) => void;
  toggleDataTestId: string;
  sectionRef?: React.RefObject<HTMLDivElement>;
};

export const ExperimentalTabItem = ({
  title,
  description,
  toggleValue,
  toggleCallback,
  toggleDataTestId,
  sectionRef,
}: ExperimentalTabItemProps) => (
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
      <ToggleButton
        value={toggleValue}
        onToggle={toggleCallback}
        dataTestId={toggleDataTestId}
      />
    </Box>
    <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
      {description}
    </Text>
  </Box>
);
