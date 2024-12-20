import React from 'react';
import { Box, Text } from '../../../components/component-library';
import {
  JustifyContent,
  Display,
  FlexDirection,
  AlignItems,
  TextAlign,
  TextVariant,
  BlockSize,
} from '../../../helpers/constants/design-system';

type TransactionDetailRowProps = {
  title: string;
  value: React.ReactNode;
};

export default function TransactionDetailRow({
  title,
  value,
}: TransactionDetailRowProps) {
  return (
    <Box display={Display.Flex} justifyContent={JustifyContent.spaceBetween}>
      <Box width={BlockSize.OneFourth} paddingRight={1}>
        <Text variant={TextVariant.bodyMd}>{title}</Text>
      </Box>
      <Box
        display={Display.Flex}
        width={BlockSize.ThreeFourths}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.flexEnd}
        textAlign={TextAlign.Right}
        paddingLeft={1}
      >
        <Text variant={TextVariant.bodyMd}>{value}</Text>
      </Box>
    </Box>
  );
}
