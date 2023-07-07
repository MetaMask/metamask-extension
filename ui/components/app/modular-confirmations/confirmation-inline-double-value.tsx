import React from 'react';
import { Box, Text } from '../../component-library';
import {
  AlignItems,
  Display,
  FlexDirection,
  TextColor,
} from '../../../helpers/constants/design-system';

export type ConfirmationInlineDoubleValueProps = {
  left: string;
  right: string;
};

export const ConfirmationInlineDoubleValue = ({
  left,
  right,
}: ConfirmationInlineDoubleValueProps) => (
  <Box
    display={Display.Flex}
    flexDirection={FlexDirection.Row}
    alignItems={AlignItems.center}
  >
    <Text color={TextColor.textMuted}>{left}</Text>
    <Text marginLeft={2}>{right}</Text>
  </Box>
);
