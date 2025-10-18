import { bigIntToHex, Hex, hexToBigInt } from '@metamask/utils';
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
 * @returns The formatted date string in mm/dd/yyyy format.
 */
export const convertTimestampToReadableDate = (timestamp: number): string => {
  if (timestamp === 0) {
    return '';
  }
  const date = new Date(timestamp * 1000); // Convert seconds to milliseconds

  if (isNaN(date.getTime())) {
    return '';
  }

  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();

  return `${month}/${day}/${year}`;
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
