import { TransactionStatus } from '@metamask/transaction-controller';
import { GAS_LIMITS } from '../../../../shared/constants/gas';
import {
  combineTransactionHistories,
  getActivities,
} from './transaction-activity-log.util';

describe('TransactionActivityLog utils', () => {
  describe('combineTransactionHistories', () => {
    it('should return no activities for an empty list of transactions', () => {
      expect(combineTransactionHistories([])).toStrictEqual([]);
    });

    it('should return no activities when transactions have no history', () => {
      const transactions = [
        {
          hash: '0xa14f13d36b3901e352ce3a7acb9b47b001e5a3370f06232a0953c6fc6fad91b3',
          id: 6400627574331058,
          loadingDefaults: false,
          chainId: '0x5',
          status: TransactionStatus.dropped,
          submittedTime: 1543958848135,
          time: 1543958845581,
          txParams: {
            from: '0x50a9d56c2b8ba9a5c7f2c08c3d26e0499f23a706',
            gas: GAS_LIMITS.SIMPLE,
            gasPrice: '0x3b9aca00',
            nonce: '0x32',
            to: '0xc5ae6383e126f901dcb06131d97a88745bfa88d6',
            value: '0x2386f26fc10000',
          },
        },
        {
          hash: '0xecbe181ee67c4291d04a7cb9ffbf1d5d831e4fbaa89994fd06bab5dd4cc79b33',
          id: 6400627574331060,
          lastGasPrice: '0x4190ab00',
          loadingDefaults: false,
          chainId: '0x5',
          status: TransactionStatus.confirmed,
          submittedTime: 1543958860054,
          time: 1543958857697,
          txParams: {
            from: '0x50a9d56c2b8ba9a5c7f2c08c3d26e0499f23a706',
            gas: GAS_LIMITS.SIMPLE,
            gasPrice: '0x481f2280',
            nonce: '0x32',
            to: '0xc5ae6383e126f901dcb06131d97a88745bfa88d6',
            value: '0x2386f26fc10000',
          },
          txReceipt: {
            status: '0x1',
          },
        },
      ];

      expect(combineTransactionHistories(transactions)).toStrictEqual([]);
    });
  });

  describe('getActivities', () => {
    it('should return no activities for an empty history', () => {
      const transaction = {
        id: 1,
        status: TransactionStatus.confirmed,
        txParams: {
          from: '0x1',
          gas: GAS_LIMITS.SIMPLE,
          gasPrice: '0x3b9aca00',
          nonce: '0xa4',
          to: '0x2',
          value: '0x2386f26fc10000',
        },
      };

      expect(getActivities(transaction)).toStrictEqual([]);
    });

    it('should return no activities when a transaction has no history', () => {
      const transaction = {
        id: 1,
        status: TransactionStatus.confirmed,
        txParams: {
          from: '0x1',
          gas: GAS_LIMITS.SIMPLE,
          gasPrice: '0x3b9aca00',
          nonce: '0xa4',
          to: '0x2',
          value: '0x2386f26fc10000',
        },
        hash: '0xabc',
        chainId: '0x5',
      };

      expect(getActivities(transaction, true)).toStrictEqual([]);
    });
  });
});
