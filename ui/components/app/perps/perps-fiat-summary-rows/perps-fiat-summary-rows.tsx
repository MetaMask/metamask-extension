import React from 'react';
import {
  Box,
  BoxFlexDirection,
  FontWeight,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { ConfirmInfoRow, ConfirmInfoRowSize } from '../../confirm/info/row/row';
import type { PerpsFiatSummaryRowsProps } from './perps-fiat-summary-rows.types';

/**
 * Confirmation-style key/value rows for standalone Perps flows (e.g. withdraw).
 * Mirrors small-row typography from `TotalRow` / `BridgeTimeRow` in confirmations.
 * @param options0
 * @param options0.rows
 * @param options0.rowVariant
 */
export const PerpsFiatSummaryRows: React.FC<PerpsFiatSummaryRowsProps> = ({
  rows,
  rowVariant = ConfirmInfoRowSize.Small,
}) => {
  const isSmall = rowVariant === ConfirmInfoRowSize.Small;
  const textVariant = TextVariant.BodyMd;

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      gap={2}
      paddingBottom={4}
      data-testid="perps-fiat-summary-rows"
    >
      {rows.map(
        (
          {
            label,
            value,
            valueContent,
            'data-testid': dataTestId,
            emphasizeValue,
            valueColor = TextColor.TextAlternative,
          },
          index,
        ) => {
          const valueFontWeight =
            emphasizeValue || !isSmall ? FontWeight.Medium : undefined;

          return (
            <ConfirmInfoRow
              key={`${label}-${index}`}
              label={label}
              rowVariant={rowVariant}
              data-testid={dataTestId}
            >
              {valueContent ?? (
                <Text
                  variant={textVariant}
                  color={valueColor}
                  fontWeight={valueFontWeight}
                  data-testid={dataTestId ? `${dataTestId}-value` : undefined}
                >
                  {value}
                </Text>
              )}
            </ConfirmInfoRow>
          );
        },
      )}
    </Box>
  );
};
