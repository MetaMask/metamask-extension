import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { createFormatters } from '@metamask/assets-controllers';
import { getIntlLocale } from '../ducks/locale/locale';

type Value = number | bigint | `${number}`;

function formatPercentWithMinThreshold(
  formatNumber: (value: Value, options?: Intl.NumberFormatOptions) => string,
  value: Value,
  options: Intl.NumberFormatOptions = {},
) {
  const minThreshold = 0.0001; // 0.01%
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return '';
  }

  const clamped =
    number === 0
      ? 0
      : Math.sign(number) * Math.max(Math.abs(number), minThreshold);

  return formatNumber(clamped, {
    style: 'percent',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    ...options,
  });
}

function formatCompact(
  formatNumber: (value: Value, options?: Intl.NumberFormatOptions) => string,
  value: Value,
) {
  return formatNumber(value, {
    notation: 'compact',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// Format token quantity without trailing zeros.
function formatTokenAmount(
  formatToken: (
    value: Value,
    symbol: string,
    options?: Intl.NumberFormatOptions,
  ) => string,
  value: Value,
  symbol: string,
) {
  const minThreshold = 0.00001;
  const number = Number(value);
  const absoluteValue = Math.abs(number);

  if (!Number.isFinite(number)) {
    return '';
  }

  if (number === 0) {
    return formatToken(0, symbol, { maximumFractionDigits: 0 });
  }

  if (absoluteValue < minThreshold) {
    return `<${formatToken(minThreshold, symbol, {
      minimumSignificantDigits: 1,
      maximumSignificantDigits: 1,
    })}`;
  }

  if (absoluteValue < 1) {
    return formatToken(number, symbol, {
      minimumSignificantDigits: 1,
      maximumSignificantDigits: 4,
    });
  }

  if (absoluteValue < 1000000) {
    return formatToken(number, symbol, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 4,
    });
  }

  return formatToken(number, symbol, {
    notation: 'compact',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

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

// Format a timestamp as a localized date+time string (e.g. "Mar 15, 2024, 2:30 PM").
function formatDateTime(
  config: { locale: string },
  timestamp: string | number,
  options?: Intl.DateTimeFormatOptions,
) {
  if (!timestamp) {
    return '';
  }
  return getCachedDateTimeFormat(config.locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
    ...options,
  }).format(new Date(timestamp));
}

export function useFormatters() {
  const locale = useSelector(getIntlLocale);

  return useMemo(() => {
    const base = createFormatters({ locale });
    return {
      ...base,
      /**
       * Format a value as a percentage string with two decimal digits (ratio input: 0.1234 -> "12.34%").
       */
      formatPercentWithMinThreshold: formatPercentWithMinThreshold.bind(
        null,
        base.formatNumber,
      ),
      formatCompact: formatCompact.bind(null, base.formatNumber),
      /**
       * Format token quantity without trailing zeros.
       */
      formatTokenAmount: formatTokenAmount.bind(null, base.formatToken),
      /**
       * Format a timestamp as a localized date+time string (e.g. "Mar 15, 2024, 2:30 PM").
       */
      formatDateTime: formatDateTime.bind(null, { locale }),
    };
  }, [locale]);
}
