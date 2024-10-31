import React from 'react';
import { Box } from '../../../components/component-library';
import {
  JustifyContent,
  Display,
  FlexDirection,
  AlignItems,
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
      <Box>{title}</Box>
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.flexEnd}
      >
        {value}
      </Box>
    </Box>
  );
}
