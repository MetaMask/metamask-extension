const { addHexPrefix } = require('ethereumjs-util');
const { conversionUtil } = require('./conversion.utils');
const {
  getMaximumGasTotalInHexWei,
  getMinimumGasTotalInHexWei,
} = require('./gas.utils');

const feesToTest = [10, 24, 90];
const tipsToTest = [2, 10, 50];
const baseFeesToTest = [8, 12, 24];
const gasLimitsToTest = [21000, 100000];

describe('gas utils', () => {
  describe('when using EIP 1559 fields', () => {
    describe('getMaximumGasTotalInHexWei', () => {
      feesToTest.forEach((maxFeePerGas) => {
        describe(`when maxFeePerGas is ${maxFeePerGas}`, () => {
          gasLimitsToTest.forEach((gasLimit) => {
            const expectedResult = (gasLimit * maxFeePerGas).toString();
            const gasLimitHex = addHexPrefix(gasLimit.toString(16));
            const result = conversionUtil(
              getMaximumGasTotalInHexWei({
                gasLimit: gasLimitHex,
                maxFeePerGas: addHexPrefix(maxFeePerGas.toString(16)),
              }),
              { fromNumericBase: 'hex', toNumericBase: 'dec' },
            );
            it(`returns ${expectedResult} when provided gasLimit: ${gasLimit}`, () => {
              expect(result).toStrictEqual(expectedResult);
            });
          });
        });
      });
    });

    describe('getMinimumGasTotalInHexWei', () => {
      feesToTest.forEach((maxFeePerGas) => {
        tipsToTest.forEach((maxPriorityFeePerGas) => {
          baseFeesToTest.forEach((baseFeePerGas) => {
            describe(`when baseFee is ${baseFeePerGas}, maxFeePerGas is ${maxFeePerGas} and tip is ${maxPriorityFeePerGas}`, () => {
              const maximum = maxFeePerGas;
              const minimum = baseFeePerGas + maxPriorityFeePerGas;
              const expectedEffectiveGasPrice =
                minimum < maximum ? minimum : maximum;
              const results = gasLimitsToTest.map((gasLimit) => {
                const gasLimitHex = addHexPrefix(gasLimit.toString(16));
                const result = conversionUtil(
                  getMinimumGasTotalInHexWei({
                    gasLimit: gasLimitHex,
                    maxFeePerGas: addHexPrefix(maxFeePerGas.toString(16)),
                    maxPriorityFeePerGas: addHexPrefix(
                      maxPriorityFeePerGas.toString(16),
                    ),
                    baseFeePerGas: addHexPrefix(baseFeePerGas.toString(16)),
                  }),
                  { fromNumericBase: 'hex', toNumericBase: 'dec' },
                );
                return { result, gasLimit };
              });
              it(`should use an effective gasPrice of ${expectedEffectiveGasPrice}`, () => {
                expect(
                  results.every(({ result, gasLimit }) => {
                    const effectiveGasPrice = Number(result) / gasLimit;
                    return effectiveGasPrice === expectedEffectiveGasPrice;
                  }),
                ).toBe(true);
              });
              results.forEach(({ result, gasLimit }) => {
                const expectedResult = (
                  expectedEffectiveGasPrice * gasLimit
                ).toString();
                it(`returns ${expectedResult} when provided gasLimit: ${gasLimit}`, () => {
                  expect(result).toStrictEqual(expectedResult);
                });
              });
            });
          });
        });
      });
    });
  });

  describe('when using legacy fields', () => {
    describe('getMaximumGasTotalInHexWei', () => {
      feesToTest.forEach((gasPrice) => {
        describe(`when gasPrice is ${gasPrice}`, () => {
          gasLimitsToTest.forEach((gasLimit) => {
            const expectedResult = (gasLimit * gasPrice).toString();
            const gasLimitHex = addHexPrefix(gasLimit.toString(16));
            it(`returns ${expectedResult} when provided gasLimit of ${gasLimit}`, () => {
              expect(
                conversionUtil(
                  getMaximumGasTotalInHexWei({
                    gasLimit: gasLimitHex,
                    gasPrice: addHexPrefix(gasPrice.toString(16)),
                  }),
                  { fromNumericBase: 'hex', toNumericBase: 'dec' },
                ),
              ).toStrictEqual(expectedResult);
            });
          });
        });
      });
    });

    describe('getMinimumGasTotalInHexWei', () => {
      feesToTest.forEach((gasPrice) => {
        describe(`when gasPrice is ${gasPrice}`, () => {
          gasLimitsToTest.forEach((gasLimit) => {
            const expectedResult = (gasLimit * gasPrice).toString();
            const gasLimitHex = addHexPrefix(gasLimit.toString(16));
            it(`returns ${expectedResult} when provided gasLimit of ${gasLimit}`, () => {
              expect(
                conversionUtil(
                  getMinimumGasTotalInHexWei({
                    gasLimit: gasLimitHex,
                    gasPrice: addHexPrefix(gasPrice.toString(16)),
                  }),
                  {
                    fromNumericBase: 'hex',
                    toNumericBase: 'dec',
                  },
                ),
              ).toStrictEqual(expectedResult);
            });
          });
        });
      });
    });
  });
});
