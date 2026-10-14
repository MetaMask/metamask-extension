import { BigNumber } from 'bignumber.js';
import { MUSD_DECIMALS } from '@metamask/money-account-utils';

/**
 * Divisor that converts mUSD / vmUSD base units into human-readable amounts.
 * Shared so projection math cannot drift across Money Account surfaces.
 */
export const MUSD_UNIT = 10 ** MUSD_DECIMALS;

/**
 * Projects a vault `vmusdValueInMusd` balance (base units) into a human-readable
 * BigNumber amount. mUSD is USD-pegged 1:1, so this value is also fiat.
 *
 * @param vmusdValueInMusd - Raw withdrawable balance in mUSD base units.
 * @returns Human-readable amount, or `undefined` when the input is missing.
 */
export function projectVmusdValueInMusdToHuman(
  vmusdValueInMusd: string | number | undefined | null,
): BigNumber | undefined {
  if (vmusdValueInMusd === undefined || vmusdValueInMusd === null) {
    return undefined;
  }

  return new BigNumber(vmusdValueInMusd).dividedBy(MUSD_UNIT);
}
