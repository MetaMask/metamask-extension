import { bigIntToHex, Hex, hexToBigInt } from '@metamask/utils';
import { DateTime } from 'luxon';
import { decodeDelegations } from '@metamask/delegation-core';
import { getDeleGatorEnvironment } from '../delegation/environment';
import {
  DAY,
  FORTNIGHT,
  MONTH,
  SECOND,
  WEEK,
  YEAR,
} from '../../constants/time';

export type GatorPermissionRule = {
  type: string;
  isAdjustmentAllowed: boolean;
  data: Record<string, unknown>;
};

/**
 * Generates a human-readable description for a period duration in seconds to be used for translation.
 *
 * @param periodDurationInSeconds - The period duration in seconds
 * @returns A human-readable frequency description to be used for translation.
 */
export function getPeriodFrequencyValueTranslationKey(
  periodDurationInSeconds: number,
): string {
  const periodDurationMillisecond = periodDurationInSeconds * SECOND;
  if (periodDurationMillisecond === DAY) {
    return 'gatorPermissionDailyFrequency';
  } else if (periodDurationMillisecond === WEEK) {
    return 'gatorPermissionWeeklyFrequency';
  } else if (periodDurationMillisecond === FORTNIGHT) {
    return 'gatorPermissionFortnightlyFrequency';
  } else if (periodDurationMillisecond === MONTH) {
    return 'gatorPermissionMonthlyFrequency';
  } else if (periodDurationMillisecond === YEAR) {
    return 'gatorPermissionAnnualFrequency';
  }
  return 'gatorPermissionCustomFrequency';
}

/**
 * Converts milliseconds to seconds.
 *
 * @param milliseconds - The milliseconds to convert.
 * @returns The seconds.
 */
export function convertMillisecondsToSeconds(milliseconds: number): number {
  return milliseconds / SECOND;
}

/**
 * Converts an amount per second to an amount per period.
 *
 * @param amountPerSecond - The amount per second in hexadecimal format.
 * @param period - The period to convert to.
 * @returns The amount per period.
 */
export function convertAmountPerSecondToAmountPerPeriod(
  amountPerSecond: Hex,
  period: 'weekly' | 'monthly' | 'fortnightly' | 'yearly',
): Hex {
  const amountBigInt = hexToBigInt(amountPerSecond);
  switch (period) {
    case 'weekly':
      return bigIntToHex(
        amountBigInt * BigInt(convertMillisecondsToSeconds(WEEK)),
      );
    case 'monthly':
      return bigIntToHex(
        amountBigInt * BigInt(convertMillisecondsToSeconds(MONTH)),
      );
    case 'fortnightly':
      return bigIntToHex(
        amountBigInt * BigInt(convertMillisecondsToSeconds(FORTNIGHT)),
      );
    case 'yearly':
      return bigIntToHex(
        amountBigInt * BigInt(convertMillisecondsToSeconds(YEAR)),
      );
    default:
      throw new Error(`Invalid period: ${period as string}`);
  }
}

/**
 * Converts a unix timestamp(in seconds) to a human-readable date format.
 *
 * @param timestamp - The unix timestamp in seconds.
 * @returns The formatted date string in mm/dd/yyyy format in UTC timezone.
 */
export const convertTimestampToReadableDate = (timestamp: number): string => {
  if (timestamp === 0) {
    return '';
  }

  const dateTime = DateTime.fromSeconds(timestamp);

  if (!dateTime.isValid) {
    throw new Error('Invalid date format');
  }

  return dateTime.toFormat('MM/dd/yyyy');
};

/**
 * Extracts the expiry timestamp from the rules and converts it to a readable date.
 *
 * @param rules - The rules to extract the expiry from.
 * @returns The expiry timestamp in a readable date format.
 */
export const extractExpiryToReadableDate = (
  rules: GatorPermissionRule[],
): string => {
  const expiry = rules.find((rule) => rule.type === 'expiry');
  if (expiry) {
    return convertTimestampToReadableDate(expiry.data.timestamp as number);
  }

  return '';
};

/**
 * Extracts the expiry timestamp from a delegation context.
 * Based on the TimestampEnforcer contract encoding:
 * - Terms are 32 bytes total
 * - First 16 bytes: timestampAfterThreshold (uint128)
 * - Last 16 bytes: timestampBeforeThreshold (uint128) - this is the expiry
 *
 * @param permissionContext - The delegation context hex string
 * @param chainId - The chain ID hex string
 * @returns The expiration timestamp in seconds, or 0 if no expiration exists
 */
export const extractExpiryTimestampFromDelegation = (
  permissionContext: Hex,
  chainId: Hex,
): number => {
  try {
    const delegations = decodeDelegations(permissionContext);

    if (delegations.length !== 1) {
      return 0;
    }

    const delegation = delegations[0];
    if (!delegation) {
      return 0;
    }

    const chainIdNumber = parseInt(chainId, 16);
    const environment = getDeleGatorEnvironment(chainIdNumber);
    const timestampEnforcerAddress =
      environment.caveatEnforcers.TimestampEnforcer.toLowerCase();

    const timestampCaveat = delegation.caveats.find(
      (caveat) => caveat.enforcer.toLowerCase() === timestampEnforcerAddress,
    );

    if (!timestampCaveat) {
      return 0;
    }

    // Extract the expiry from the terms
    // Terms are 32 bytes (64 hex characters)
    // Last 16 bytes (32 hex chars) = timestampBeforeThreshold (uint128)
    const terms = timestampCaveat.terms as Hex;

    // Remove '0x' prefix if present
    const termsHex = terms.startsWith('0x') ? terms.slice(2) : terms;

    // Validate length: should be 64 hex characters (32 bytes)
    if (termsHex.length !== 64) {
      return 0;
    }

    // Extract last 32 hex characters (16 bytes) = timestampBeforeThreshold (expiry)
    const expiryHex = `0x${termsHex.slice(32)}`;

    // Convert to number (uint128 fits in JavaScript's safe integer range)
    const expiry = Number(BigInt(expiryHex));

    if (!expiry || expiry === 0) {
      return 0;
    }

    return expiry;
  } catch (error) {
    return 0;
  }
};
