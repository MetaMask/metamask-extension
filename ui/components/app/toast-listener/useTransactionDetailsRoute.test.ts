import { renderHook } from '@testing-library/react';
import {
  TransactionStatus,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import { useTransactionDetailsRoute } from './useTransactionDetailsRoute';

let mockTransactions: TransactionMeta[] = [];

jest.mock('react-redux', () => ({
  useSelector: (selector: (state: unknown) => unknown) =>
    selector({ metamask: { transactions: mockTransactions } }),
}));

function createTransactionMeta(
  overrides: Partial<TransactionMeta> & Pick<TransactionMeta, 'id'>,
): TransactionMeta {
  return {
    chainId: '0x1',
    networkClientId: 'network-1',
    status: TransactionStatus.submitted,
    time: 1,
    txParams: { from: '0x0' },
    ...overrides,
  };
}

describe('useTransactionDetailsRoute', () => {
  beforeEach(() => {
    mockTransactions = [];
  });

  it('returns the details route for a transaction with a hash', () => {
    mockTransactions = [createTransactionMeta({ id: 'tx-1', hash: '0xabc' })];

    const { result } = renderHook(() => useTransactionDetailsRoute('tx-1'));

    expect(result.current).toBe('/tx/eip155:1/0xabc');
  });

  it('returns undefined before the transaction has a hash', () => {
    mockTransactions = [
      createTransactionMeta({ id: 'tx-1', status: TransactionStatus.approved }),
    ];

    const { result } = renderHook(() => useTransactionDetailsRoute('tx-1'));

    expect(result.current).toBeUndefined();
  });

  it('returns undefined when the transaction is not in state', () => {
    const { result } = renderHook(() => useTransactionDetailsRoute('tx-1'));

    expect(result.current).toBeUndefined();
  });

  it('returns undefined when no transaction id is given', () => {
    mockTransactions = [createTransactionMeta({ id: 'tx-1', hash: '0xabc' })];

    const { result } = renderHook(() => useTransactionDetailsRoute());

    expect(result.current).toBeUndefined();
  });
});
