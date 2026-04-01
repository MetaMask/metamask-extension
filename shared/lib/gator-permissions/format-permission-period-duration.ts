import {
  DAY,
  HOUR,
  WEEK,
  SECOND,
  FORTNIGHT,
  MONTH,
  YEAR,
} from '../../constants/time';

import type { I18nFunction } from './permission-detail-schema.types';

/**
 * Formats a period duration in seconds to a human-readable string for permission UIs.
 * Same behavior as the confirmation typed-sign util; lives in shared for schema reuse.
 * @param t
 * @param periodSeconds
 */
export function formatPermissionPeriodDuration(
  t: I18nFunction,
  periodSeconds: number,
): string {
  if (periodSeconds === 0) {
    throw new Error('Cannot format period duration of 0 seconds');
  }

  if (periodSeconds < 0) {
    throw new Error('Cannot format negative period duration');
  }

  const periodMilliseconds = periodSeconds * SECOND;

  switch (periodMilliseconds) {
    case HOUR:
      return t('confirmFieldPeriodDurationHourly');
    case DAY:
      return t('confirmFieldPeriodDurationDaily');
    case WEEK:
      return t('confirmFieldPeriodDurationWeekly');
    case FORTNIGHT:
      return t('confirmFieldPeriodDurationBiWeekly');
    case MONTH:
      return t('confirmFieldPeriodDurationMonthly');
    case YEAR:
      return t('confirmFieldPeriodDurationYearly');
    default:
      return `${periodSeconds} ${t('confirmFieldPeriodDurationSeconds')}`;
  }
}
