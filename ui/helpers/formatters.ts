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
  if (!Number.isFinite(Number(value))) {
    return '';
  }

  const number = Number(value);
  const minThreshold = 0.01;

  if (number === 0) {
    return formatCurrency(config, 0, currency);
  }

  if (number < minThreshold) {
    const formattedMin = formatCurrency(config, minThreshold, currency);
    return `<${formattedMin}`;
  }

  return formatCurrency(config, number, currency);
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
  };
}

export function useFormatters() {
  const locale = useSelector(getIntlLocale);

  return createFormatters({ locale });
}
