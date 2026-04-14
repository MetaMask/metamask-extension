import {
  DAY,
  HOUR,
  WEEK,
  SECOND,
  FORTNIGHT,
  MONTH,
  YEAR,
} from '../../constants/time';

import type { I18nValue } from './permission-detail-schema.types';

/**
 * Returns an i18n key (and optional args) for a period duration in seconds.
 * Each renderer translates the returned value via its own i18n function.
 * For non-standard periods, `confirmFieldPeriodDurationSeconds` must include a `$1`
 * placeholder for the numeric second count (see locale messages).
 * @param periodSeconds
 */
export function formatPermissionPeriodDuration(
  periodSeconds: number,
): I18nValue {
  if (periodSeconds === 0) {
    throw new Error('Cannot format period duration of 0 seconds');
  }

  if (periodSeconds < 0) {
    throw new Error('Cannot format negative period duration');
  }

  const periodMilliseconds = periodSeconds * SECOND;

  switch (periodMilliseconds) {
    case HOUR:
      return { key: 'confirmFieldPeriodDurationHourly' };
    case DAY:
      return { key: 'confirmFieldPeriodDurationDaily' };
    case WEEK:
      return { key: 'confirmFieldPeriodDurationWeekly' };
    case FORTNIGHT:
      return { key: 'confirmFieldPeriodDurationBiWeekly' };
    case MONTH:
      return { key: 'confirmFieldPeriodDurationMonthly' };
    case YEAR:
      return { key: 'confirmFieldPeriodDurationYearly' };
    default:
      return {
        key: 'confirmFieldPeriodDurationSeconds',
        args: [periodSeconds],
      };
  }
}
