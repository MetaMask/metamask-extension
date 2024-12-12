import { TransactionMeta } from '@metamask/transaction-controller';
import type { Hex } from '@metamask/utils';
import { remove0x } from '@metamask/utils';
import { BN } from 'bn.js';
import { DecodedTransactionDataResponse } from '../../../../../../shared/types/transaction-decode';
import {
  BackgroundColor,
  TextColor,
} from '../../../../../helpers/constants/design-system';

const VALUE_COMPARISON_PERCENT_THRESHOLD = 5;

export function getIsRevokeSetApprovalForAll(
  value: DecodedTransactionDataResponse | undefined,
): boolean {
  const isRevokeSetApprovalForAll =
    value?.data?.[0]?.name === 'setApprovalForAll' &&
    value?.data?.[0]?.params?.[1]?.value === false;

  return isRevokeSetApprovalForAll;
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
  originalValue: InstanceType<typeof BN>,
  newValue: InstanceType<typeof BN>,
): number {
  const precisionFactor = new BN(10).pow(new BN(18));
  const originalValuePrecision = originalValue.mul(precisionFactor);
  const newValuePrecision = newValue.mul(precisionFactor);

  const difference = newValuePrecision.sub(originalValuePrecision);

  if (difference.isZero()) {
    return 0;
  }

  if (originalValuePrecision.isZero() && !newValuePrecision.isZero()) {
    return 100;
  }

  return difference.muln(100).div(originalValuePrecision).abs().toNumber();
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
  originalValue: Hex,
  newValue: Hex,
  newNegative?: boolean,
): boolean {
  const originalValueBN = new BN(remove0x(originalValue), 'hex');
  let newValueBN = new BN(remove0x(newValue), 'hex');

  if (newNegative) {
    newValueBN = newValueBN.neg();
  }

  return (
    getPercentageChange(originalValueBN, newValueBN) <=
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
  transactionMeta: TransactionMeta,
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
