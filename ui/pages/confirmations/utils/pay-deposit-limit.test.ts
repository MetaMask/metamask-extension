import {
  type TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { getDepositLimitForTransaction } from './pay-deposit-limit';

describe('getDepositLimitForTransaction', () => {
  it('returns the limit matching the transaction type', () => {
    expect(
      getDepositLimitForTransaction(
        {
          moneyAccountDeposit: 100000,
          perpsDeposit: 25000,
        },
        { type: TransactionType.perpsDeposit } as TransactionMeta,
      ),
    ).toBe(25000);
  });

  it('returns undefined when the transaction type has no limit', () => {
    expect(
      getDepositLimitForTransaction({ moneyAccountDeposit: 100000 }, {
        type: TransactionType.simpleSend,
      } as TransactionMeta),
    ).toBeUndefined();
  });

  it('returns undefined when the limits map is empty', () => {
    expect(
      getDepositLimitForTransaction({}, {
        type: TransactionType.moneyAccountDeposit,
      } as TransactionMeta),
    ).toBeUndefined();
  });
});
