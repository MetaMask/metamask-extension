/**
 * MusdOverrideContent Component
 *
 * Override content component for the CustomAmountInfo in mUSD conversion flow.
 * Renders the OutputAmountTag showing the expected mUSD output and the
 * PayWithPill for token selection.
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
import { useTransactionPayAvailableTokens } from '../../../hooks/pay/useTransactionPayAvailableTokens';
import { useTransactionPayToken } from '../../../hooks/pay/useTransactionPayToken';
import { PayWithPill, PayWithPillSkeleton } from '../../pay-with-pill';
import { useCustomAmount } from '../../../../../hooks/musd/useCustomAmount';
import { OutputAmountTag } from './output-amount-tag';

export type MusdOverrideContentProps = {
  /**
   * Human-readable amount string (e.g., "100.50")
   */
  amountHuman: string;
  /** When false, shows the centered PayWithPill (selector moves to the bottom row when true). */
  hasInput: boolean;
};

/**
 * Override content component for mUSD conversion.
 * Displays the expected mUSD output amount and payment token selector.
 *
 * @param options0
 * @param options0.amountHuman
 * @param options0.hasInput
 */
export const MusdOverrideContent = ({
  amountHuman,
  hasInput,
}: MusdOverrideContentProps) => {
  const { shouldShowOutputAmountTag, outputAmount, outputSymbol } =
    useCustomAmount({ amountHuman });
  const { payToken } = useTransactionPayToken();
  const availableTokens = useTransactionPayAvailableTokens();
  const hasTokens = availableTokens.length > 0;

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
      {!hasInput &&
        (hasTokens && payToken ? <PayWithPill /> : <PayWithPillSkeleton />)}
    </Box>
  );
};

export default MusdOverrideContent;
