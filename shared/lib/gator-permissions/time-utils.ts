import { DAY, FORTNIGHT, MONTH, WEEK, YEAR } from '../../constants/time';

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
  const periodDurationMs = periodDurationInSeconds * 1000;
  if (periodDurationMs === DAY) {
    return 'gatorPermissionDailyFrequency';
  } else if (periodDurationMs === WEEK) {
    return 'gatorPermissionWeeklyFrequency';
  } else if (periodDurationMs === FORTNIGHT) {
    return 'gatorPermissionFortnightlyFrequency';
  } else if (periodDurationMs === MONTH) {
    return 'gatorPermissionMonthlyFrequency';
  } else if (periodDurationMs === YEAR) {
    return 'gatorPermissionAnnualFrequency';
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

  return '';
};
