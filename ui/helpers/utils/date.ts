import { DateTime } from 'luxon';

/**
 * Format a date with the given format
 *
 * @param date - Unix timestamp in milliseconds
 * @param format - Luxon format string, defaults to "M/d/y 'at' T"
 * @returns Formatted date string
 */
export function formatDate(
  date: number | null | undefined,
  format = "M/d/y 'at' T",
): string {
  if (!date) {
    return '';
  }
  return DateTime.fromMillis(date).toFormat(format);
}

/**
 * Format a UTC date from a Unix timestamp (in seconds)
 *
 * @param unixTimestamp - timestamp as seconds since unix epoch
 * @returns formatted date string e.g. "14 July 2034, 22:22"
 */
export const formatUTCDateFromUnixTimestamp = (
  unixTimestamp?: number | null,
): string => {
  if (!unixTimestamp) {
    return '';
  }

  return DateTime.fromSeconds(unixTimestamp)
    .toUTC()
    .toFormat('dd LLLL yyyy, HH:mm');
};

/**
 * Format a date with year context
 *
 * @param date - Unix timestamp in milliseconds
 * @param formatThisYear - Format to use if the date is in the current year
 * @param fallback - Format to use if the date is not in the current year
 * @returns Formatted date string
 */
export function formatDateWithYearContext(
  date: number | null | undefined,
  formatThisYear = 'MMM d',
  fallback = 'MMM d, y',
): string {
  if (!date) {
    return '';
  }
  const dateTime = DateTime.fromMillis(date);
  const now = DateTime.local();
  return dateTime.toFormat(
    now.year === dateTime.year ? formatThisYear : fallback,
  );
}

/**
 * Format a date with ordinal suffix
 *
 * @param timestamp - Unix timestamp in seconds
 * @returns Formatted date string with ordinal suffix
 */
export function formatDateWithSuffix(timestamp: number): string {
  const date = DateTime.fromMillis(timestamp * 1000); // Convert to milliseconds
  const { day } = date;
  const suffix = getOrdinalSuffix(day);

  return date.toFormat(`MMM d'${suffix}', yyyy`);
}

/**
 * Get the ordinal suffix for a day of the month
 *
 * @param day - Day of the month
 * @returns Ordinal suffix ('st', 'nd', 'rd', or 'th')
 */
function getOrdinalSuffix(day: number): string {
  if (day > 3 && day < 21) {
    return 'th';
  } // because 11th, 12th, 13th
  switch (day % 10) {
    case 1:
      return 'st';
    case 2:
      return 'nd';
    case 3:
      return 'rd';
    default:
      return 'th';
  }
}
