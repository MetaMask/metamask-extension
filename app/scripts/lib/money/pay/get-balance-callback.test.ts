import {
  TransactionType,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import type { GetBalanceRequest } from '@metamask/transaction-pay-controller';
import { getBalance } from './get-balance-callback';
import {
  resetMaxSourceBalancesForTests,
  setMaxSourceBalance,
} from './max-source-balance';

const maxSourceBalanceKey = {
  transactionId: 'tx-1',
  accountAddress: '0xaccount1',
  chainId: '0x1',
  tokenAddress: '0xtoken1',
};

function buildRequest(type: TransactionType): GetBalanceRequest {
  return {
    transaction: { id: 'tx-1', type } as TransactionMeta,
    transactionData: {
      accountOverride: maxSourceBalanceKey.accountAddress,
      paymentToken: {
        address: maxSourceBalanceKey.tokenAddress,
        chainId: maxSourceBalanceKey.chainId,
      },
      tokens: [],
    },
  } as unknown as GetBalanceRequest;
}

describe('getBalance', () => {
  afterEach(resetMaxSourceBalancesForTests);

  it('returns the recorded balance for a money-account deposit', () => {
    setMaxSourceBalance(maxSourceBalanceKey, '5879662');

    expect(
      getBalance(buildRequest(TransactionType.moneyAccountDeposit)),
    ).toStrictEqual({ balanceRaw: '5879662' });
  });

  it('resolves the deposit type from nested transactions', () => {
    setMaxSourceBalance(maxSourceBalanceKey, '5879662');
    const request = {
      transaction: {
        id: 'tx-1',
        type: TransactionType.batch,
        nestedTransactions: [
          { type: TransactionType.tokenMethodApprove },
          { type: TransactionType.moneyAccountDeposit },
        ],
      } as TransactionMeta,
      transactionData: buildRequest(TransactionType.moneyAccountDeposit)
        .transactionData,
    } as unknown as GetBalanceRequest;

    expect(getBalance(request)).toStrictEqual({ balanceRaw: '5879662' });
  });

  it('returns undefined for a money-account withdraw', () => {
    setMaxSourceBalance(maxSourceBalanceKey, '5879662');

    expect(
      getBalance(buildRequest(TransactionType.moneyAccountWithdraw)),
    ).toBeUndefined();
  });

  it('returns undefined for an unrelated transaction type', () => {
    setMaxSourceBalance(maxSourceBalanceKey, '5879662');

    expect(
      getBalance(buildRequest(TransactionType.simpleSend)),
    ).toBeUndefined();
  });

  it('returns undefined for a deposit with no recorded balance', () => {
    expect(
      getBalance(buildRequest(TransactionType.moneyAccountDeposit)),
    ).toBeUndefined();
  });

  it('returns undefined after the funding account changes', () => {
    setMaxSourceBalance(maxSourceBalanceKey, '5879662');
    const request = buildRequest(TransactionType.moneyAccountDeposit);
    request.transactionData.accountOverride = '0xaccount2';

    expect(getBalance(request)).toBeUndefined();
  });

  it('returns undefined after the pay token changes', () => {
    setMaxSourceBalance(maxSourceBalanceKey, '5879662');
    const request = buildRequest(TransactionType.moneyAccountDeposit);
    const { paymentToken } = request.transactionData;
    if (!paymentToken) {
      throw new Error('Expected request to include a payment token');
    }
    paymentToken.address = '0xtoken2';

    expect(getBalance(request)).toBeUndefined();
  });
});
