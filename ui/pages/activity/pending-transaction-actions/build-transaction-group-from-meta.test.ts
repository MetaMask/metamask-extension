import {
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import type { TransactionMeta } from '@metamask/transaction-controller';
import {
  buildTransactionGroupFromMeta,
  deriveNonceGroupFlags,
} from './build-transaction-group-from-meta';

function createMeta(
  overrides: Partial<TransactionMeta> & { id: string },
): TransactionMeta {
  return {
    chainId: '0x1',
    networkClientId: 'mainnet',
    status: TransactionStatus.submitted,
    txParams: { nonce: '0x2' },
    ...overrides,
  } as TransactionMeta;
}

describe('deriveNonceGroupFlags', () => {
  it('sets hasCancelled when a cancel tx exists on the same nonce', () => {
    const primary = createMeta({ id: 'primary' });
    const cancel = createMeta({
      id: 'cancel',
      type: TransactionType.cancel,
      status: TransactionStatus.submitted,
    });

    expect(deriveNonceGroupFlags(primary, [primary, cancel])).toStrictEqual({
      hasCancelled: true,
      hasRetried: false,
    });
  });

  it('sets hasRetried when a retry tx exists on the same nonce', () => {
    const primary = createMeta({ id: 'primary' });
    const retry = createMeta({
      id: 'retry',
      type: TransactionType.retry,
      status: TransactionStatus.submitted,
    });

    expect(deriveNonceGroupFlags(primary, [primary, retry])).toStrictEqual({
      hasCancelled: false,
      hasRetried: true,
    });
  });
});

describe('buildTransactionGroupFromMeta', () => {
  it('builds a group with siblings on the same nonce and network', () => {
    const primary = createMeta({ id: 'primary' });
    const retry = createMeta({
      id: 'retry',
      type: TransactionType.retry,
      status: TransactionStatus.submitted,
    });

    const group = buildTransactionGroupFromMeta(primary, [primary, retry]);

    expect(group.transactions).toHaveLength(2);
    expect(group.hasRetried).toBe(true);
    expect(group.primaryTransaction.id).toBe('primary');
  });
});
