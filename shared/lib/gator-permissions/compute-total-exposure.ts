import type { Hex } from '@metamask/utils';
import { hexToBigInt } from '@metamask/utils';

import { MAX_UINT256 } from './permission-constants';

/**
 * Parses an amount represented as a hex string to bigint.
 * When value is defined, returns bigint; when value is undefined (or null), returns null.
 *
 * @param value - Hex string; undefined/null treated as absent
 * @returns bigint when value is defined, or null when value is undefined or null
 */
function toAmountBigInt(value: Hex): bigint;
function toAmountBigInt(value: Hex | undefined | null): bigint | null;
function toAmountBigInt(value: Hex | undefined | null): bigint | null {
  if (value === undefined || value === null) {
    return null;
  }
  return hexToBigInt(value);
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
 * @returns bigint for the total exposure, or null if unlimited
 */
export function computeTotalExposure(
  params: TotalExposureParams,
): bigint | null {
  const { initialAmount, maxAmount, amountPerSecond, startTime, expiry } =
    params;

  let exposureAtExpiry: bigint | null = null;
  if (expiry !== null) {
    const elapsedSeconds = expiry - startTime;
    const initial = initialAmount ? toAmountBigInt(initialAmount) : 0n;
    const rate = toAmountBigInt(amountPerSecond);
    const streamed =
      elapsedSeconds > 0 && rate ? rate * BigInt(elapsedSeconds) : 0n;
    exposureAtExpiry = initial + streamed;
  } else if (maxAmount?.toLowerCase() === MAX_UINT256) {
    return null;
  }

  const maxAmountBigInt = toAmountBigInt(maxAmount);

  if (exposureAtExpiry !== null && maxAmountBigInt !== null) {
    return maxAmountBigInt < exposureAtExpiry
      ? maxAmountBigInt
      : exposureAtExpiry;
  }
  return maxAmountBigInt ?? exposureAtExpiry ?? null;
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
): bigint | null {
  return computeTotalExposure({
    initialAmount: permissionData.initialAmount,
    maxAmount: permissionData.maxAmount,
    amountPerSecond: permissionData.amountPerSecond,
    startTime: permissionData.startTime,
    expiry,
  });
}
