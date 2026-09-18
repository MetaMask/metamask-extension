import { addHexPrefix } from 'ethereumjs-util';
import {
  getMaximumGasTotalInHexWei,
  getMinimumGasTotalInHexWei,
} from './gas.utils';
import { Numeric } from './Numeric';

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
                    gasLimitNoBuffer: gasLimitHex,
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
                    gasLimitNoBuffer: gasLimitHex,
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

  describe('error cases', () => {
    describe('getMaximumGasTotalInHexWei', () => {
      it('throws when neither gasPrice nor maxFeePerGas is provided', () => {
        expect(() =>
          getMaximumGasTotalInHexWei({ gasLimit: '0x5208' }),
        ).toThrow(
          'getMaximumGasTotalInHexWei requires gasPrice be provided to calculate legacy gas total',
        );
      });

      it('throws when called with no arguments', () => {
        expect(() => getMaximumGasTotalInHexWei()).toThrow(
          'getMaximumGasTotalInHexWei requires gasPrice be provided to calculate legacy gas total',
        );
      });
    });

    describe('getMinimumGasTotalInHexWei', () => {
      it('throws when both gasPrice and EIP-1559 fields are provided', () => {
        expect(() =>
          getMinimumGasTotalInHexWei({
            gasLimitNoBuffer: '0x5208',
            gasPrice: '0xa',
            maxFeePerGas: '0xa',
            maxPriorityFeePerGas: '0x2',
            baseFeePerGas: '0x8',
          }),
        ).toThrow(
          'getMinimumGasTotalInHexWei expects either gasPrice OR the EIP-1559 gas fields, but both were provided',
        );
      });

      it('throws when neither gasPrice nor EIP-1559 fields are provided', () => {
        expect(() =>
          getMinimumGasTotalInHexWei({ gasLimitNoBuffer: '0x5208' }),
        ).toThrow(
          'getMinimumGasTotalInHexWei expects either gasPrice OR the EIP-1559 gas fields, but neither were provided',
        );
      });

      it('throws when called with no arguments', () => {
        expect(() => getMinimumGasTotalInHexWei()).toThrow(
          'getMinimumGasTotalInHexWei expects either gasPrice OR the EIP-1559 gas fields, but neither were provided',
        );
      });

      it('throws when EIP-1559 fields are present but baseFeePerGas is missing', () => {
        expect(() =>
          getMinimumGasTotalInHexWei({
            gasLimitNoBuffer: '0x5208',
            maxFeePerGas: '0xa',
            maxPriorityFeePerGas: '0x2',
          }),
        ).toThrow(
          'getMinimumGasTotalInHexWei requires baseFeePerGas be provided when calculating EIP-1559 totals',
        );
      });

      it('throws when EIP-1559 fields are present but maxFeePerGas is missing', () => {
        expect(() =>
          getMinimumGasTotalInHexWei({
            gasLimitNoBuffer: '0x5208',
            maxPriorityFeePerGas: '0x2',
            baseFeePerGas: '0x8',
          }),
        ).toThrow(
          'getMinimumGasTotalInHexWei requires maxFeePerGas and maxPriorityFeePerGas be provided when calculating EIP-1559 totals',
        );
      });

      it('throws when EIP-1559 fields are present but maxPriorityFeePerGas is missing', () => {
        expect(() =>
          getMinimumGasTotalInHexWei({
            gasLimitNoBuffer: '0x5208',
            maxFeePerGas: '0xa',
            baseFeePerGas: '0x8',
          }),
        ).toThrow(
          'getMinimumGasTotalInHexWei requires maxFeePerGas and maxPriorityFeePerGas be provided when calculating EIP-1559 totals',
        );
      });
    });
  });

  describe('default parameter behaviour', () => {
    it('getMaximumGasTotalInHexWei uses 0x0 as default gasLimit', () => {
      const result = getMaximumGasTotalInHexWei({
        maxFeePerGas: '0xa',
      });
      expect(new Numeric(result, 16).toBase(10).toString()).toStrictEqual('0');
    });

    it('getMinimumGasTotalInHexWei uses 0x0 as default gasLimitNoBuffer', () => {
      const result = getMinimumGasTotalInHexWei({
        maxFeePerGas: '0xa',
        maxPriorityFeePerGas: '0x2',
        baseFeePerGas: '0x8',
      });
      expect(new Numeric(result, 16).toBase(10).toString()).toStrictEqual('0');
    });
  });
});
