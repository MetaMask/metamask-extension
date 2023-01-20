import BigNumber from 'bignumber.js';
import { ETH } from '../../ui/helpers/constants/common';
import {
  addCurrencies,
  conversionUtil,
  decWEIToDecETH,
  divideCurrencies,
  getValueFromWeiHex,
  getWeiHexFromDecimalValue,
} from './conversion.utils';

describe('conversion utils', () => {
  describe('addCurrencies()', () => {
    it('add whole numbers', () => {
      const result = addCurrencies(3, 9, {
        aBase: 10,
        bBase: 10,
      });
      expect(result.toNumber()).toStrictEqual(12);
    });

    it('add decimals', () => {
      const result = addCurrencies(1.3, 1.9, {
        aBase: 10,
        bBase: 10,
      });
      expect(result.toNumber()).toStrictEqual(3.2);
    });

    it('add repeating decimals', () => {
      const result = addCurrencies(1 / 3, 1 / 9, {
        aBase: 10,
        bBase: 10,
      });
      expect(result.toNumber()).toStrictEqual(0.4444444444444444);
    });
  });

  describe('conversionUtil', () => {
    it('returns expected types', () => {
      const conv1 = conversionUtil(1000000000000000000, {
        fromNumericBase: 'dec',
        toNumericBase: 'hex',
      });
      const conv2 = conversionUtil(1, {
        fromNumericBase: 'dec',
        fromDenomination: 'ETH',
        toDenomination: 'WEI',
      });
      expect(typeof conv1 === 'string').toStrictEqual(true);
      expect(conv2 instanceof BigNumber).toStrictEqual(true);
    });
    it('converts from dec to hex', () => {
      expect(
        conversionUtil('1000000000000000000', {
          fromNumericBase: 'dec',
          toNumericBase: 'hex',
        }),
      ).toStrictEqual('de0b6b3a7640000');
      expect(
        conversionUtil('1500000000000000000', {
          fromNumericBase: 'dec',
          toNumericBase: 'hex',
        }),
      ).toStrictEqual('14d1120d7b160000');
    });
    it('converts hex formatted numbers to dec', () => {
      expect(
        conversionUtil('0xde0b6b3a7640000', {
          fromNumericBase: 'hex',
          toNumericBase: 'dec',
        }),
      ).toStrictEqual('1000000000000000000');
      expect(
        conversionUtil('0x14d1120d7b160000', {
          fromNumericBase: 'hex',
          toNumericBase: 'dec',
        }),
      ).toStrictEqual('1500000000000000000');
    });
    it('converts WEI to ETH', () => {
      expect(
        conversionUtil('0xde0b6b3a7640000', {
          fromNumericBase: 'hex',
          toNumericBase: 'dec',
          fromDenomination: 'WEI',
          toDenomination: 'ETH',
        }),
      ).toStrictEqual('1');
      expect(
        conversionUtil('0x14d1120d7b160000', {
          fromNumericBase: 'hex',
          toNumericBase: 'dec',
          fromDenomination: 'WEI',
          toDenomination: 'ETH',
        }),
      ).toStrictEqual('1.5');
    });
    it('converts ETH to WEI', () => {
      expect(
        conversionUtil('1', {
          fromNumericBase: 'dec',
          fromDenomination: 'ETH',
          toDenomination: 'WEI',
        }).toNumber(),
      ).toStrictEqual(1000000000000000000);
      expect(
        conversionUtil('1.5', {
          fromNumericBase: 'dec',
          fromDenomination: 'ETH',
          toDenomination: 'WEI',
        }).toNumber(),
      ).toStrictEqual(1500000000000000000);
    });
    it('converts ETH to GWEI', () => {
      expect(
        conversionUtil('1', {
          fromNumericBase: 'dec',
          fromDenomination: 'ETH',
          toDenomination: 'GWEI',
        }).toNumber(),
      ).toStrictEqual(1000000000);
      expect(
        conversionUtil('1.5', {
          fromNumericBase: 'dec',
          fromDenomination: 'ETH',
          toDenomination: 'GWEI',
        }).toNumber(),
      ).toStrictEqual(1500000000);
    });
    it('converts ETH to USD', () => {
      expect(
        conversionUtil('1', {
          fromNumericBase: 'dec',
          toNumericBase: 'dec',
          toCurrency: 'usd',
          conversionRate: 468.58,
          numberOfDecimals: 2,
        }),
      ).toStrictEqual('468.58');
      expect(
        conversionUtil('1.5', {
          fromNumericBase: 'dec',
          toNumericBase: 'dec',
          toCurrency: 'usd',
          conversionRate: 468.58,
          numberOfDecimals: 2,
        }),
      ).toStrictEqual('702.87');
    });
    it('converts USD to ETH', () => {
      expect(
        conversionUtil('468.58', {
          fromNumericBase: 'dec',
          toNumericBase: 'dec',
          toCurrency: 'usd',
          conversionRate: 468.58,
          numberOfDecimals: 2,
          invertConversionRate: true,
        }),
      ).toStrictEqual('1');
      expect(
        conversionUtil('702.87', {
          fromNumericBase: 'dec',
          toNumericBase: 'dec',
          toCurrency: 'usd',
          conversionRate: 468.58,
          numberOfDecimals: 2,
          invertConversionRate: true,
        }),
      ).toStrictEqual('1.5');
    });
  });

  describe('divideCurrencies()', () => {
    it('should correctly divide decimal values', () => {
      const result = divideCurrencies(9, 3, {
        dividendBase: 10,
        divisorBase: 10,
      });
      expect(result.toNumber()).toStrictEqual(3);
    });

    it('should correctly divide hexadecimal values', () => {
      const result = divideCurrencies(1000, 0xa, {
        dividendBase: 16,
        divisorBase: 16,
      });
      expect(result.toNumber()).toStrictEqual(0x100);
    });

    it('should correctly divide hexadecimal value from decimal value', () => {
      const result = divideCurrencies(0x3e8, 0xa, {
        dividendBase: 16,
        divisorBase: 16,
      });
      expect(result.toNumber()).toStrictEqual(0x100);
    });

    it('should throw error for wrong base value', () => {
      expect(() => {
        divideCurrencies(0x3e8, 0xa, {
          dividendBase: 10.5,
          divisorBase: 7,
        });
      }).toThrow('Must specify valid dividendBase and divisorBase');
    });
  });

  describe('decWEIToDecETH', () => {
    it('converts 10000000000000 WEI to ETH', () => {
      const ethDec = decWEIToDecETH('10000000000000');
      expect('0.00001').toStrictEqual(ethDec);
    });

    it('converts 9358749494527040 WEI to ETH', () => {
      const ethDec = decWEIToDecETH('9358749494527040');
      expect('0.009358749').toStrictEqual(ethDec);
    });
  });

  describe('getWeiHexFromDecimalValue', () => {
    it('should correctly convert 0 in ETH', () => {
      const weiValue = getWeiHexFromDecimalValue({
        value: '0',
        fromCurrency: ETH,
        fromDenomination: ETH,
      });
      expect(weiValue).toStrictEqual('0');
    });
  });

  describe('getValueFromWeiHex', () => {
    it('should get the transaction amount in ETH', () => {
      const ethTransactionAmount = getValueFromWeiHex({
        value: '0xde0b6b3a7640000',
        toCurrency: 'ETH',
        conversionRate: 468.58,
        numberOfDecimals: 6,
      });

      expect(ethTransactionAmount).toStrictEqual('1');
    });

    it('should get the transaction amount in fiat', () => {
      const fiatTransactionAmount = getValueFromWeiHex({
        value: '0xde0b6b3a7640000',
        toCurrency: 'usd',
        conversionRate: 468.58,
        numberOfDecimals: 2,
      });

      expect(fiatTransactionAmount).toStrictEqual('468.58');
    });
  });
});
