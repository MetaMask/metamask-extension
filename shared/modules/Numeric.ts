import { BigNumber } from 'bignumber.js';
import BN from 'bn.js';
import { isHexString, isNullOrUndefined } from '@metamask/utils';
import { addHexPrefix } from 'ethereumjs-util';
import { EtherDenomination } from '../constants/common';
import { stripHexPrefix } from './hexstring-utils';

const MAX_DECIMALS_FOR_TOKENS = 36;
BigNumber.config({ DECIMAL_PLACES: MAX_DECIMALS_FOR_TOKENS });
export type NumericValue = string | number | BN | BigNumber;
export type NumericBase = 10 | 16;

/**
 * All variations of isHexString from our own utilities and etherumjs-utils
 * return false for a '-' prefixed hex string. This utility method strips the
 * possible '-' from the string before testing its validity so that negative
 * hex values can be properly handled.
 *
 * @param value - The string to check
 * @returns true if the value is a hex string (negative or otherwise)
 */
function isHexStringOrNegatedHexString(value: string): value is string {
  return isHexString(value.replace('-', '')) || isHexString(value);
}

/**
 * BigNumber supports hex strings with '.' (aka decimals) in the string.
 * No version of isHexString returs true if the string contains a decimal so
 * this method is used to check if both parts of the string split by the
 * decimal are hex strings. If so we can feed this value into BigNumber to get
 * a valid Numeric.
 *
 * @param value - The string to check
 * @returns true if the string is a hexadecimal split by '.'
 */
function isDecimalHex(value: string): boolean {
  const parts = value.split('.');
  if (parts.length === 1) {
    return false;
  }
  return parts.every((part) => isHexStringOrNegatedHexString(part));
}

/**
 * Converts a hexadecimal in string or number format to a BigNumber.
 * Note that in many places in our codebase we call 'addHexPrefix' on a negated
 * hexadecimal string resulting in '0x-a' which will fail checks for
 * isHexString. Sometimes we DO not add the 0x so we have to check for '-a'
 * as well.
 *
 * @param value - hexadecimal value in string or number format.
 * @returns A BigNumber representation of the value
 */
function hexadecimalToBigNumber(value: string | number): BigNumber {
  const stringified = typeof value === 'number' ? `${value}` : value;
  const isNegative = stripHexPrefix(stringified)[0] === '-';
  const valueWithoutNegation = stringified.replace('-', '');

  const valueAsBigNumber = new BigNumber(
    stripHexPrefix(valueWithoutNegation),
    16,
  );

  return isNegative ? valueAsBigNumber.negated() : valueAsBigNumber;
}

/**
 * Converts a decimal in string or number format to a BigNumber.
 *
 * @param value - decimal value in string or number format.
 * @returns A BigNumber representation of the value
 */
function decimalToBigNumber(value: string | number) {
  return new BigNumber(String(value), 10);
}

/**
 * This method is used to safely convert a string type value to a BigNumber.
 * The only valid strings for this method are those that are either hexadecimal
 * numeric values OR numeric strings that can be converted to BigNumbers. It is
 * impossible to tell the difference between a hex value of 100000 vs a decimal
 * value of 100000 so a second parameter indicating the numeric base of the
 * string value must be provided.
 *
 * @param value - A hexadecimal or decimal string
 * @param numericBase - Either 16 for a hexadeciaml or 10 for a decimal
 * @returns A BigNumber representation of the value
 */
function stringToBigNumber(value: string, numericBase: NumericBase) {
  if (typeof value !== 'string') {
    throw new Error(
      `Value of type ${typeof value} passed to stringToBigNumber`,
    );
  }
  if (
    numericBase === 16 &&
    (isHexStringOrNegatedHexString(value) || isDecimalHex(value))
  ) {
    return hexadecimalToBigNumber(value);
  } else if (
    numericBase === 10 &&
    // check if we have a finite integer or float
    (isFinite(parseInt(value, 10)) || isFinite(parseFloat(value)))
  ) {
    return decimalToBigNumber(value);
  }
  throw new Error(
    `String provided to stringToBigNumber is not a hexadecimal or decimal string: ${value}, ${numericBase}`,
  );
}

/**
 * This method will convert a hexadecimal or deciaml number into a BigNumber.
 * The second parameter must be supplied and determines whether to treat the
 * value as a hexadecimal or decimal value.
 *
 * @param value - hexadecimal or decimal number[]
 * @param numericBase - 10 for decimal, 16 for hexadecimal
 * @returns BigNumber representation of the value
 */
function numberToBigNumber(value: number, numericBase: NumericBase) {
  if (typeof value !== 'number') {
    throw new Error(
      `Value of type ${typeof value} passed to numberToBigNumber`,
    );
  }
  if (numericBase === 16 && isHexString(`${value}`)) {
    return new BigNumber(`${value}`, 16);
  }
  return new BigNumber(value, 10);
}

/**
 * Method to convert a BN to a BigNumber
 *
 * @param value - A BN representation of a value
 * @returns A BigNumber representation of the BN's underlying value
 */
function bnToBigNumber(value: BN) {
  if (value instanceof BN === false) {
    throw new Error(
      `value passed to bnToBigNumber is not a BN. Received type ${typeof value}`,
    );
  }
  return new BigNumber(value.toString(16), 16);
}

/**
 * Converts a value of the supported types (string, number, BN) to a BigNumber.
 *
 * @param value - The value to convert to a BigNumber
 * @param numericBase - The numeric base of the underlying value
 * @returns A BigNumber representation of the value
 */
function valueToBigNumber(value: string | number, numericBase: NumericBase) {
  if (typeof value === 'string') {
    return stringToBigNumber(value, numericBase);
  } else if (typeof value === 'number' && isNaN(value) === false) {
    return numberToBigNumber(value, numericBase);
  }

  throw new Error(
    `Value: ${value} is not a string, number, BigNumber or BN. Type is: ${typeof value}.`,
  );
}

// Big Number Constants
const BIG_NUMBER_WEI_MULTIPLIER = new BigNumber('1000000000000000000');
const BIG_NUMBER_GWEI_MULTIPLIER = new BigNumber('1000000000');
const BIG_NUMBER_ETH_MULTIPLIER = new BigNumber('1');

const toNormalizedDenomination = {
  WEI: (bigNumber: BigNumber) => bigNumber.div(BIG_NUMBER_WEI_MULTIPLIER),
  GWEI: (bigNumber: BigNumber) => bigNumber.div(BIG_NUMBER_GWEI_MULTIPLIER),
  ETH: (bigNumber: BigNumber) => bigNumber.div(BIG_NUMBER_ETH_MULTIPLIER),
};
const toSpecifiedDenomination = {
  WEI: (bigNumber: BigNumber) =>
    bigNumber.times(BIG_NUMBER_WEI_MULTIPLIER).round(),
  GWEI: (bigNumber: BigNumber) =>
    bigNumber.times(BIG_NUMBER_GWEI_MULTIPLIER).round(9),
  ETH: (bigNumber: BigNumber) =>
    bigNumber.times(BIG_NUMBER_ETH_MULTIPLIER).round(9),
};

/**
 * Gets the value in ETH of the numeric supplied, used in this file only to
 * convert to ETH prior to converting to another denomination. The following
 * quirks were programmed into this method to replicate behavior of the
 * predecessor to Numeric, which was 'conversionUtil'. If a denomination is
 * not supplied, and toDenomination is called, then we assume the denomination
 * was originally ETH, otherwise we convert it to ETH.
 *
 * @param numeric
 * @returns value in ETH
 */
function getValueInETH(numeric: Numeric) {
  if (
    numeric.denomination === EtherDenomination.ETH ||
    typeof numeric.denomination === 'undefined'
  ) {
    return numeric.value;
  }
  return toNormalizedDenomination[numeric.denomination](numeric.value);
}

/**
 * When applying operands to Numerics that have a specified Denomination then
 * we should first convert the provided inputNumeric to the same Denomination
 * as the baseNumeric. There are cases where this doesn't apply:
 *
 * 1. If the denominations are already the same. No conversion is necessary.
 * 2. If the inputNumeric does not have a denomination set. We assume in this
 * case that the value is already in the appropriate denomination.
 *
 * @param baseNumeric
 * @param inputNumeric
 * @returns
 */
function alignOperandDenominations(
  baseNumeric: Numeric,
  inputNumeric: Numeric,
) {
  if (
    typeof inputNumeric.denomination !== 'undefined' &&
    baseNumeric.denomination !== inputNumeric.denomination
  ) {
    return inputNumeric.toDenomination(baseNumeric.denomination);
  }

  return inputNumeric;
}

/**
 * Numeric is a class whose methods will always return a new, not mutated,
 * value. This allows for chaining of non-terminating methods. Previously we
 * had near a hundred helper methods that composed one-another, making tracking
 * through the chain near impossible. This API is designed such that no helper
 * methods should be needed. Take the case of hexWEIToDecGWEI, a helper method
 * for taking a hex string representing a value in WEI and converting that to a
 * decimal of GWEI. Prior to this class the method would call into our root
 * level 'conversionUtil' which was the proverbial kitchen sink doing
 * everything from denomination conversion, currency conversion (with provided
 * conversionRate prop) and more. The same opeartion can now be expressed as:
 * new Numeric(hexString, 16, EtherDenomination.WEI)
 * .toDenomination(EtherDenomination.GWEI)
 * .toBase(10)
 * .toString();
 * This has the benefit of being fairly transparent as you can read each step
 * in the chain and have a good sense of what is being done. It also is highly
 * composable so that we shouldn't need tons of helper methods for shortcuts.
 */
export class Numeric {
  /**
   * The underlying value of the Numeric, always in BigNumber form
   */
  value: BigNumber;

  /**
   * The numeric base for this Numeric, either 10 for decimal or 16 for Hex
   */
  base?: NumericBase;

  /**
   * The current denomination, if any. The only supported denominations are
   * ETH, GWEI, WEI.
   */
  denomination?: EtherDenomination;

  constructor(
    value: NumericValue,
    base?: NumericBase,
    denomination?: EtherDenomination,
  ) {
    this.base = base;
    this.denomination = denomination;
    if (value instanceof BigNumber) {
      this.value = value;
    } else if (value instanceof BN) {
      this.value = bnToBigNumber(value);
    } else if (
      isNullOrUndefined(value) ||
      (typeof value === 'number' && isNaN(value)) ||
      (typeof value === 'string' && value === '')
    ) {
      // There are parts of the codebase that call this method without a value,
      // or with a 'NaN' (which is probably a bug somewhere in our tests?).
      // Over time of converting to TypeScript we will eradicate those, but the
      // helper methods that those instances employ would default the value to
      // 0. This block keeps that intact.
      this.value = new BigNumber('0', 10);
      this.base = 10;
    } else if (base) {
      this.value = valueToBigNumber(value, base);
    } else {
      throw new Error(
        `You must specify the base of the provided number if the value is not already a BigNumber`,
      );
    }
  }

  /**
   * This is a tool used internally to check if a value is already a Numeric
   * and return it if it is, otherwise it uses the other provided arguments to
   * create a new Numeric.
   *
   * @param value - The value of the Numeric
   * @param base - Either undefined, 10 for decimal or 16 for hexadecimal
   * @param denomination - The Ether denomination to set, if any
   */
  static from(
    value: Numeric | NumericValue,
    base?: NumericBase,
    denomination?: EtherDenomination,
  ) {
    if (value instanceof Numeric) {
      if (base || denomination) {
        throw new Error(
          `Numeric.from was called with a value (${value.toString()}) that is already a Numeric but a base and/or denomination was provided. Only supply base or denomination when creating a new Numeric`,
        );
      }
      return value;
    }
    return new Numeric(value, base, denomination);
  }

  /** Conversions */

  /**
   * Returns a new Numeric with the base value changed to the provided base,
   * or the original Numeric if the base provided is the same as the current
   * base. No computation or conversion happens here but rather the result of
   * toString will be changed depending on the value of this.base when that
   * method is invoked.
   *
   * @param base - The numeric base to change the Numeric to, either 10 or 16
   * @returns A new Numeric with the base updated
   */
  toBase(base: NumericBase) {
    if (this.base !== base) {
      return new Numeric(this.value, base, this.denomination);
    }
    return this;
  }

  /**
   * Converts the value to the specified denomination. The following quirks of
   * the predecessor to Numeric, 'conversionUtil', were programmed into this
   * method:
   * 1. You may supply a denomination that is undefined, which will result in
   * nothing happening. Coincidently this is also useful due to the nature of
   * chaining operations on Numeric. You may pass an undefined value in this
   * method without breaking the chain to conditionally apply a operator.
   * 2. If the numeric that .toDenomination is called on does not have a
   * denomination set, that is it was constructed without the third parameter,
   * then it is assumed to be in ETH. Otherwise we convert it to ETH prior to
   * attempting to convert it to another denomination because all of the
   * toSpecifiedDenomination methods assume a value in ETH is passed.
   *
   * @param denomination - The denomination to convert to
   * @returns A new numeric with the same base as the previous, but the
   * value and denomination changed accordingly
   */
  toDenomination(denomination?: EtherDenomination) {
    if (denomination && this.denomination !== denomination) {
      const result = new Numeric(
        toSpecifiedDenomination[denomination](getValueInETH(this)),
        this.base,
        denomination,
      );
      return result;
    }
    return this;
  }

  /**
   * Replicates a method of BigNumber that is not in the version of BigNumber
   * that we use currently. Essentially shifting the decimal point backwards by
   * an amount equal to the positive number supplied to the decimals operator.
   * For example, calling shiftedBy(10) on the value 10000000000 will result in
   * a value of 1.0000000000. If passing a negative number, then the decimal
   * position will move forward. 1.0000000000 shiftedBy(-10) yields 10000000000
   *
   * @param decimals - The number of decimal places to move. Positive moves
   * decimal backwards, creating a smaller number. Negative values move the
   * decimal forwards, creating a larger number.
   * @returns A new numeric with the same base and denomination as the current
   * but with a new value.
   */
  shiftedBy(decimals: number) {
    const powerOf = new Numeric(Math.pow(10, decimals), 10);
    return this.divide(powerOf);
  }

  /**
   * Applies a conversion rate to the Numeric. If rate is undefined returns the
   * same instance that was operated on. Allowing an undefined value makes
   * chaining this operator feasible with undefined values from the user or
   * state without manipulating the number. For example:
   *
   * new Numeric(5, 10)
   * .applyConversionRate(possiblyUndefinedRate)
   * .toBase(16)
   * .toString();
   *
   * Will return a valid result as long as possiblyUndefinedRate is undefined,
   * a BigNumber or a number. In some areas of the codebase we check to see if
   * the target currency is different from the current currency before applying
   * a conversionRate. This functionality is not built into Numeric and will
   * require breaking the chain before calling this method:
   * let value = new Numeric(5, 10);
   *
   * if (fromCurrency !== toCurrency) {
   * value = value.applyConversionRate(possiblyUndefinedRate);
   * }
   *
   * return value.toBase(16).toString();
   *
   * @param rate - The multiplier to apply
   * @param invert - if true, inverts the rate
   * @returns New Numeric value with conversion rate applied.
   */
  applyConversionRate(rate?: number | BigNumber, invert?: boolean) {
    if (typeof rate === 'undefined') {
      return this;
    }

    let conversionRate = new Numeric(rate, 10);
    if (invert) {
      conversionRate = new Numeric(new BigNumber(1.0)).divide(conversionRate);
    }
    return this.times(conversionRate);
  }

  round(
    numberOfDecimals?: number,
    roundingMode: number = BigNumber.ROUND_HALF_DOWN,
  ) {
    if (typeof numberOfDecimals === 'number') {
      return new Numeric(
        this.value.round(numberOfDecimals, roundingMode),
        this.base,
        this.denomination,
      );
    }
    return this;
  }

  /**
   * TODO: make it possible to add ETH + GWEI value. So if you have
   * Numeric 1 with denomination ETH and Numeric 2 with Denomination WEI,
   * first convert Numeric 2 to ETH then add the amount to Numeric 1.
   *
   * @param value
   * @param base
   * @param denomination
   */
  add(
    value: Numeric | NumericValue,
    base?: NumericBase,
    denomination?: EtherDenomination,
  ) {
    const numeric = Numeric.from(value, base, denomination);
    return new Numeric(
      this.value.add(alignOperandDenominations(this, numeric).value),
      this.base,
      this.denomination,
    );
  }

  /**
   * TODO: make it possible to subtract ETH - GWEI value. So if you have
   * Numeric 1 with denomination ETH and Numeric 2 with Denomination WEI,
   * first convert Numeric 2 to ETH then subtract the amount from Numeric 1.
   *
   * @param value
   * @param base
   * @param denomination
   */
  minus(
    value: Numeric | NumericValue,
    base?: NumericBase,
    denomination?: EtherDenomination,
  ) {
    const numeric = Numeric.from(value, base, denomination);

    return new Numeric(
      this.value.minus(alignOperandDenominations(this, numeric).value),
      this.base,
      this.denomination,
    );
  }

  times(
    multiplier: Numeric | NumericValue,
    base?: NumericBase,
    denomination?: EtherDenomination,
  ) {
    const multiplierNumeric = Numeric.from(multiplier, base, denomination);
    return new Numeric(
      this.value.times(
        alignOperandDenominations(this, multiplierNumeric).value,
      ),
      this.base,
      this.denomination,
    );
  }

  /**
   * Divides the Numeric by another supplied Numeric, carrying over the base
   * and denomination from the current Numeric.
   *
   * @param divisor - The Numeric to divide this Numeric by
   * @param base
   * @param denomination
   * @returns A new Numeric that contains the result of the division
   */
  divide(
    divisor: Numeric | NumericValue,
    base?: NumericBase,
    denomination?: EtherDenomination,
  ) {
    return new Numeric(
      this.value.div(
        alignOperandDenominations(
          this,
          Numeric.from(divisor, base, denomination),
        ).value,
      ),
      this.base,
      this.denomination,
    );
  }

  greaterThan(
    comparator: Numeric | NumericValue,
    base?: NumericBase,
    denomination?: EtherDenomination,
  ) {
    return this.value.greaterThan(
      Numeric.from(comparator, base, denomination).value,
    );
  }

  greaterThanOrEqualTo(
    comparator: Numeric | NumericValue,
    base?: NumericBase,
    denomination?: EtherDenomination,
  ) {
    return this.value.greaterThanOrEqualTo(
      Numeric.from(comparator, base, denomination).value,
    );
  }

  lessThan(
    comparator: Numeric | NumericValue,
    base?: NumericBase,
    denomination?: EtherDenomination,
  ) {
    return this.value.lessThan(
      Numeric.from(comparator, base, denomination).value,
    );
  }

  lessThanOrEqualTo(
    comparator: Numeric | NumericValue,
    base?: NumericBase,
    denomination?: EtherDenomination,
  ) {
    return this.value.lessThanOrEqualTo(
      Numeric.from(comparator, base, denomination).value,
    );
  }

  isNegative() {
    return this.value.isNegative();
  }

  isPositive() {
    return this.isNegative() === false;
  }

  isFloat() {
    return this.value.decimalPlaces() > 0;
  }

  /**
   * Get a base 16 hexadecimal string representation of the Numeric that is
   * 0x prefixed. This operation bypasses the currently set base of the
   * Numeric.
   *
   * @returns 0x prefixed hexstring.
   */
  toPrefixedHexString() {
    return addHexPrefix(this.value.toString(16));
  }

  /**
   * Gets the string representation of the Numeric, using the current value of
   * this.base to determine if it should be a decimal or hexadecimal string.
   *
   * @returns the string representation of the Numeric
   */
  toString() {
    return this.value.toString(this.base);
  }

  /**
   * Returns a fixed-point decimal string representation of the Numeric
   *
   * @param decimals - the amount of decimal precision to use when rounding
   * @returns A fixed point decimal string represenation of the Numeric
   */
  toFixed(decimals: number) {
    return this.value.toFixed(decimals);
  }

  /**
   * Converts the value to a JavaScript Number, with all of the inaccuracy that
   * could come with that.
   *
   * @returns The value as a JS Number
   */
  toNumber() {
    return this.value.toNumber();
  }
}
