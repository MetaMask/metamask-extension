import React from 'react';
import { Box, Text } from '../../../../../components/component-library';
import {
  Display,
  FlexDirection,
  JustifyContent,
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
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      justifyContent={JustifyContent.spaceBetween}
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
