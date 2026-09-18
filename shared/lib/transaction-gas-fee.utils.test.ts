import {
  type TransactionMeta,
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { isTransactionGasFeeSponsored } from './transaction-gas-fee.utils';

const BASE_TRANSACTION = {
  id: 'test-tx',
  chainId: '0x1',
  status: TransactionStatus.confirmed,
  time: Date.now(),
  txParams: {
    from: '0x1',
  },
  txReceipt: {
    gasUsed: '0x5208',
  },
  isGasFeeSponsored: true,
} as unknown as TransactionMeta;

function buildTransaction(
  overrides: Partial<TransactionMeta> = {},
): TransactionMeta {
  return {
    ...BASE_TRANSACTION,
    ...overrides,
  } as TransactionMeta;
}

describe('isTransactionGasFeeSponsored', () => {
  it('returns true for a confirmed transaction with the sponsored flag', () => {
    expect(
      isTransactionGasFeeSponsored({
        transaction: buildTransaction(),
      }),
    ).toBe(true);
  });

  it('returns false when the transaction is not flagged as sponsored', () => {
    expect(
      isTransactionGasFeeSponsored({
        transaction: buildTransaction({ isGasFeeSponsored: false }),
      }),
    ).toBe(false);
  });

  it('returns false for hardware wallet accounts', () => {
    expect(
      isTransactionGasFeeSponsored({
        transaction: buildTransaction(),
        isHardwareWalletAccount: true,
      }),
    ).toBe(false);
  });

  it('returns false for rejected transactions', () => {
    expect(
      isTransactionGasFeeSponsored({
        transaction: buildTransaction({
          status: TransactionStatus.rejected,
        }),
      }),
    ).toBe(false);
  });

  it('returns false for failed transactions without gas usage', () => {
    expect(
      isTransactionGasFeeSponsored({
        transaction: buildTransaction({
          status: TransactionStatus.failed,
          txReceipt: undefined,
        }),
      }),
    ).toBe(false);
  });

  it('returns true for failed transactions with gas usage', () => {
    expect(
      isTransactionGasFeeSponsored({
        transaction: buildTransaction({
          status: TransactionStatus.failed,
        }),
      }),
    ).toBe(true);
  });

  it('returns false for revoke delegation transactions', () => {
    expect(
      isTransactionGasFeeSponsored({
        transaction: buildTransaction({
          type: TransactionType.revokeDelegation,
        }),
      }),
    ).toBe(false);
  });
});
