import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { createFormatters } from '@metamask/client-utils';
import { getIntlLocale } from '../ducks/locale/locale';
import {
  resolveFormattingLocale,
  getCurrencyDisplay,
} from '../helpers/utils/locale';

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

export function useFormatters() {
  const appLocale = useSelector(getIntlLocale);

  return useMemo(() => {
    const locale = resolveFormattingLocale({
      appLanguage: appLocale,
      deviceLocales: navigator.languages,
    });
    const currencyDisplay = getCurrencyDisplay(locale);
    const base = createFormatters({ locale, currencyDisplay });

    return {
      ...base,
      /**
       * Format a timestamp as a localized medium date string (e.g. "Mar 15, 2024").
       */
      formatMediumDate: formatMediumDate.bind(null, locale),
    };
  }, [appLocale]);
}
