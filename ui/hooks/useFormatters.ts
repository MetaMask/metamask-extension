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
    };
  }, [locale]);
}
