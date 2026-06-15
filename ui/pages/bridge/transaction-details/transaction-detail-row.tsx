import React from 'react';
import { Box, BoxJustifyContent } from '@metamask/design-system-react';
import { Text } from '../../../components/component-library';
import {
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
      className="flex w-full"
      justifyContent={BoxJustifyContent.Between}
      data-testid="transaction-detail-row"
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
