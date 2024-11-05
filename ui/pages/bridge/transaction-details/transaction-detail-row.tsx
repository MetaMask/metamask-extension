import React from 'react';
import { Box } from '../../../components/component-library';
import {
  JustifyContent,
  Display,
  FlexDirection,
  AlignItems,
  TextAlign,
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
      <Box style={{ maxWidth: '40%' }} paddingRight={1}>
        {title}
      </Box>
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.flexEnd}
        textAlign={TextAlign.Right}
        paddingLeft={1}
        style={{
          maxWidth: '60%',
        }}
      >
        {value}
      </Box>
    </Box>
  );
}
