import { EtherDenomination } from '../constants/common';
import {
  decWEIToDecETH,
  getValueFromWeiHex,
  getWeiHexFromDecimalValue,
} from './conversion.utils';

describe('conversion utils', () => {
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
        fromDenomination: EtherDenomination.ETH,
      });
      expect(weiValue).toStrictEqual('0');
    });

    it('should correctly convert 10 in ETH to 8ac7230489e80000 (10000000000000000000) wei', () => {
      const weiValue = getWeiHexFromDecimalValue({
        value: '10',
        fromDenomination: EtherDenomination.ETH,
      });
      expect(weiValue).toStrictEqual('8ac7230489e80000');
    });
  });

  describe('getValueFromWeiHex', () => {
    it('should get the transaction amount in ETH', () => {
      const ethTransactionAmount = getValueFromWeiHex({
        value: '0xde0b6b3a7640000',
        toCurrency: 'ETH',
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
