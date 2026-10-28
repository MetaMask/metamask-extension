import {
  TransactionType,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import { getMoneyAccountFlow, MoneyAccountFlow } from './money-account-flow';

describe('getMoneyAccountFlow', () => {
  it('returns Deposit for a top-level deposit transaction', () => {
    expect(
      getMoneyAccountFlow({
        type: TransactionType.moneyAccountDeposit,
      } as TransactionMeta),
    ).toBe(MoneyAccountFlow.Deposit);
  });

  it('returns Withdraw for a top-level withdrawal transaction', () => {
    expect(
      getMoneyAccountFlow({
        type: TransactionType.moneyAccountWithdraw,
      } as TransactionMeta),
    ).toBe(MoneyAccountFlow.Withdraw);
  });

  it('returns Deposit when the deposit type is on a nested transaction', () => {
    expect(
      getMoneyAccountFlow({
        nestedTransactions: [
          { type: TransactionType.tokenMethodApprove },
          { type: TransactionType.moneyAccountDeposit },
        ],
      } as TransactionMeta),
    ).toBe(MoneyAccountFlow.Deposit);
  });

  it('returns Withdraw when the withdraw type is on a nested transaction', () => {
    expect(
      getMoneyAccountFlow({
        nestedTransactions: [
          { type: TransactionType.moneyAccountWithdraw },
          { type: TransactionType.tokenMethodTransfer },
        ],
      } as TransactionMeta),
    ).toBe(MoneyAccountFlow.Withdraw);
  });

  it('returns undefined for a transaction with neither type', () => {
    expect(
      getMoneyAccountFlow({
        type: TransactionType.simpleSend,
      } as TransactionMeta),
    ).toBeUndefined();
  });

  it('returns undefined when the transaction is undefined', () => {
    expect(getMoneyAccountFlow(undefined)).toBeUndefined();
  });
});
