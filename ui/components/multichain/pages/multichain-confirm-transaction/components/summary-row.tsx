import React, { PropsWithChildren } from 'react';
import {
  AlignItems,
  Display,
  FlexDirection,
  FontWeight,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { Box, Text } from '../../../../component-library';

export type SummaryRowProps = {
  label: string;
};

export const SummaryRow = ({
  label,
  children,
}: PropsWithChildren<SummaryRowProps>) => {
  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      justifyContent={JustifyContent.spaceBetween}
      marginBottom={1}
    >
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        alignItems={AlignItems.center}
      >
        <Text
          fontWeight={FontWeight.Medium}
          color={TextColor.textAlternative}
          variant={TextVariant.bodyMd}
        >
          {label}
        </Text>
      </Box>
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        alignItems={AlignItems.center}
      >
        {children}
      </Box>
    </Box>
  );
};
