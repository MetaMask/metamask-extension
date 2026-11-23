import { useCallback } from 'react';
import { BigNumber } from 'bignumber.js';

export const MM_PAY_AMOUNT_INPUT_TYPE_MANUAL_SNAPPED_MAX = 'manual_snapped_max';

/**
 * Detects manually typed amounts that should be committed as Max.
 *
 * Snaps only when the amount equals the balance truncated to cents, as Max
 * fills the field. Committed literally,
 * that amount is either priced as an exact output, where fees push the source
 * above the balance, or leaves dust behind on withdraws. Lower amounts are a
 * deliberate choice and higher ones are genuinely insufficient, so neither
 * snaps.
 *
 * Mirrors mobile `useSnapAmountToMax`.
 *
 * @param options - Options bag.
 * @param options.balanceUsd - Full-precision balance Max commits, in the
 * input currency.
 * @param options.isMaxAmount - Whether Max is already armed.
 * @param options.isMaxAvailable - Whether the Max button is offered.
 * @returns `isSnapToMax` to test an amount, and `resolveAmountFiat` mapping a
 * snapping amount to the full-precision balance Max commits, so pending-amount
 * alerts judge the amount that will actually be committed.
 */
export function useSnapAmountToMax({
  balanceUsd,
  isMaxAmount,
  isMaxAvailable,
}: {
  balanceUsd: number;
  isMaxAmount: boolean;
  isMaxAvailable: boolean;
}): {
  isSnapToMax: (amountFiat: string) => boolean;
  resolveAmountFiat: (amountFiat: string) => string;
} {
  const isSnapToMax = useCallback(
    (amountFiat: string) =>
      isMaxAvailable &&
      !isMaxAmount &&
      isDisplayedBalanceAmount(amountFiat, balanceUsd),
    [balanceUsd, isMaxAmount, isMaxAvailable],
  );

  const resolveAmountFiat = useCallback(
    (amountFiat: string) =>
      isSnapToMax(amountFiat)
        ? new BigNumber(String(balanceUsd)).toString(10)
        : amountFiat,
    [balanceUsd, isSnapToMax],
  );

  return { isSnapToMax, resolveAmountFiat };
}

function isDisplayedBalanceAmount(
  amountFiat: string,
  balanceUsd: number,
): boolean {
  if (!isNumeric(amountFiat) || !Number.isFinite(balanceUsd)) {
    return false;
  }

  // Truncated, as Max fills the field, so a snap never changes the typed
  // value. `round(dp, rm)`, not `decimalPlaces`: this repo pins
  // `bignumber.js@4`, where `decimalPlaces` is a getter returning the place
  // count.
  const displayedBalance = new BigNumber(String(balanceUsd)).round(
    2,
    BigNumber.ROUND_DOWN,
  );

  return (
    displayedBalance.gt(0) && new BigNumber(amountFiat).eq(displayedBalance)
  );
}

function isNumeric(value: string): boolean {
  return /^\d*\.?\d+$|^\d+\.$/u.test(value);
}
