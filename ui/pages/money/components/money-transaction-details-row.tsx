import React, { type ReactNode } from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  FontWeight,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';

export type MoneyTransactionDetailsRowProps = {
  label: string;
  value: ReactNode;
  testId: string;
  labelEnd?: ReactNode;
};

/**
 * Label / value row on the Money transaction details page.
 *
 * @param options0 - Component props.
 * @param options0.label - Left-side field name.
 * @param options0.value - Right-side field value.
 * @param options0.testId - Test id for the row.
 * @param options0.labelEnd - Optional control rendered after the label.
 * @returns The details row, or null when value is empty.
 */
export function MoneyTransactionDetailsRow({
  label,
  value,
  testId,
  labelEnd,
}: MoneyTransactionDetailsRowProps) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  return (
    <Box
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.Start}
      justifyContent={BoxJustifyContent.Between}
      gap={4}
      paddingTop={2}
      paddingBottom={2}
      data-testid={testId}
    >
      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        gap={1}
        className="shrink-0"
      >
        <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
          {label}
        </Text>
        {labelEnd}
      </Box>
      <Box className="min-w-0 text-right" flexDirection={BoxFlexDirection.Column}>
        {typeof value === 'string' ? (
          <Text
            variant={TextVariant.BodyMd}
            fontWeight={FontWeight.Medium}
            className="break-words"
          >
            {value}
          </Text>
        ) : (
          value
        )}
      </Box>
    </Box>
  );
}
