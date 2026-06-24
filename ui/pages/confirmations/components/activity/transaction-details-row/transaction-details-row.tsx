import React from 'react';
import {
  Box,
  BoxFlexDirection,
  BoxJustifyContent,
} from '@metamask/design-system-react';
import { Text } from '../../../../../components/component-library';
import {
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';

export type TransactionDetailsRowProps = {
  children: React.ReactNode;
  label: string;
  'data-testid'?: string;
};

// eslint-disable-next-line @typescript-eslint/naming-convention
export function TransactionDetailsRow({
  children,
  label,
  'data-testid': dataTestId,
}: TransactionDetailsRowProps) {
  return (
    <Box
      className="flex"
      flexDirection={BoxFlexDirection.Row}
      justifyContent={BoxJustifyContent.Between}
      data-testid={dataTestId}
    >
      <Text
        variant={TextVariant.bodyMdMedium}
        color={TextColor.textAlternative}
      >
        {label}
      </Text>
      {children}
    </Box>
  );
}
