///: BEGIN:ONLY_INCLUDE_IF(musd-conversion)
/**
 * MusdOverrideContent Component
 *
 * Override content component for the CustomAmountInfo in mUSD conversion flow.
 * Renders the OutputAmountTag showing the expected mUSD output and the PayWithRow
 * for token selection.
 *
 * Ported from metamask-mobile:
 * app/components/Views/confirmations/components/info/musd-conversion-info/musd-conversion-info.tsx
 */

import React from 'react';
import { Box } from '../../../../../components/component-library';
import {
  AlignItems,
  Display,
  FlexDirection,
} from '../../../../../helpers/constants/design-system';
import { useTransactionPayAvailableTokens } from '../../../hooks/pay/useTransactionPayAvailableTokens';
import { PayWithRow } from '../../rows/pay-with-row/pay-with-row';
import { useCustomAmount } from '../../../hooks/musd/useCustomAmount';
import { OutputAmountTag } from './output-amount-tag';

export type MusdOverrideContentProps = {
  /**
   * Human-readable amount string (e.g., "100.50")
   */
  amountHuman: string;
};

/**
 * Override content component for mUSD conversion.
 * Displays the expected mUSD output amount and payment token selector.
 *
 * @param options0
 * @param options0.amountHuman
 */
export const MusdOverrideContent: React.FC<MusdOverrideContentProps> = ({
  amountHuman,
}) => {
  const { shouldShowOutputAmountTag, outputAmount, outputSymbol } =
    useCustomAmount({ amountHuman });
  const availableTokens = useTransactionPayAvailableTokens();
  const hasTokens = availableTokens.length > 0;

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      alignItems={AlignItems.center}
      gap={3}
    >
      {shouldShowOutputAmountTag && outputAmount !== null && (
        <OutputAmountTag
          amount={outputAmount}
          symbol={outputSymbol ?? undefined}
          showBackground={false}
        />
      )}
      {hasTokens && <PayWithRow />}
    </Box>
  );
};

export default MusdOverrideContent;
///: END:ONLY_INCLUDE_IF
