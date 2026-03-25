import React from 'react';
import { Box, Text } from '../../../component-library';
import {
  Display,
  FlexDirection,
  FontWeight,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
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
  const textVariant = isSmall ? TextVariant.bodyMd : TextVariant.bodyMdMedium;

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
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
            valueColor = TextColor.textAlternative,
          },
          index,
        ) => (
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
                fontWeight={emphasizeValue ? FontWeight.Medium : undefined}
                data-testid={dataTestId ? `${dataTestId}-value` : undefined}
              >
                {value}
              </Text>
            )}
          </ConfirmInfoRow>
        ),
      )}
    </Box>
  );
};
