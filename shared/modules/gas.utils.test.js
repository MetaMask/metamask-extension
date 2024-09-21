const { addHexPrefix } = require('ethereumjs-util');
const {
  getMaximumGasTotalInHexWei,
  getMinimumGasTotalInHexWei,
} = require('./gas.utils');
const { Numeric } = require('./Numeric');

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
            const result = new Numeric(
              getMaximumGasTotalInHexWei({
                gasLimit: gasLimitHex,
                maxFeePerGas: addHexPrefix(maxFeePerGas.toString(16)),
              }),
              16,
            );
            it(`returns ${expectedResult} when provided gasLimit: ${gasLimit}`, () => {
              expect(result.toBase(10).toString()).toStrictEqual(
                expectedResult,
              );
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
                const result = new Numeric(
                  getMinimumGasTotalInHexWei({
                    gasLimit: gasLimitHex,
                    maxFeePerGas: addHexPrefix(maxFeePerGas.toString(16)),
                    maxPriorityFeePerGas: addHexPrefix(
                      maxPriorityFeePerGas.toString(16),
                    ),
                    baseFeePerGas: addHexPrefix(baseFeePerGas.toString(16)),
                  }),
                  16,
                );
                return { result: result.toBase(10).toString(), gasLimit };
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
                new Numeric(
                  getMaximumGasTotalInHexWei({
                    gasLimit: gasLimitHex,
                    gasPrice: addHexPrefix(gasPrice.toString(16)),
                  }),
                  16,
                )
                  .toBase(10)
                  .toString(),
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
                new Numeric(
                  getMinimumGasTotalInHexWei({
                    gasLimit: gasLimitHex,
                    gasPrice: addHexPrefix(gasPrice.toString(16)),
                  }),
                  16,
                )
                  .toBase(10)
                  .toString(),
              ).toStrictEqual(expectedResult);
            });
          });
        });
      });
    });
  });
});
