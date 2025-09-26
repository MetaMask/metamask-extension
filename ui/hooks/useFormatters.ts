import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { createFormatters } from '@metamask/assets-controllers';
import { getIntlLocale } from '../ducks/locale/locale';

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

  format = new Intl.NumberFormat(locale, options);
  numberFormatCache[key] = format;
  return format;
}

function formatPercentWithMinThreshold(
  config: { locale: string },
  value: number | bigint | `${number}`,
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

  const numberFormat = getCachedNumberFormat(config.locale, {
    style: 'percent',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    ...options,
  });

  return numberFormat.format(clamped);
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
      formatPercentWithMinThreshold: formatPercentWithMinThreshold.bind(null, {
        locale,
      }),
    };
  }, [locale]);
}
