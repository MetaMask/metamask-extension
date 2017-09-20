/* Currency Conversion Utility
* This utility function can be used for converting currency related values within metamask.
* The caller should be able to pass it a value, along with information about the value's
* numeric base, denomination and currency, and the desired numeric base, denomination and
* currency. It should return a single value.
*
* @param {(number | string | BN)} value The value to convert.
* @param {Object} [options] Options to specify details of the conversion
* @param {string} [options.fromCurrency = 'ETH' | 'USD'] The currency of the passed value
* @param {string} [options.toCurrency = 'ETH' | 'USD'] The desired currency of the result
* @param {string} [options.fromNumericBase = 'hex' | 'dec' | 'BN'] The numeric basic of the passed value.
* @param {string} [options.toNumericBase = 'hex' | 'dec' | 'BN'] The desired numeric basic of the result.
* @param {string} [options.fromDenomination = 'WEI'] The denomination of the passed value
* @param {number} [options.numberOfDecimals] The desired number of in the result
* @param {number} [options.conversionRate] The rate to use to make the fromCurrency -> toCurrency conversion
* @param {number} [options.ethToUSDRate] If present, a second conversion - at ethToUSDRate - happens after conversionRate is applied.
* @returns {(number | string | BN)}
*
* The utility passes value along with the options as a single object to the `converter` function.
* `converter` uses Ramda.js to apply a composition of conditional setters to the `value` property, depending
* on the accompanying options. Some of these conditional setters are selected via key-value maps, where
* the keys are specified in the options parameters and the values are setter functions.
*/

const BigNumber = require('bignumber.js')
const R = require('ramda')
const { stripHexPrefix } = require('ethereumjs-util')

BigNumber.config({
  ROUNDING_MODE: BigNumber.ROUND_HALF_DOWN,
})

// Big Number Constants
const BIG_NUMBER_WEI_MULTIPLIER = new BigNumber('1000000000000000000')

// Individual Setters
const convert = R.invoker(1, 'times')
const round = R.invoker(2, 'toFormat')(R.__, BigNumber.ROUND_DOWN)

// Setter Maps
const toBigNumber = {
  hex: n => new BigNumber(stripHexPrefix(n), 16),
  dec: n => new BigNumber(n, 10),
  BN: n => new BigNumber(n.toString(16), 16),
}
const toNormalizedDenomination = {
  WEI: bigNumber => bigNumber.div(BIG_NUMBER_WEI_MULTIPLIER)
}
const toSpecifiedDenomination = {
  WEI: bigNumber => bigNumber.times(BIG_NUMBER_WEI_MULTIPLIER)
}
const baseChange = {
  hex: n => n.toString(16),
  dec: n => Number(n).toString(10),
  BN: n => new BN(n.toString(16)),
}

// Predicates
const fromAndToCurrencyPropsNotEqual = R.compose(
  R.not,
  R.eqBy(R.__, 'fromCurrency', 'toCurrency'),
  R.flip(R.prop)
)

// Lens
const valuePropertyLense = R.over(R.lensProp('value'))

// conditional 'value' setting wrappers
const whenPredSetWithPropAndSetter = (pred, prop, setter) => R.when(
  pred,
  R.converge(
    valuePropertyLense,
    [R.pipe(R.prop(prop), setter), R.identity]
  )
)
const whenPropApplySetterMap = (prop, setterMap) => whenPredSetWithPropAndSetter(
  R.prop(prop),
  prop,
  R.prop(R.__, setterMap)
)

// Conversion utility function
const converter = R.pipe(
  whenPropApplySetterMap('fromNumericBase', toBigNumber),
  whenPropApplySetterMap('fromDenomination', toNormalizedDenomination),
  whenPropApplySetterMap('toDenomination', toSpecifiedDenomination),
  whenPredSetWithPropAndSetter(fromAndToCurrencyPropsNotEqual, 'conversionRate', convert),
  whenPredSetWithPropAndSetter(R.prop('ethToUSDRate'), 'ethToUSDRate', convert),
  whenPredSetWithPropAndSetter(R.prop('numberOfDecimals'), 'numberOfDecimals', round),
  whenPropApplySetterMap('toNumericBase', baseChange),
  R.view(R.lensProp('value'))
);

const conversionUtil = (value, {
  fromCurrency = null,
  toCurrency = fromCurrency,
  fromNumericBase,
  toNumericBase,
  fromDenomination,
  toDenomination,
  numberOfDecimals,
  conversionRate,
  ethToUSDRate,
}) => converter({
  fromCurrency,
  toCurrency,
  fromNumericBase,
  toNumericBase,
  fromDenomination,
  toDenomination,
  numberOfDecimals,
  conversionRate,
  ethToUSDRate,
  value,
});

const addCurrencies = (a, b, { toNumericBase, numberOfDecimals }) => {
  const value = (new BigNumber(a)).add(b);
  return converter({
    value,
    toNumericBase,
    numberOfDecimals,
  })
}

module.exports = {
  conversionUtil,
  addCurrencies,
}