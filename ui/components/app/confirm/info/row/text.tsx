import React from 'react';
import { Box, Text } from '../../../../component-library';
import {
  AlignItems,
  Display,
  FlexWrap,
  TextColor,
} from '../../../../../helpers/constants/design-system';

export type ConfirmInfoRowTextProps = {
  text: string;
};

export const ConfirmInfoRowText = ({ text }: ConfirmInfoRowTextProps) => {
  return (
    <Box
      display={Display.Flex}
      alignItems={AlignItems.center}
      flexWrap={FlexWrap.Wrap}
      gap={2}
    >
      <Text color={TextColor.inherit}>{text}</Text>
    </Box>
  );
};
