import React from 'react';
import { Box, Text } from '../../component-library';
import {
  BackgroundColor,
  Display,
  JustifyContent,
  AlignItems,
  TextColor,
} from '../../../helpers/constants/design-system';

type AccountDetailsRowProps = {
  label: string;
  value?: string;
  endAccessory: React.ReactNode;
  style?: React.CSSProperties;
  valueColor?: TextColor;
};

export const AccountDetailsRow = ({
  label,
  value,
  valueColor = TextColor.textAlternative,
  endAccessory,
  style,
}: AccountDetailsRowProps) => {
  return (
    <Box
      backgroundColor={BackgroundColor.backgroundAlternative}
      display={Display.Flex}
      justifyContent={JustifyContent.spaceBetween}
      style={{ ...style, height: '48px' }}
      paddingLeft={4}
      paddingRight={4}
      alignItems={AlignItems.center}
    >
      <Text color={TextColor.textDefault}>{label}</Text>
      <Box display={Display.Flex} alignItems={AlignItems.center}>
        <Text color={valueColor}>{value}</Text>
        {endAccessory}
      </Box>
    </Box>
  );
};
