import { BigNumber } from 'bignumber.js';
import {
  MIN_AMOUNT,
  DEFAULT_PRECISION,
} from '../../../../hooks/useCurrencyDisplay';

// The number of significant decimals places to show for amounts less than 1.
const MAX_SIGNIFICANT_DECIMAL_PLACES = 3;

const ZERO_DISPLAY = '0';

export function formatAmountMaxPrecision(
  locale: string,
  num: number | BigNumber,
): string {
  return new Intl.NumberFormat(locale, {
    minimumSignificantDigits: 1,
  }).format(new BigNumber(num.toString()).toNumber());
}

/**
 * Formats the a token amount with variable precision and significant
 * digits.
 *
 * If |amount| < 1, we display a maximum number of significant
 * digits.
 *
 * If |amount| >= 1, we display all digits left of the decimal point.
 * We also display some decimal places for smaller amounts, and
 * gradually reduce the decimal precision as the amount
 * gets bigger until we only show whole numbers.
 *
 * Examples:
 *
 * | Amount               | Formatted          |
 * |----------------------|--------------------|
 * | 0                    | 0                  |
 * | 0.0000009            | <0.000001          |
 * | 0.0000456            | 0.000046           |
 * | 0.0004567            | 0.000457           |
 * | 0.003456             | 0.00346            |
 * | 0.023456             | 0.0235             |
 * | 0.125456             | 0.125              |
 * | 1.0034               | 1.003              |
 * | 1.034                | 1.034              |
 * | 1.3034               | 1.303              |
 * | 12.0345              | 12.03              |
 * | 121.456              | 121.5              |
 * | 1,034.123            | 1,034              |
 * | 47,361,034.006       | 47,361,034         |
 * | 12,130,982,923,409.5 | 12,130,982,923,410 |
 *
 * @param locale
 * @param amount
 */
export function formatAmount(locale: string, amount: BigNumber): string {
  if (amount.isZero()) {
    return ZERO_DISPLAY;
  }

  if (amount.abs().lessThan(MIN_AMOUNT)) {
    return `<${formatAmountMaxPrecision(locale, MIN_AMOUNT)}`;
  }

  if (amount.abs().lessThan(1)) {
    return new Intl.NumberFormat(locale, {
      maximumSignificantDigits: MAX_SIGNIFICANT_DECIMAL_PLACES,
    } as Intl.NumberFormatOptions).format(
      amount.round(DEFAULT_PRECISION).toNumber(),
    );
  }

  // Preserve all digits left of the decimal point.
  // Cap the digits right of the decimal point: The more digits present
  // on the left side of the decimal point, the less decimal places
  // we show on the right side.
  const digitsLeftOfDecimal = amount.abs().truncated().toString().length;
  const maximumFractionDigits = Math.max(
    0,
    MAX_SIGNIFICANT_DECIMAL_PLACES - digitsLeftOfDecimal + 1,
  );

  return new Intl.NumberFormat(locale, {
    maximumFractionDigits,
  } as Intl.NumberFormatOptions).format(amount.toNumber());
}
