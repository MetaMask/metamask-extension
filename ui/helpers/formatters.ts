import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { getIntlLocale } from '../ducks/locale/locale';

// Will move to shared package

const FALLBACK_LOCALE = 'en';

const twoDecimals = {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
};

const compactTwoDecimals: Intl.NumberFormatOptions = {
  notation: 'compact',
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

const fourDecimals = {
  minimumFractionDigits: 4,
  maximumFractionDigits: 4,
};

const numberFormatCache: Record<string, Intl.NumberFormat> = {};

function getCachedNumberFormat(
  locale: string,
  options: Intl.NumberFormatOptions = {},
) {
  const key = `${locale}_${JSON.stringify(options)}`;

  let format = numberFormatCache[key];

  if (format) {
    return format;
  }

  try {
    format = new Intl.NumberFormat(locale, options);
  } catch (error) {
    if (error instanceof RangeError) {
      // Fallback for invalid options (e.g. currency code)
      format = new Intl.NumberFormat(locale, twoDecimals);
    } else {
      throw error;
    }
  }

  numberFormatCache[key] = format;
  return format;
}

function formatCurrency(
  config: { locale: string },
  value: number | bigint | `${number}`,
  currency: Intl.NumberFormatOptions['currency'],
  options: Intl.NumberFormatOptions = {},
) {
  if (!Number.isFinite(Number(value))) {
    return '';
  }

  const numberFormat = getCachedNumberFormat(config.locale, {
    style: 'currency',
    currency,
    ...options,
  });

  // @ts-expect-error Remove this comment once TypeScript is updated to 5.5+
  return numberFormat.format(value);
}

function formatCurrencyCompact(
  config: { locale: string },
  value: number | bigint | `${number}`,
  currency: Intl.NumberFormatOptions['currency'],
) {
  return formatCurrency(config, value, currency, compactTwoDecimals);
}

function formatCurrencyWithMinThreshold(
  config: { locale: string },
  value: number | bigint | `${number}`,
  currency: Intl.NumberFormatOptions['currency'],
) {
  const minThreshold = 0.01;
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return '';
  }

  if (number === 0) {
    return formatCurrency(config, 0, currency);
  }

  if (number < minThreshold) {
    const formattedMin = formatCurrency(config, minThreshold, currency);
    return `<${formattedMin}`;
  }

  return formatCurrency(config, number, currency);
}

function formatCurrencyTokenPrice(
  config: { locale: string },
  value: number | bigint | `${number}`,
  currency: Intl.NumberFormatOptions['currency'],
) {
  const minThreshold = 0.00000001;
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return '';
  }

  if (number === 0) {
    return formatCurrency(config, 0, currency);
  }

  if (number < minThreshold) {
    return `<${formatCurrency(config, minThreshold, currency, oneSignificantDigit)}`;
  }

  if (number < 1) {
    return formatCurrency(config, number, currency, threeSignificantDigits);
  }

  if (number < 1_000_000) {
    return formatCurrency(config, number, currency);
  }

  return formatCurrencyCompact(config, number, currency);
}

function formatToken(
  config: { locale: string },
  value: number | bigint | `${number}`,
  symbol?: string,
  options: Intl.NumberFormatOptions = {},
) {
  if (!Number.isFinite(Number(value))) {
    return '';
  }

  const numberFormat = getCachedNumberFormat(config.locale, {
    style: 'decimal',
    ...twoDecimals,
    ...options,
  });

  // @ts-expect-error Remove this comment once TypeScript is updated to 5.5+
  const formattedValue = numberFormat.format(value);

  return symbol ? `${formattedValue} ${symbol}` : formattedValue;
}

function formatTokenWithMinThreshold(
  config: { locale: string },
  value: number | bigint | `${number}`,
  symbol?: string,
) {
  if (!Number.isFinite(Number(value))) {
    return '';
  }

  const number = Number(value);
  const minThreshold = 0.0001;

  if (number === 0) {
    return formatToken(config, 0, symbol);
  }

  if (number < minThreshold) {
    const formattedMin = formatToken(config, value, symbol);
    return `<${formattedMin}`;
  }

  return formatToken(config, number, symbol, fourDecimals);
}

export function createFormatters({ locale = FALLBACK_LOCALE }) {
  return {
    /**
     * Format a value as a currency string.
     *
     * @param value - Numeric value to format.
     * @param currency - ISO 4217 currency code (e.g. 'USD').
     * @param options - Optional Intl.NumberFormat overrides.
     */
    formatCurrency: formatCurrency.bind(null, { locale }),
    /**
     * Compact currency (e.g. $1.2K, $3.4M) with up to two decimal digits.
     *
     * @param value - Numeric value to format.
     * @param currency - ISO 4217 currency code.
     */
    formatCurrencyCompact: formatCurrencyCompact.bind(null, { locale }),
    /**
     * Currency with thresholds for small values.
     *
     * @param value - Numeric value to format.
     * @param currency - ISO 4217 currency code.
     */
    formatCurrencyWithMinThreshold: formatCurrencyWithMinThreshold.bind(null, {
      locale,
    }),
    /**
     * Format token price with varying precision based on value.
     *
     * @param value - Numeric value to format.
     * @param currency - ISO 4217 currency code.
     */
    formatCurrencyTokenPrice: formatCurrencyTokenPrice.bind(null, { locale }),
    /**
     * Format a value as a token string.
     *
     * @param value - Numeric value to format.
     * @param symbol - Optional token symbol.
     */
    formatToken: formatToken.bind(null, { locale }),
    /**
     * Token with thresholds for small values.
     *
     * @param value - Numeric value to format.
     * @param symbol - Optional token symbol.
     */
    formatTokenWithMinThreshold: formatTokenWithMinThreshold.bind(null, {
      locale,
    }),
  };
}

export function useFormatters() {
  const locale = useSelector(getIntlLocale);

  return useMemo(() => createFormatters({ locale }), [locale]);
}
