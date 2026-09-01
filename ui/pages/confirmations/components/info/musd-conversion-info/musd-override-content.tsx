/**
 * MusdOverrideContent Component
 *
 * Override content component for the CustomAmountInfo in mUSD conversion flow.
 * Renders the OutputAmountTag showing the expected mUSD output.
 *
 * Ported from metamask-mobile:
 * app/components/Views/confirmations/components/info/musd-conversion-info/musd-conversion-info.tsx
 */

import React from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
} from '@metamask/design-system-react';
import { useCustomAmount } from '../../../../../hooks/musd/useCustomAmount';
import { OutputAmountTag } from './output-amount-tag';

export type MusdOverrideContentProps = {
  /**
   * Human-readable amount string (e.g., "100.50")
   */
  amountHuman: string;
};

/**
 * Override content component for mUSD conversion.
 * Displays the expected mUSD output amount. The payment token selector is
 * rendered as the bottom "Pay with" row (see MusdBottomContent), which is
 * visible from the initial state onward.
 *
 * @param options0
 * @param options0.amountHuman
 */
export const MusdOverrideContent = ({
  amountHuman,
}: MusdOverrideContentProps) => {
  const { shouldShowOutputAmountTag, outputAmount, outputSymbol } =
    useCustomAmount({ amountHuman });

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      alignItems={BoxAlignItems.Center}
      gap={3}
    >
      {shouldShowOutputAmountTag && outputAmount !== null && (
        <OutputAmountTag
          amount={outputAmount}
          symbol={outputSymbol ?? undefined}
          showBackground={false}
        />
      )}
    </Box>
  );
};

export default MusdOverrideContent;
