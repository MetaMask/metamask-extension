///: BEGIN:ONLY_INCLUDE_IF(musd-conversion)
/**
 * OutputAmountTag Component
 *
 * A pill-shaped tag component that displays the output amount for mUSD conversion.
 * Shows the expected amount of mUSD the user will receive.
 *
 * Ported from metamask-mobile:
 * app/components/UI/Earn/components/OutputAmountTag/OutputAmountTag.tsx
 */

import React from 'react';
import { Box, Text } from '../../../../../components/component-library';
import {
  BackgroundColor,
  BorderRadius,
  Display,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';

export const OUTPUT_AMOUNT_TAG_SELECTOR = 'output-amount-tag';

export type OutputAmountTagProps = {
  /**
   * Amount to display
   */
  amount: string;
  /**
   * Token symbol to display after the amount
   */
  symbol?: string;
  /**
   * Whether to show the background color
   *
   * @default true
   */
  showBackground?: boolean;
  /**
   * Optional test ID for the component
   */
  testID?: string;
};

/**
 * Generic tag component that displays an output amount with symbol.
 * Used in conversion flows to show the expected output amount.
 *
 * @param options0
 * @param options0.amount
 * @param options0.symbol
 * @param options0.showBackground
 * @param options0.testID
 */
export const OutputAmountTag: React.FC<OutputAmountTagProps> = ({
  amount,
  symbol,
  showBackground = true,
  testID,
}) => {
  const displayText = symbol ? `${amount} ${symbol}` : amount;

  return (
    <Box
      display={Display.Flex}
      justifyContent={JustifyContent.center}
      backgroundColor={
        showBackground ? BackgroundColor.backgroundAlternative : undefined
      }
      borderRadius={BorderRadius.pill}
      paddingLeft={4}
      paddingRight={4}
      paddingTop={2}
      paddingBottom={2}
      marginBottom={2}
      data-testid={testID || OUTPUT_AMOUNT_TAG_SELECTOR}
    >
      <Text variant={TextVariant.bodySmMedium} color={TextColor.textDefault}>
        {displayText}
      </Text>
    </Box>
  );
};

export default OutputAmountTag;
///: END:ONLY_INCLUDE_IF
