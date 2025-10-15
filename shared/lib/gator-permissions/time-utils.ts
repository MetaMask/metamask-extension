import { DAY, THIRTY_DAYS, WEEK } from '../../constants/time';

/**
 * An enum representing the time periods for which the stream rate can be calculated.
 */
export enum TimePeriod {
  DAILY = 'Daily',
  WEEKLY = 'Weekly',
  MONTHLY = 'Monthly',
}

export type GatorPermissionRule = {
  type: string;
  isAdjustmentAllowed: boolean;
  data: Record<string, any>;
};

/**
 * A mapping of time periods to their equivalent seconds.
 */
export const TIME_PERIOD_TO_SECONDS: Record<TimePeriod, bigint> = {
  [TimePeriod.DAILY]: 60n * 60n * 24n, // 86,400(seconds)
  [TimePeriod.WEEKLY]: 60n * 60n * 24n * 7n, // 604,800(seconds)
  // Monthly is difficult because months are not consistent in length.
  // We approximate by calculating the number of seconds in 1/12th of a year.
  [TimePeriod.MONTHLY]: (60n * 60n * 24n * 365n) / 12n, // 2,629,760(seconds)
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
  const periodDurationMs = periodDurationInSeconds * 1000;
  if (periodDurationMs === DAY) {
    return 'gatorPermissionDailyFrequency';
  } else if (periodDurationMs === WEEK) {
    return 'gatorPermissionWeeklyFrequency';
  } else if (periodDurationMs === THIRTY_DAYS) {
    return 'gatorPermissionMonthlyFrequency';
  }
  return 'gatorPermissionCustomFrequency';
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

  return 'No expiry';
};
