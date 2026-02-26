import { TransactionMeta } from '@metamask/transaction-controller';
import type { Hex } from '@metamask/utils';
import { remove0x } from '@metamask/utils';
import { TransactionDescription } from '@ethersproject/abi';
import {
  BackgroundColor,
  TextColor,
} from '../../../../../helpers/constants/design-system';

const VALUE_COMPARISON_PERCENT_THRESHOLD = 5;

export function getIsRevokeSetApprovalForAll(
  value: TransactionDescription | undefined,
): boolean {
  return (
    value?.name === 'setApprovalForAll' && value?.args?._approved === false
  );
}

export const getAmountColors = (credit?: boolean, debit?: boolean) => {
  let color = TextColor.textDefault;
  let backgroundColor = BackgroundColor.backgroundAlternative;

  if (credit) {
    color = TextColor.successDefault;
    backgroundColor = BackgroundColor.successMuted;
  } else if (debit) {
    color = TextColor.errorDefault;
    backgroundColor = BackgroundColor.errorMuted;
  }
  return { color, backgroundColor };
};

/**
 * Calculate the absolute percentage change between two values.
 *
 * @param originalValue - The first value.
 * @param newValue - The second value.
 * @returns The percentage change from the first value to the second value.
 * If the original value is zero and the new value is not, returns 100.
 */
export function getPercentageChange(
  originalValue: bigint,
  newValue: bigint,
): number {
  const difference = newValue - originalValue;

  if (difference === 0n) {
    return 0;
  }

  if (originalValue === 0n && newValue !== 0n) {
    return 100;
  }

  const absoluteDifference = difference < 0n ? -difference : difference;
  const absoluteOriginalValue = originalValue < 0n ? -originalValue : originalValue;

  return Number((absoluteDifference * 100n) / absoluteOriginalValue);
}

/**
 * Determine if the percentage change between two values is within a threshold.
 *
 * @param originalValue - The original value.
 * @param newValue - The new value.
 * @param newNegative - Whether the new value is negative.
 * @returns Whether the percentage change between the two values is within a threshold.
 */
function percentageChangeWithinThreshold(
  originalValueHex: Hex,
  newValueHex: Hex,
  newNegative?: boolean,
): boolean {
  const originalValue = BigInt(`0x${remove0x(originalValueHex)}`);
  let newValue = BigInt(`0x${remove0x(newValueHex)}`);

  if (newNegative) {
    newValue = -newValue;
  }

  return (
    getPercentageChange(originalValue, newValue) <=
    VALUE_COMPARISON_PERCENT_THRESHOLD
  );
}

/**
 * Determine if a transaction has a value and simulation native balance mismatch.
 *
 * @param transactionMeta - The transaction metadata.
 * @returns Whether the transaction has a value and simulation native balance mismatch.
 */
export function hasValueAndNativeBalanceMismatch(
  transactionMeta: TransactionMeta | undefined,
): boolean {
  const value = transactionMeta?.txParams?.value ?? '0x0';
  const nativeBalanceChange =
    transactionMeta?.simulationData?.nativeBalanceChange;
  const simulatedNativeBalanceDifference =
    nativeBalanceChange?.difference ?? '0x0';

  return !percentageChangeWithinThreshold(
    value as Hex,
    simulatedNativeBalanceDifference,
    nativeBalanceChange?.isDecrease === false,
  );
}

export function isValidUTF8(inputString: string) {
  try {
    const encoder = new TextEncoder();
    const encoded = encoder.encode(inputString);

    const decoder = new TextDecoder('utf-8', { fatal: true });
    decoder.decode(encoded);

    return true;
  } catch (e) {
    return false;
  }
}
