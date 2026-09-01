import type BigNumber from 'bignumber.js';
import { projectVmusdValueInMusdToHuman } from '../../../shared/lib/money/withdrawable-balance';
import { moneyFormatUsd } from './format';

export { MUSD_UNIT, projectVmusdValueInMusdToHuman } from '../../../shared/lib/money/withdrawable-balance';

export type WithdrawableFiatProjection = {
  withdrawableFiatFormatted: string | undefined;
  withdrawableFiatRaw: string | undefined;
};

/**
 * Projects vault `vmusdValueInMusd` into withdrawable fiat raw + formatted
 * strings used by Money Account UI surfaces.
 *
 * @param vmusdValueInMusd - Raw withdrawable balance in mUSD base units.
 * @returns Formatted and raw fiat strings, or both `undefined` when unavailable.
 */
export function projectWithdrawableFiat(
  vmusdValueInMusd: string | number | undefined | null,
): WithdrawableFiatProjection {
  const withdrawableFiat = projectVmusdValueInMusdToHuman(vmusdValueInMusd);
  if (!withdrawableFiat) {
    return {
      withdrawableFiatFormatted: undefined,
      withdrawableFiatRaw: undefined,
    };
  }

  return {
    withdrawableFiatFormatted: moneyFormatUsd(withdrawableFiat),
    withdrawableFiatRaw: withdrawableFiat.toString(),
  };
}

/**
 * Formats an already-projected human withdrawable amount.
 *
 * @param withdrawableFiat - Human-readable amount, or undefined.
 * @returns Formatted and raw fiat strings, or both `undefined` when unavailable.
 */
export function formatWithdrawableFiat(
  withdrawableFiat: BigNumber | undefined,
): WithdrawableFiatProjection {
  if (!withdrawableFiat) {
    return {
      withdrawableFiatFormatted: undefined,
      withdrawableFiatRaw: undefined,
    };
  }

  return {
    withdrawableFiatFormatted: moneyFormatUsd(withdrawableFiat),
    withdrawableFiatRaw: withdrawableFiat.toString(),
  };
}
