import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { createFormatters } from '@metamask/client-utils';
import type { Formatters } from '@metamask/client-utils';
import { buildFormattingLocale } from '#shared/constants/locales';
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

// Only USD is shortened. Other currencies keep their own symbol.
function shortenUsd(
  formatCurrency: Formatters['formatCurrency'],
): Formatters['formatCurrency'] {
  return (value, currency, options) =>
    formatCurrency(
      value,
      currency,
      currency?.toUpperCase() === 'USD'
        ? { currencyDisplay: 'narrowSymbol', ...options }
        : options,
    );
}

export function useFormatters() {
  const selectedLanguage = useSelector(getCurrentLocale);

  return useMemo(() => {
    const { locale, narrowUsdSymbol } = buildFormattingLocale(selectedLanguage);
    const formatters = createFormatters({ locale });

    return {
      ...formatters,
      formatCurrency: narrowUsdSymbol
        ? shortenUsd(formatters.formatCurrency)
        : formatters.formatCurrency,
      /**
       * Format a timestamp as a localized medium date string (e.g. "Mar 15, 2024").
       */
      formatMediumDate: formatMediumDate.bind(null, locale),
    };
  }, [selectedLanguage]);
}
