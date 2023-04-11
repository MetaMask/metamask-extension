import { GAS_LIMITS } from '../../../shared/constants/gas';
import * as utils from './confirm-tx.util';

describe('Confirm Transaction utils', () => {
  describe('getHexGasTotal', () => {
    it('should multiply the hex gasLimit and hex gasPrice values together', () => {
      expect(
        utils.getHexGasTotal({
          gasLimit: GAS_LIMITS.SIMPLE,
          gasPrice: '0x3b9aca00',
        }),
      ).toStrictEqual('0x1319718a5000');
    });

    it('should prefix the result with 0x', () => {
      expect(
        utils.getHexGasTotal({ gasLimit: '5208', gasPrice: '3b9aca00' }),
      ).toStrictEqual('0x1319718a5000');
    });
  });

  describe('addEth', () => {
    it('should add two values together rounding to 6 decimal places', () => {
      expect(utils.addEth('0.12345678', '0')).toStrictEqual('0.123457');
    });

    it('should add any number of values together rounding to 6 decimal places', () => {
      expect(
        utils.addEth(
          '0.1',
          '0.02',
          '0.003',
          '0.0004',
          '0.00005',
          '0.000006',
          '0.0000007',
        ),
      ).toStrictEqual('0.123457');
    });
  });

  describe('addFiat', () => {
    it('should add two values together rounding to 2 decimal places', () => {
      expect(utils.addFiat('0.12345678', '0')).toStrictEqual('0.12');
    });

    it('should add any number of values together rounding to 2 decimal places', () => {
      expect(
        utils.addFiat(
          '0.1',
          '0.02',
          '0.003',
          '0.0004',
          '0.00005',
          '0.000006',
          '0.0000007',
        ),
      ).toStrictEqual('0.12');
    });
  });

  describe('getTransactionFee', () => {
    it('should get the transaction fee in ETH', () => {
      const ethTransactionFee = utils.getTransactionFee({
        value: '0x1319718a5000',
        toCurrency: 'ETH',
        conversionRate: 468.58,
        numberOfDecimals: 6,
      });

      expect(ethTransactionFee).toStrictEqual('0.000021');
    });

    it('should get the transaction fee in fiat', () => {
      const fiatTransactionFee = utils.getTransactionFee({
        value: '0x1319718a5000',
        toCurrency: 'usd',
        conversionRate: 468.58,
        numberOfDecimals: 2,
      });

      expect(fiatTransactionFee).toStrictEqual('0.01');
    });
  });

  describe('formatCurrency', () => {
    it('should format USD values', () => {
      const value = utils.formatCurrency('123.45', 'usd');
      expect(value).toStrictEqual('$123.45');
    });
  });
});
