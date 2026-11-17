import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { createFormatters } from '@metamask/client-utils';
import type { Formatters } from '@metamask/client-utils';
import { buildFormattingLocale } from '#shared/constants/locales';
import { getCurrentLocale } from '#ui/ducks/locale/locale';

const dateTimeFormatCache: Record<string, Intl.DateTimeFormat> = {};

const twoDecimals = {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
};

const oneSignificantDigit = {
  minimumSignificantDigits: 1,
  maximumSignificantDigits: 1,
};

const threeSignificantDigits = {
  minimumSignificantDigits: 3,
  maximumSignificantDigits: 3,
};

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

/**
 * Temporary stand-in for `createFormatters({ currencyDisplay: 'narrowSymbol' })`.
 * The published package cannot take that field yet, and its compact, threshold,
 * and token-price helpers do not accept a per-call `currencyDisplay`.
 *
 * @param formatters - Formatters from `createFormatters`.
 * @returns The same formatters with `currencyDisplay: 'narrowSymbol'` applied.
 */
function withNarrowSymbol(formatters: Formatters): Formatters {
  const formatCurrency: Formatters['formatCurrency'] = (
    value,
    currency,
    options,
  ) =>
    formatters.formatCurrency(value, currency, {
      currencyDisplay: 'narrowSymbol',
      ...options,
    });

  const formatCurrencyCompact: Formatters['formatCurrencyCompact'] = (
    value,
    currency,
  ) =>
    formatCurrency(value, currency, {
      notation: 'compact',
      ...twoDecimals,
    });

  const formatCurrencyWithMinThreshold: Formatters['formatCurrencyWithMinThreshold'] =
    (value, currency) => {
      const minThreshold = 0.01;
      const number = Number(value);
      if (!Number.isFinite(number)) {
        return '';
      }
      if (number === 0) {
        return formatCurrency(0, currency);
      }
      if (Math.abs(number) < minThreshold) {
        return `<${formatCurrency(minThreshold, currency)}`;
      }
      return formatCurrency(number, currency);
    };

  const formatCurrencyTokenPrice: Formatters['formatCurrencyTokenPrice'] = (
    value,
    currency,
  ) => {
    const minThreshold = 0.00000001;
    const number = Number(value);
    const absoluteValue = Math.abs(number);
    if (!Number.isFinite(number)) {
      return '';
    }
    if (number === 0) {
      return formatCurrency(0, currency);
    }
    if (absoluteValue < minThreshold) {
      return `<${formatCurrency(minThreshold, currency, oneSignificantDigit)}`;
    }
    if (absoluteValue < 1) {
      return formatCurrency(number, currency, threeSignificantDigits);
    }
    if (absoluteValue < 1_000_000) {
      return formatCurrency(number, currency);
    }
    return formatCurrencyCompact(number, currency);
  };

  return {
    ...formatters,
    formatCurrency,
    formatCurrencyCompact,
    formatCurrencyWithMinThreshold,
    formatCurrencyTokenPrice,
  };
}

export function useFormatters() {
  const selectedLanguage = useSelector(getCurrentLocale);

  return useMemo(() => {
    const { locale, narrowUsdSymbol } = buildFormattingLocale(selectedLanguage);
    // Temporary until createFormatters accepts currencyDisplay. Replace with
    // createFormatters({ locale, currencyDisplay: narrowUsdSymbol ? 'narrowSymbol' : undefined }).
    const formatters = createFormatters({ locale });

    return {
      ...(narrowUsdSymbol ? withNarrowSymbol(formatters) : formatters),
      /**
       * Format a timestamp as a localized medium date string (e.g. "Mar 15, 2024").
       */
      formatMediumDate: formatMediumDate.bind(null, locale),
    };
  }, [selectedLanguage]);
}
