import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { getIntlLocale } from '../ducks/locale/locale';
import { useFormatters } from './useFormatters';

const relativeTimeFormatCache: Record<string, Intl.RelativeTimeFormat> = {};

function getCachedRelativeTimeFormat(locale: string) {
  if (!relativeTimeFormatCache[locale]) {
    relativeTimeFormatCache[locale] = new Intl.RelativeTimeFormat(locale, {
      numeric: 'auto',
    });
  }
  return relativeTimeFormatCache[locale];
}

function getStartOfDay(date: Date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  return startOfDay.getTime();
}

export function formatRelativeMediumDate(
  timestamp: number,
  locale: string,
  formatMediumDate: (value: string | number) => string,
  now = new Date(),
): string {
  const dateTimestamp = getStartOfDay(new Date(timestamp));
  const today = getStartOfDay(now);
  const yesterdayDate = new Date(today);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = yesterdayDate.getTime();
  const relativeTimeFormat = getCachedRelativeTimeFormat(locale);

  if (dateTimestamp === today) {
    return relativeTimeFormat.format(0, 'day');
  }

  if (dateTimestamp === yesterday) {
    return relativeTimeFormat.format(-1, 'day');
  }

  return formatMediumDate(timestamp);
}

export function useRelativeMediumDate() {
  const locale = useSelector(getIntlLocale);
  const { formatMediumDate } = useFormatters();

  return useCallback(
    (timestamp: number) =>
      formatRelativeMediumDate(timestamp, locale, formatMediumDate),
    [formatMediumDate, locale],
  );
}
