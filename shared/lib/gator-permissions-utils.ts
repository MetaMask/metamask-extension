/**
 * An enum representing the time periods for which the stream rate can be calculated.
 */
export enum TimePeriod {
  DAILY = 'Daily',
  WEEKLY = 'Weekly',
  MONTHLY = 'Monthly',
}

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
 * Generates a human-readable description for a period duration in seconds.
 *
 * @param periodDuration - The period duration in seconds (can be string or number)
 * @param t - Translation function for internationalization
 * @returns A human-readable frequency description
 */
export function getPeriodDescription(
  periodDuration: string | number,
  t: Function,
): string {
  const duration = BigInt(periodDuration);

  // Check for standard time periods
  if (duration === TIME_PERIOD_TO_SECONDS[TimePeriod.DAILY]) {
    return t('daily');
  }
  if (duration === TIME_PERIOD_TO_SECONDS[TimePeriod.WEEKLY]) {
    return t('weekly');
  }
  if (duration === TIME_PERIOD_TO_SECONDS[TimePeriod.MONTHLY]) {
    return t('monthly');
  }
  // For custom periods, determine the best human-readable format
  return getCustomPeriodDescription(duration, t);
}

/**
 * Generates a human-readable description for custom period durations.
 *
 * @param duration - The duration in seconds as a BigInt
 * @param t - Translation function for internationalization
 * @returns A human-readable frequency description
 */
function getCustomPeriodDescription(
  duration: bigint,
  t: Function,
): string {
  const seconds = Number(duration);

  if (seconds < 60) {
    // Less than a minute
    return t('everyXSeconds', [seconds.toString()]);
  }
  if (seconds < 3600) {
    // Less than an hour
    const minutes = Math.floor(seconds / 60);
    return t('everyXMinutes', [minutes.toString()]);
  }
  if (seconds < 86400) {
    // Less than a day
    const hours = Math.floor(seconds / 3600);
    return t('everyXHours', [hours.toString()]);
  }
  // Days or more
  const days = Math.floor(seconds / 86400);
  return t('everyXDays', [days.toString()]);
}
