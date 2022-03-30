import {
  TRANSACTION_GROUP_STATUSES,
  TRANSACTION_STATUSES,
  TRANSACTION_ENVELOPE_TYPES,
} from '../../../shared/constants/transaction';
import * as utils from './transactions.util';

describe('Transactions utils', () => {
  describe('getStatusKey', () => {
    it('should return the correct status', () => {
      const tests = [
        {
          transaction: {
            status: TRANSACTION_STATUSES.CONFIRMED,
            txReceipt: {
              status: '0x0',
            },
          },
          expected: TRANSACTION_STATUSES.FAILED,
        },
        {
          transaction: {
            status: TRANSACTION_STATUSES.CONFIRMED,
            txReceipt: {
              status: '0x1',
            },
          },
          expected: TRANSACTION_STATUSES.CONFIRMED,
        },
        {
          transaction: {
            status: TRANSACTION_GROUP_STATUSES.PENDING,
          },
          expected: TRANSACTION_GROUP_STATUSES.PENDING,
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
        utils.isLegacyTransaction({ type: TRANSACTION_ENVELOPE_TYPES.LEGACY }),
      ).toStrictEqual(true);
    });
    it('should return false if transaction is not type-0', () => {
      expect(
        utils.isLegacyTransaction({
          type: TRANSACTION_ENVELOPE_TYPES.FEE_MARKET,
        }),
      ).toStrictEqual(false);
    });
  });
});
