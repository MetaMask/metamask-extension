import React from 'react';
import { Box, Text } from '../../../components/component-library';
import {
  JustifyContent,
  Display,
  TextVariant,
  BlockSize,
} from '../../../helpers/constants/design-system';

type TransactionDetailRowProps = {
  title: string;
  value: React.ReactNode;
};

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function TransactionDetailRow({
  title,
  value,
}: TransactionDetailRowProps) {
  return (
    <Box
      display={Display.Flex}
      justifyContent={JustifyContent.spaceBetween}
      data-testid="transaction-detail-row"
      width={BlockSize.Full}
    >
      <Text
        minWidth={BlockSize.Max}
        paddingRight={1}
        variant={TextVariant.bodyMd}
      >
        {title}
      </Text>
      {value}
    </Box>
  );
}
