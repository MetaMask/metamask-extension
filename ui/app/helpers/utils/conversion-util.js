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
* @param {string} [options.numberOfDecimals] The desired number of decimals in the result
* @param {string} [options.roundDown] The desired number of decimals to round down to
* @param {number} [options.conversionRate] The rate to use to make the fromCurrency -> toCurrency conversion
* @returns {(number | string | BN)}
*
* The utility passes value along with the options as a single object to the `converter` function.
* `converter` uses Ramda.js to apply a composition of conditional setters to the `value` property, depending
* on the accompanying options. Some of these conditional setters are selected via key-value maps, where
* the keys are specified in the options parameters and the values are setter functions.
*/

const BigNumber = require('bignumber.js')
const ethUtil = require('ethereumjs-util')
const BN = ethUtil.BN
const R = require('ramda')
const { stripHexPrefix } = require('ethereumjs-util')

BigNumber.config({
  ROUNDING_MODE: BigNumber.ROUND_HALF_DOWN,
})

// Big Number Constants
const BIG_NUMBER_WEI_MULTIPLIER = new BigNumber('1000000000000000000')
const BIG_NUMBER_GWEI_MULTIPLIER = new BigNumber('1000000000')
const BIG_NUMBER_ETH_MULTIPLIER = new BigNumber('1')

// Setter Maps
const toBigNumber = {
  hex: n => new BigNumber(stripHexPrefix(n), 16),
  dec: n => new BigNumber(String(n), 10),
  BN: n => new BigNumber(n.toString(16), 16),
}
const toNormalizedDenomination = {
  WEI: bigNumber => bigNumber.div(BIG_NUMBER_WEI_MULTIPLIER),
  GWEI: bigNumber => bigNumber.div(BIG_NUMBER_GWEI_MULTIPLIER),
  ETH: bigNumber => bigNumber.div(BIG_NUMBER_ETH_MULTIPLIER),
}
const toSpecifiedDenomination = {
  WEI: bigNumber => bigNumber.times(BIG_NUMBER_WEI_MULTIPLIER).round(),
  GWEI: bigNumber => bigNumber.times(BIG_NUMBER_GWEI_MULTIPLIER).round(9),
  ETH: bigNumber => bigNumber.times(BIG_NUMBER_ETH_MULTIPLIER).round(9),
}
const baseChange = {
  hex: n => n.toString(16),
  dec: n => (new BigNumber(n)).toString(10),
  BN: n => new BN(n.toString(16)),
}

// Individual Setters
const convert = R.invoker(1, 'times')
const round = R.invoker(2, 'round')(R.__, BigNumber.ROUND_HALF_DOWN)
const roundDown = R.invoker(2, 'round')(R.__, BigNumber.ROUND_DOWN)
const invertConversionRate = conversionRate => () => new BigNumber(1.0).div(conversionRate)
const decToBigNumberViaString = () => R.pipe(String, toBigNumber['dec'])

// Predicates
const fromAndToCurrencyPropsNotEqual = R.compose(
  R.not,
  R.eqBy(R.__, 'fromCurrency', 'toCurrency'),
  R.flip(R.prop)
)

// Lens
const valuePropertyLens = R.over(R.lensProp('value'))
const conversionRateLens = R.over(R.lensProp('conversionRate'))

// conditional conversionRate setting wrapper
const whenPredSetCRWithPropAndSetter = (pred, prop, setter) => R.when(
  pred,
  R.converge(
    conversionRateLens,
    [R.pipe(R.prop(prop), setter), R.identity]
  )
)

// conditional 'value' setting wrappers
const whenPredSetWithPropAndSetter = (pred, prop, setter) => R.when(
  pred,
  R.converge(
    valuePropertyLens,
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
  whenPredSetCRWithPropAndSetter(R.prop('conversionRate'), 'conversionRate', decToBigNumberViaString),
  whenPredSetCRWithPropAndSetter(R.prop('invertConversionRate'), 'conversionRate', invertConversionRate),
  whenPropApplySetterMap('fromNumericBase', toBigNumber),
  whenPropApplySetterMap('fromDenomination', toNormalizedDenomination),
  whenPredSetWithPropAndSetter(fromAndToCurrencyPropsNotEqual, 'conversionRate', convert),
  whenPropApplySetterMap('toDenomination', toSpecifiedDenomination),
  whenPredSetWithPropAndSetter(R.prop('numberOfDecimals'), 'numberOfDecimals', round),
  whenPredSetWithPropAndSetter(R.prop('roundDown'), 'roundDown', roundDown),
  whenPropApplySetterMap('toNumericBase', baseChange),
  R.view(R.lensProp('value'))
)

const conversionUtil = (value, {
  fromCurrency = null,
  toCurrency = fromCurrency,
  fromNumericBase,
  toNumericBase,
  fromDenomination,
  toDenomination,
  numberOfDecimals,
  conversionRate,
  invertConversionRate,
}) => converter({
  fromCurrency,
  toCurrency,
  fromNumericBase,
  toNumericBase,
  fromDenomination,
  toDenomination,
  numberOfDecimals,
  conversionRate,
  invertConversionRate,
  value: value || '0',
})

const addCurrencies = (a, b, options = {}) => {
  const {
    aBase,
    bBase,
    ...conversionOptions
  } = options
  const value = (new BigNumber(a.toString(), aBase)).add(b.toString(), bBase)

  return converter({
    value,
    ...conversionOptions,
  })
}

const subtractCurrencies = (a, b, options = {}) => {
  const {
    aBase,
    bBase,
    ...conversionOptions
  } = options
  const value = (new BigNumber(String(a), aBase)).minus(b, bBase)

  return converter({
    value,
    ...conversionOptions,
  })
}

const multiplyCurrencies = (a, b, options = {}) => {
  const {
    multiplicandBase,
    multiplierBase,
    ...conversionOptions
  } = options

  const bigNumberA = new BigNumber(String(a), multiplicandBase)
  const bigNumberB = new BigNumber(String(b), multiplierBase)

  const value = bigNumberA.times(bigNumberB)

  return converter({
    value,
    ...conversionOptions,
  })
}

const conversionGreaterThan = (
  { ...firstProps },
  { ...secondProps },
) => {
  const firstValue = converter({ ...firstProps })
  const secondValue = converter({ ...secondProps })

  return firstValue.gt(secondValue)
}

const conversionLessThan = (
  { ...firstProps },
  { ...secondProps },
) => {
  const firstValue = converter({ ...firstProps })
  const secondValue = converter({ ...secondProps })

  return firstValue.lt(secondValue)
}

const conversionMax = (
  { ...firstProps },
  { ...secondProps },
) => {
  const firstIsGreater = conversionGreaterThan(
    { ...firstProps },
    { ...secondProps }
  )

  return firstIsGreater ? firstProps.value : secondProps.value
}

const conversionGTE = (
  { ...firstProps },
  { ...secondProps },
) => {
  const firstValue = converter({ ...firstProps })
  const secondValue = converter({ ...secondProps })
  return firstValue.greaterThanOrEqualTo(secondValue)
}

const conversionLTE = (
  { ...firstProps },
  { ...secondProps },
) => {
  const firstValue = converter({ ...firstProps })
  const secondValue = converter({ ...secondProps })
  return firstValue.lessThanOrEqualTo(secondValue)
}

const toNegative = (n, options = {}) => {
  return multiplyCurrencies(n, -1, options)
}

module.exports = {
  conversionUtil,
  addCurrencies,
  multiplyCurrencies,
  conversionGreaterThan,
  conversionLessThan,
  conversionGTE,
  conversionLTE,
  conversionMax,
  toNegative,
  subtractCurrencies,
}
