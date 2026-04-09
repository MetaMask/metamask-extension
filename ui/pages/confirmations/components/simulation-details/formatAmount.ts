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
  const bigNumberValue = new BigNumber(num);
  const numberOfDecimals = bigNumberValue.decimalPlaces();
  const formattedValue = bigNumberValue.toFixed(numberOfDecimals);

  const [integerPart, fractionalPart] = formattedValue.split('.');
  const formattedIntegerPart = new Intl.NumberFormat(locale).format(
    integerPart as unknown as number,
  );

  return fractionalPart
    ? `${formattedIntegerPart}.${fractionalPart}`
    : formattedIntegerPart;
}

/**
 * Formats a token amount with variable precision and significant digits.
 *
 * For |amount| < 1, displays up to 3 significant digits, rounded according to `roundingMode`.
 * For |amount| >= 1, displays all integer digits and reduces decimal
 * precision as the integer grows (rounded per `roundingMode`), until only whole numbers are shown.
 *
 * The optional `roundingMode` controls how the last displayed digit is
 * determined. The default (ROUND_HALF_UP) rounds conventionally. Pass
 * ROUND_DOWN to truncate — useful for balance display where the shown
 * value must never exceed what the user actually holds.
 *
 * | Amount               | ROUND_HALF_UP (default) | ROUND_DOWN |
 * |----------------------|-------------------------|------------|
 * | 0                    | 0                       | 0          |
 * | 0.0000009            | <0.000001               | <0.000001  |
 * | 0.0000456            | 0.0000456               | 0.0000456  |
 * | 0.0004567            | 0.000457                | 0.000456   |
 * | 0.003456             | 0.00346                 | 0.00345    |
 * | 0.023456             | 0.0235                  | 0.0234     |
 * | 0.125456             | 0.125                   | 0.125      |
 * | 1.0034               | 1.003                   | 1.003      |
 * | 1.3034               | 1.303                   | 1.303      |
 * | 12.0345              | 12.03                   | 12.03      |
 * | 121.456              | 121.5                   | 121.4      |
 * | 1,034.123            | 1,034                   | 1,034      |
 * | 47,361,034.006       | 47,361,034              | 47,361,034 |
 * | 12,130,982,923,409.5 | 12,130,982,923,410      | 12,130,982,923,409 |
 *
 * @param locale
 * @param amount
 * @param roundingMode - BigNumber rounding mode (0–8). Defaults to
 * BigNumber.ROUND_HALF_UP. Pass BigNumber.ROUND_DOWN to truncate, e.g.
 * for balance display so values never appear larger than the user holds.
 */
export function formatAmount(
  locale: string,
  amount: BigNumber,
  roundingMode?: number,
): string {
  if (amount.isZero()) {
    return ZERO_DISPLAY;
  }

  if (amount.abs().lessThan(MIN_AMOUNT)) {
    return `<${formatAmountMaxPrecision(locale, MIN_AMOUNT)}`;
  }

  if (amount.abs().lessThan(1)) {
    // When a rounding mode is explicitly provided, pre-round to the exact
    // display precision before passing to Intl.NumberFormat so the formatter
    // never applies a second, independent rounding step.
    // e.g. ROUND_DOWN: 0.00054598 → 0.000545 instead of 0.000546
    //
    // Without a rounding mode, fall back to the original approach
    // (round to DEFAULT_PRECISION then let Intl.NumberFormat apply maxSigDigits)
    // to preserve backward-compatible output for all existing callers.
    const valueToFormat =
      roundingMode === undefined
        ? amount.round(DEFAULT_PRECISION).toNumber()
        : (amount.toPrecision(
            MAX_SIGNIFICANT_DECIMAL_PLACES,
            roundingMode,
          ) as unknown as number);

    return new Intl.NumberFormat(locale, {
      maximumSignificantDigits: MAX_SIGNIFICANT_DECIMAL_PLACES,
    } as Intl.NumberFormatOptions).format(valueToFormat);
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
  } as Intl.NumberFormatOptions).format(
    // string is valid parameter for format function
    // for some reason it gives TS issue
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/format#number
    amount.toFixed(maximumFractionDigits, roundingMode) as unknown as number,
  );
}
