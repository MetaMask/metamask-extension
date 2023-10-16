import { TransactionStatus } from '../../../shared/constants/transaction';
import {
  afterSign,
  beforePublish,
  getAdditionalSignArguments,
} from './mmi-hooks';

describe('MMI hooks', () => {
  const fromMocked = '0xc684832530fcbddae4b4230a47e991ddcec2831d';
  const custodyIdMocked = '123';
  describe('afterSign', () => {
    it('returns false if txMeta has no custodyStatus', () => {
      const txMeta = { custodyStatus: undefined };
      const signedEthTx = {};
      const result = afterSign(txMeta, signedEthTx, jest.fn());
      expect(result).toBe(false);
    });

    it('returns true if txMeta has custodyStatus', () => {
      const txMeta = {
        custodyStatus: TransactionStatus.approved,
        custodyId: custodyIdMocked,
        txParams: { from: fromMocked },
      };
      const signedEthTx = {
        custodian_transactionId: custodyIdMocked,
        transactionStatus: TransactionStatus.signed,
      };
      const addTransactionToWatchList = jest.fn();
      const result = afterSign(txMeta, signedEthTx, addTransactionToWatchList);
      expect(result).toBe(true);
      expect(txMeta.custodyId).toBe(custodyIdMocked);
      expect(txMeta.custodyStatus).toBe(TransactionStatus.signed);
      expect(addTransactionToWatchList).toHaveBeenCalledWith(
        custodyIdMocked,
        fromMocked,
      );
    });
  });

  describe('beforePublish', () => {
    it('returns true if txMeta has custodyStatus', () => {
      const txMeta = { custodyStatus: true };
      const result = beforePublish(txMeta);
      expect(result).toBe(true);
    });

    it('returns false if txMeta has no custodyStatus', () => {
      const txMeta = { custodyStatus: false };
      const result = beforePublish(txMeta);
      expect(result).toBe(false);
    });
  });

  describe('getAdditionalSignArguments', () => {
    it('filters undefined arguments', () => {
      const args = [1, undefined, 2, 3, undefined, 4];
      const result = getAdditionalSignArguments(...args);
      expect(result).toEqual([1, 2, 3, 4]);
    });

    it('returns the single argument directly when only one argument is provided', () => {
      const args = '123';
      const result = getAdditionalSignArguments(args);
      expect(result).toStrictEqual(args);
    });
  });
});
