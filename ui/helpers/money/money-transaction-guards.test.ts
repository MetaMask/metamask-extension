import {
  TransactionType,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import { MUSD_TOKEN_ADDRESS } from '@metamask/money-account-utils';
import { CHAIN_IDS } from '../../../shared/constants/network';
import {
  isMoneyAccountTx,
  isMoneyDepositTx,
  isMoneyWithdrawTx,
  isPerpsPredictMoneyActivity,
  isPerpsPredictMoneyDeposit,
  isPerpsPredictMoneyWithdraw,
  nestedTxWithType,
} from './money-transaction-guards';

const makeTx = (
  overrides: Partial<TransactionMeta> = {},
): TransactionMeta =>
  ({
    id: 'tx-1',
    time: 0,
    txParams: {},
    ...overrides,
  }) as unknown as TransactionMeta;

const MUSD_ON_MONAD = {
  tokenAddress: MUSD_TOKEN_ADDRESS,
  chainId: CHAIN_IDS.MONAD,
};

describe('nestedTxWithType', () => {
  it('finds the first nested transaction of the given type', () => {
    const nested = { type: TransactionType.moneyAccountDeposit };
    const tx = makeTx({
      nestedTransactions: [
        { type: TransactionType.tokenMethodApprove },
        nested,
      ] as TransactionMeta['nestedTransactions'],
    });

    expect(nestedTxWithType(tx, TransactionType.moneyAccountDeposit)).toBe(
      nested,
    );
  });

  it('returns undefined when no nested transactions exist', () => {
    expect(
      nestedTxWithType(makeTx(), TransactionType.moneyAccountDeposit),
    ).toBeUndefined();
  });
});

describe('isMoneyDepositTx / isMoneyWithdrawTx / isMoneyAccountTx', () => {
  it('matches a top-level deposit', () => {
    const tx = makeTx({ type: TransactionType.moneyAccountDeposit });
    expect(isMoneyDepositTx(tx)).toBe(true);
    expect(isMoneyWithdrawTx(tx)).toBe(false);
    expect(isMoneyAccountTx(tx)).toBe(true);
  });

  it('matches a nested withdraw inside a batch', () => {
    const tx = makeTx({
      type: TransactionType.batch,
      nestedTransactions: [
        { type: TransactionType.moneyAccountWithdraw },
      ] as TransactionMeta['nestedTransactions'],
    });
    expect(isMoneyWithdrawTx(tx)).toBe(true);
    expect(isMoneyDepositTx(tx)).toBe(false);
    expect(isMoneyAccountTx(tx)).toBe(true);
  });

  it('rejects unrelated transactions', () => {
    const tx = makeTx({ type: TransactionType.contractInteraction });
    expect(isMoneyAccountTx(tx)).toBe(false);
  });
});

describe('Perps/Predict money activity guards', () => {
  it('matches a Perps deposit paid with mUSD on the money chain', () => {
    const tx = makeTx({
      type: TransactionType.perpsDeposit,
      metamaskPay: MUSD_ON_MONAD,
    });
    expect(isPerpsPredictMoneyDeposit(tx)).toBe(true);
    expect(isPerpsPredictMoneyWithdraw(tx)).toBe(false);
    expect(isPerpsPredictMoneyActivity(tx)).toBe(true);
  });

  it('matches a nested Predict withdraw landing as mUSD on the money chain', () => {
    const tx = makeTx({
      type: TransactionType.batch,
      nestedTransactions: [
        { type: TransactionType.predictWithdraw },
      ] as TransactionMeta['nestedTransactions'],
      metamaskPay: MUSD_ON_MONAD,
    });
    expect(isPerpsPredictMoneyWithdraw(tx)).toBe(true);
    expect(isPerpsPredictMoneyDeposit(tx)).toBe(false);
    expect(isPerpsPredictMoneyActivity(tx)).toBe(true);
  });

  it('rejects a Perps deposit paid with a non-mUSD token', () => {
    const tx = makeTx({
      type: TransactionType.perpsDeposit,
      metamaskPay: {
        tokenAddress: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
        chainId: CHAIN_IDS.ARBITRUM,
      },
    });
    expect(isPerpsPredictMoneyActivity(tx)).toBe(false);
  });

  it('rejects a Perps deposit with no pay metadata', () => {
    const tx = makeTx({ type: TransactionType.perpsDeposit });
    expect(isPerpsPredictMoneyActivity(tx)).toBe(false);
  });
});
