/**
 * useCustomAmount Hook
 *
 * Hook for managing custom amount logic in mUSD conversion flows.
 * Determines whether to show the output amount tag based on transaction type
 * and feature flag state.
 *
 * Ported from metamask-mobile:
 * app/components/Views/confirmations/hooks/earn/useCustomAmount.tsx
 */

import { TransactionType } from '@metamask/transaction-controller';
import type { TransactionMeta } from '@metamask/transaction-controller';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { selectIsMusdConversionFlowEnabled } from '../../selectors/musd';
import { useConfirmContext } from '../../pages/confirmations/context/confirm';

export type UseCustomAmountParams = {
  /**
   * The human-readable amount (e.g., "100.50")
   * Used to calculate output amount display
   */
  amountHuman: string;
};

export type UseCustomAmountResult = {
  /** Whether to show an output amount tag instead of PayTokenAmount */
  shouldShowOutputAmountTag: boolean;
  /** Output amount for the tag (formatted, null when not applicable) */
  outputAmount: string | null;
  /** Symbol for the output amount (null when not applicable) */
  outputSymbol: string | null;
};

/**
 * Limits a number to maximum decimal places
 *
 * @param num - Number to format
 * @param maxDecimals - Maximum decimal places (default: 2)
 * @returns Formatted string with specified decimal places
 */
function limitToMaximumDecimalPlaces(num: number, maxDecimals: number): string {
  if (isNaN(num)) {
    return (0).toFixed(maxDecimals);
  }
  return num.toFixed(maxDecimals);
}

/**
 * Hook for managing custom amount logic in custom amount flows.
 * Encapsulates transaction type detection and output amount calculation.
 *
 * @param params - Hook parameters including the amount for output calculation
 * @param params.amountHuman
 * @returns Custom amount state for UI integration
 */
export const useCustomAmount = ({
  amountHuman,
}: UseCustomAmountParams): UseCustomAmountResult => {
  const isMusdConversionFlowEnabled = useSelector(
    selectIsMusdConversionFlowEnabled,
  );
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();

  const isMusdConversion =
    isMusdConversionFlowEnabled &&
    currentConfirmation?.type === TransactionType.musdConversion;

  // Output amount tag logic - currently for mUSD conversion only
  const shouldShowOutputAmountTag = isMusdConversion;

  const outputAmount = useMemo(() => {
    if (!shouldShowOutputAmountTag) {
      return null;
    }
    return limitToMaximumDecimalPlaces(parseFloat(amountHuman) || 0, 2);
  }, [shouldShowOutputAmountTag, amountHuman]);

  const outputSymbol = useMemo(() => {
    if (!shouldShowOutputAmountTag) {
      return null;
    }
    // For mUSD conversion, the output symbol is always mUSD
    return 'mUSD';
  }, [shouldShowOutputAmountTag]);

  return {
    shouldShowOutputAmountTag,
    outputAmount,
    outputSymbol,
  };
};

export default useCustomAmount;
