import { BigNumber } from 'bignumber.js';
import type { Hex } from '@metamask/utils';

import { MAX_UINT256 } from './permission-constants';

/**
 * Parses an amount represented as a hex string to BigNumber.
 * When value is defined, returns BigNumber; when value is undefined (or null), returns null.
 *
 * @param value - Hex string; undefined/null treated as absent
 * @returns BigNumber when value is defined, or null when value is undefined or null
 */
function toAmountBn(value: Hex): BigNumber;
function toAmountBn(value: Hex | undefined | null): BigNumber | null;
function toAmountBn(value: Hex | undefined | null): BigNumber | null {
  if (value === undefined || value === null) {
    return null;
  }
  return new BigNumber(value, 16);
}

/** Parameters required to compute total exposure for a stream permission. */
export type TotalExposureParams = {
  initialAmount?: Hex | null;
  maxAmount?: Hex | null;
  amountPerSecond: Hex;
  startTime: number;
  expiry: number | null;
};

/**
 * Computes total exposure for a stream permission.
 *
 * Formula (aligned with gator-permissions-snap deriveExposureForStreamingPermission):
 * - When expiry is set: exposureAtExpiry = (initialAmount ?? 0) + amountPerSecond * max(0, expiry - startTime)
 * - When both maxAmount and exposureAtExpiry exist: total = min(maxAmount, exposureAtExpiry)
 * - Otherwise: total = maxAmount ?? exposureAtExpiry ?? null
 * - Special case: maxAmount equal to MAX_UINT256 is treated as unlimited (returns null).
 *
 * @param params - Parameters required to compute total exposure (amounts as Hex strings)
 * @returns BigNumber for the total exposure, or null if unlimited
 */
export function computeTotalExposure(
  params: TotalExposureParams,
): BigNumber | null {
  const { initialAmount, maxAmount, amountPerSecond, startTime, expiry } =
    params;

  let exposureAtExpiry: BigNumber | null = null;
  if (expiry !== null) {
    const elapsedSeconds = expiry - startTime;
    const initial = initialAmount
      ? toAmountBn(initialAmount)
      : new BigNumber(0);
    const rateBn = toAmountBn(amountPerSecond);
    const streamed =
      elapsedSeconds > 0 && rateBn
        ? rateBn.times(elapsedSeconds)
        : new BigNumber(0);
    exposureAtExpiry = initial.plus(streamed);
  } else if (maxAmount?.toLowerCase() === MAX_UINT256) {
    return null;
  }

  const maxAmountBn = toAmountBn(maxAmount);

  if (exposureAtExpiry !== null && maxAmountBn !== null) {
    return BigNumber.min(maxAmountBn, exposureAtExpiry);
  }
  return maxAmountBn ?? exposureAtExpiry ?? null;
}

/**
 * Shape of permission data that supports total exposure computation.
 * Any permission type whose `data` contains `amountPerSecond` and `startTime`
 * qualifies, regardless of the specific permission type string.
 */
export type PermissionDataWithTotalExposure = Record<string, unknown> & {
  amountPerSecond: Hex;
  startTime: number;
  initialAmount?: Hex | null;
  maxAmount?: Hex | null;
};

/**
 * Type guard: returns true when `permissionData` has the correct shape
 * for the total exposure calculation (`amountPerSecond` string + finite `startTime`).
 *
 * @param permissionData - The decoded permission data record
 * @returns Whether the data supports total exposure computation
 */
export function isPermissionDataWithTotalExposure(
  permissionData: Record<string, unknown>,
): permissionData is PermissionDataWithTotalExposure {
  return (
    typeof permissionData.amountPerSecond === 'string' &&
    typeof permissionData.startTime === 'number' &&
    Number.isFinite(permissionData.startTime)
  );
}

/**
 * Computes total exposure from permission data that has been verified
 * via `isPermissionDataWithTotalExposure`.
 *
 * @param permissionData - Permission data containing stream fields
 * @param expiry - Expiry timestamp in Unix seconds, or null if none
 */
export function computeTotalExposureForPermission(
  permissionData: PermissionDataWithTotalExposure,
  expiry: number | null,
): BigNumber | null {
  return computeTotalExposure({
    initialAmount: permissionData.initialAmount,
    maxAmount: permissionData.maxAmount,
    amountPerSecond: permissionData.amountPerSecond,
    startTime: permissionData.startTime,
    expiry,
  });
}
