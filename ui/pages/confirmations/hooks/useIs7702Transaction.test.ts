import { renderHook } from '@testing-library/react-hooks';
import type { TransactionMeta } from '@metamask/transaction-controller';
import { TransactionType } from '@metamask/transaction-controller';
import { useIs7702Transaction } from './useIs7702Transaction';

describe('useIs7702Transaction', () => {
  it('returns false for undefined transaction', () => {
    const { result } = renderHook(() => useIs7702Transaction(undefined));
    expect(result.current).toBe(false);
  });

  it('returns true for transaction with type batch', () => {
    const tx = {
      id: 'tx-1',
      type: TransactionType.batch,
      txParams: {},
    } as TransactionMeta;
    const { result } = renderHook(() => useIs7702Transaction(tx));
    expect(result.current).toBe(true);
  });

  it('returns true for transaction with type revokeDelegation', () => {
    const tx = {
      id: 'tx-2',
      type: TransactionType.revokeDelegation,
      txParams: {},
    } as TransactionMeta;
    const { result } = renderHook(() => useIs7702Transaction(tx));
    expect(result.current).toBe(true);
  });

  it('returns true when authorizationList is non-empty array', () => {
    const tx = {
      id: 'tx-3',
      type: TransactionType.simpleSend,
      txParams: {
        authorizationList: [{ address: '0x123', code: '0x' }],
      },
    } as unknown as TransactionMeta;
    const { result } = renderHook(() => useIs7702Transaction(tx));
    expect(result.current).toBe(true);
  });

  it('returns false when authorizationList is empty array', () => {
    const tx = {
      id: 'tx-4',
      type: TransactionType.simpleSend,
      txParams: { authorizationList: [] },
    } as unknown as TransactionMeta;
    const { result } = renderHook(() => useIs7702Transaction(tx));
    expect(result.current).toBe(false);
  });

  it('returns true when delegationAddress is set', () => {
    const tx = {
      id: 'tx-5',
      type: TransactionType.simpleSend,
      txParams: {},
      delegationAddress: '0xabc',
    } as unknown as TransactionMeta;
    const { result } = renderHook(() => useIs7702Transaction(tx));
    expect(result.current).toBe(true);
  });

  it('returns false for normal simpleSend without 7702 fields', () => {
    const tx = {
      id: 'tx-6',
      type: TransactionType.simpleSend,
      txParams: { from: '0x', to: '0x', value: '0x0' },
    } as TransactionMeta;
    const { result } = renderHook(() => useIs7702Transaction(tx));
    expect(result.current).toBe(false);
  });
});
