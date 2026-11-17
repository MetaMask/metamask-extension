import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { createFormatters } from '@metamask/client-utils';
import type { Formatters } from '@metamask/client-utils';
import {
  buildFormattingLocale,
  usesNarrowUsdSymbol,
} from '#shared/constants/locales';
import { getCurrentLocale } from '#ui/ducks/locale/locale';

const dateTimeFormatCache: Record<string, Intl.DateTimeFormat> = {};

function getCachedDateTimeFormat(
  locale: string,
  options: Intl.DateTimeFormatOptions = {},
) {
  const key = `${locale}_${JSON.stringify(options)}`;
  if (!dateTimeFormatCache[key]) {
    dateTimeFormatCache[key] = new Intl.DateTimeFormat(locale, options);
  }
  return dateTimeFormatCache[key];
}

// Format a timestamp as a localized medium date string (e.g. "Mar 15, 2024").
function formatMediumDate(
  locale: string,
  timestamp: string | number,
  options?: Intl.DateTimeFormatOptions,
) {
  if (!timestamp) {
    return '';
  }
  return getCachedDateTimeFormat(locale, {
    dateStyle: 'medium',
    ...options,
  }).format(new Date(timestamp));
}

function regionOf(locale: string) {
  try {
    return new Intl.Locale(locale).region;
  } catch {
    return undefined;
  }
}

function withNarrowUsdSymbol(formatters: Formatters): Formatters {
  const formatCurrency: Formatters['formatCurrency'] = (
    value,
    currency,
    options,
  ) =>
    formatters.formatCurrency(
      value,
      currency,
      currency?.toUpperCase() === 'USD'
        ? { currencyDisplay: 'narrowSymbol', ...options }
        : options,
    );

  return {
    ...formatters,
    formatCurrency,
  };
}

export function useFormatters() {
  const selectedLanguage = useSelector(getCurrentLocale);

  return useMemo(() => {
    const locale = buildFormattingLocale(selectedLanguage);
    const base = createFormatters({ locale });
    const formatters = usesNarrowUsdSymbol(regionOf(locale))
      ? withNarrowUsdSymbol(base)
      : base;
    return {
      ...formatters,
      /**
       * Format a timestamp as a localized medium date string (e.g. "Mar 15, 2024").
       */
      formatMediumDate: formatMediumDate.bind(null, locale),
    };
  }, [selectedLanguage]);
}
