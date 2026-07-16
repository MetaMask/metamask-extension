import {
  TransactionEnvelopeType,
  TransactionStatus,
} from '@metamask/transaction-controller';
import { TransactionGroupStatus } from '../../../shared/constants/transaction';
import * as utils from './transactions.util';

describe('Transactions utils', () => {
  describe('getStatusKey', () => {
    it('should return the correct status', () => {
      const tests = [
        {
          transaction: {
            status: TransactionStatus.confirmed,
            txReceipt: {
              status: '0x0',
            },
          },
          expected: TransactionStatus.failed,
        },
        {
          transaction: {
            status: TransactionStatus.confirmed,
            txReceipt: {
              status: '0x1',
            },
          },
          expected: TransactionStatus.confirmed,
        },
        {
          transaction: {
            status: TransactionGroupStatus.pending,
          },
          expected: TransactionGroupStatus.pending,
        },
      ];

      tests.forEach(({ transaction, expected }) => {
        expect(utils.getStatusKey(transaction)).toStrictEqual(expected);
      });
    });
  });

  describe('isLegacyTransaction', () => {
    it('should return true if transaction is type-0', () => {
      expect(
        utils.isLegacyTransaction({ type: TransactionEnvelopeType.legacy }),
      ).toStrictEqual(true);
    });
    it('should return false if transaction is not type-0', () => {
      expect(
        utils.isLegacyTransaction({
          type: TransactionEnvelopeType.feeMarket,
        }),
      ).toStrictEqual(false);
    });
  });
});
