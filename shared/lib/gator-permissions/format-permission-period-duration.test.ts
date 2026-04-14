import {
  DAY,
  FORTNIGHT,
  HOUR,
  MONTH,
  SECOND,
  WEEK,
  YEAR,
} from '../../constants/time';

import { formatPermissionPeriodDuration } from './format-permission-period-duration';

describe('formatPermissionPeriodDuration', () => {
  it('maps a standard hour-long period to the hourly i18n key', () => {
    expect(formatPermissionPeriodDuration(HOUR / SECOND)).toStrictEqual({
      key: 'confirmFieldPeriodDurationHourly',
    });
  });

  it('maps a standard day-long period to the daily i18n key', () => {
    expect(formatPermissionPeriodDuration(DAY / SECOND)).toStrictEqual({
      key: 'confirmFieldPeriodDurationDaily',
    });
  });

  it('maps a standard week-long period to the weekly i18n key', () => {
    expect(formatPermissionPeriodDuration(WEEK / SECOND)).toStrictEqual({
      key: 'confirmFieldPeriodDurationWeekly',
    });
  });

  it('maps a standard fortnight-long period to the bi-weekly i18n key', () => {
    expect(formatPermissionPeriodDuration(FORTNIGHT / SECOND)).toStrictEqual({
      key: 'confirmFieldPeriodDurationBiWeekly',
    });
  });

  it('maps a standard month-long period to the monthly i18n key', () => {
    expect(formatPermissionPeriodDuration(MONTH / SECOND)).toStrictEqual({
      key: 'confirmFieldPeriodDurationMonthly',
    });
  });

  it('maps a standard year-long period to the yearly i18n key', () => {
    expect(formatPermissionPeriodDuration(YEAR / SECOND)).toStrictEqual({
      key: 'confirmFieldPeriodDurationYearly',
    });
  });

  it('returns seconds key with count for non-standard periods', () => {
    expect(formatPermissionPeriodDuration(45)).toStrictEqual({
      key: 'confirmFieldPeriodDurationSeconds',
      args: [45],
    });
  });

  it('throws for zero duration', () => {
    expect(() => formatPermissionPeriodDuration(0)).toThrow(
      'Cannot format period duration of 0 seconds',
    );
  });

  it('throws for negative duration', () => {
    expect(() => formatPermissionPeriodDuration(-1)).toThrow(
      'Cannot format negative period duration',
    );
  });
});
