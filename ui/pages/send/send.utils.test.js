import { rawEncode } from 'ethereumjs-abi';
import { calcGasTotal } from '../../../shared/lib/transactions-controller-utils';

import {
  multiplyCurrencies,
  addCurrencies,
  conversionGTE,
  conversionUtil,
} from '../../../shared/modules/conversion.utils';

import {
  generateERC20TransferData,
  isBalanceSufficient,
  isTokenBalanceSufficient,
  ellipsify,
} from './send.utils';

jest.mock('../../../shared/modules/conversion.utils', () => ({
  addCurrencies: jest.fn((a, b) => {
    let [a1, b1] = [a, b];
    if (String(a).match(/^0x.+/u)) {
      a1 = Number(String(a).slice(2));
    }
    if (String(b).match(/^0x.+/u)) {
      b1 = Number(String(b).slice(2));
    }
    return a1 + b1;
  }),
  conversionUtil: jest.fn((val) => parseInt(val, 16)),
  conversionGTE: jest.fn((obj1, obj2) => obj1.value >= obj2.value),
  multiplyCurrencies: jest.fn((a, b) => `${a}x${b}`),
  conversionGreaterThan: (obj1, obj2) => obj1.value > obj2.value,
  conversionLessThan: (obj1, obj2) => obj1.value < obj2.value,
}));

jest.mock('../../../shared/lib/transactions-controller-utils', () => {
  const originalModule = jest.requireActual(
    '../../../shared/lib/transactions-controller-utils',
  );

  return {
    ...originalModule,
    calcTokenAmount: (a, d) => `calc:${a}${d}`,
  };
});

jest.mock('ethereumjs-abi', () => ({
  rawEncode: jest.fn().mockReturnValue(16, 1100),
}));

describe('send utils', () => {
  describe('calcGasTotal()', () => {
    it('should call multiplyCurrencies with the correct params and return the multiplyCurrencies return', () => {
      const result = calcGasTotal(12, 15);
      expect(result).toStrictEqual('12x15');
      expect(multiplyCurrencies).toHaveBeenCalledWith(12, 15, {
        multiplicandBase: 16,
        multiplierBase: 16,
        toNumericBase: 'hex',
      });
    });
  });

  describe('generateERC20TransferData()', () => {
    it('should return undefined if not passed a send token', () => {
      expect(
        generateERC20TransferData({
          toAddress: 'mockAddress',
          amount: '0xa',
          sendToken: undefined,
        }),
      ).toBeUndefined();
    });

    it('should call abi.rawEncode with the correct params', () => {
      generateERC20TransferData({
        toAddress: 'mockAddress',
        amount: 'ab',
        sendToken: { address: '0x0' },
      });
      expect(rawEncode.mock.calls[0].toString()).toStrictEqual(
        [
          ['address', 'uint256'],
          ['0xmockAddress', '0xab'],
        ].toString(),
      );
    });

    it('should return encoded token transfer data', () => {
      expect(
        generateERC20TransferData({
          toAddress: 'mockAddress',
          amount: '0xa',
          sendToken: { address: '0x0' },
        }),
      ).toStrictEqual('0xa9059cbb');
    });
  });

  describe('isBalanceSufficient()', () => {
    it('should correctly call addCurrencies and return the result of calling conversionGTE', () => {
      const result = isBalanceSufficient({
        amount: 15,
        balance: 100,
        conversionRate: 3,
        gasTotal: 17,
        primaryCurrency: 'ABC',
      });
      expect(addCurrencies).toHaveBeenCalledWith(15, 17, {
        aBase: 16,
        bBase: 16,
        toNumericBase: 'hex',
      });
      expect(conversionGTE).toHaveBeenCalledWith(
        {
          value: 100,
          fromNumericBase: 'hex',
          fromCurrency: 'ABC',
          conversionRate: 3,
        },
        {
          value: 32,
          fromNumericBase: 'hex',
          conversionRate: 3,
          fromCurrency: 'ABC',
        },
      );

      expect(result).toStrictEqual(true);
    });
  });

  describe('isTokenBalanceSufficient()', () => {
    it('should correctly call conversionUtil and return the result of calling conversionGTE', () => {
      const result = isTokenBalanceSufficient({
        amount: '0x10',
        tokenBalance: 123,
        decimals: 10,
      });

      expect(conversionUtil).toHaveBeenCalledWith('0x10', {
        fromNumericBase: 'hex',
      });

      expect(conversionGTE).toHaveBeenCalledWith(
        {
          value: 123,
          fromNumericBase: 'hex',
        },
        {
          value: 'calc:1610',
        },
      );

      expect(result).toStrictEqual(false);
    });
  });

  describe('ellipsify()', () => {
    it('should ellipsify a contract address', () => {
      expect(
        ellipsify('0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC'),
      ).toStrictEqual('0xCcCC...cccC');
    });

    it('should return an empty string if the passed text is not defined', () => {
      expect(ellipsify(undefined)).toStrictEqual('');
    });
  });
});
