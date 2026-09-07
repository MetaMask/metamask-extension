import {
  TransactionType,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import type { GetBalanceRequest } from '@metamask/transaction-pay-controller';
import { getBalance } from './get-balance-callback';
import {
  clearMaxSourceBalance,
  setMaxSourceBalance,
} from './max-source-balance';

function buildRequest(type: TransactionType): GetBalanceRequest {
  return {
    transaction: { id: 'tx-1', type } as TransactionMeta,
    transactionData: { tokens: [] },
  } as unknown as GetBalanceRequest;
}

describe('getBalance', () => {
  afterEach(() => {
    clearMaxSourceBalance('tx-1');
  });

  it('returns the recorded balance for a money-account deposit', () => {
    setMaxSourceBalance('tx-1', '5879662');

    expect(
      getBalance(buildRequest(TransactionType.moneyAccountDeposit)),
    ).toStrictEqual({ balanceRaw: '5879662' });
  });

  it('resolves the deposit type from nested transactions', () => {
    setMaxSourceBalance('tx-1', '5879662');
    const request = {
      transaction: {
        id: 'tx-1',
        type: TransactionType.batch,
        nestedTransactions: [
          { type: TransactionType.tokenMethodApprove },
          { type: TransactionType.moneyAccountDeposit },
        ],
      } as TransactionMeta,
      transactionData: { tokens: [] },
    } as unknown as GetBalanceRequest;

    expect(getBalance(request)).toStrictEqual({ balanceRaw: '5879662' });
  });

  it('returns undefined for a money-account withdraw', () => {
    setMaxSourceBalance('tx-1', '5879662');

    expect(
      getBalance(buildRequest(TransactionType.moneyAccountWithdraw)),
    ).toBeUndefined();
  });

  it('returns undefined for an unrelated transaction type', () => {
    setMaxSourceBalance('tx-1', '5879662');

    expect(
      getBalance(buildRequest(TransactionType.simpleSend)),
    ).toBeUndefined();
  });

  it('returns undefined for a deposit with no recorded balance', () => {
    expect(
      getBalance(buildRequest(TransactionType.moneyAccountDeposit)),
    ).toBeUndefined();
  });
});
