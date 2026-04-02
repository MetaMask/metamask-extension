import { renderHook, act } from '@testing-library/react-hooks';
import { TransactionStatus } from '@metamask/transaction-controller';
import { useTransactionLifecycle } from './useTransactionLifecycle';

type Tx = { id: string; status: string };

const pending = (id: string): Tx => ({
  id,
  status: TransactionStatus.submitted,
});
const approved = (id: string): Tx => ({
  id,
  status: TransactionStatus.approved,
});
const confirmed = (id: string): Tx => ({
  id,
  status: TransactionStatus.confirmed,
});
const failed = (id: string): Tx => ({ id, status: TransactionStatus.failed });

describe('useTransactionLifecycle', () => {
  it('takes a snapshot on the first render and fires no handlers', () => {
    const onPending = jest.fn();
    renderHook(() => useTransactionLifecycle([pending('1')], { onPending }));
    expect(onPending).not.toHaveBeenCalled();
  });

  it('fires onPending when a new tx appears already in pending state', () => {
    const onPending = jest.fn();
    const { rerender } = renderHook(
      ({ txs }) => useTransactionLifecycle(txs, { onPending }),
      { initialProps: { txs: [] as Tx[] } },
    );

    act(() => {
      rerender({ txs: [pending('1')] });
    });

    expect(onPending).toHaveBeenCalledTimes(1);
    expect(onPending).toHaveBeenCalledWith(pending('1'));
  });

  it('fires onPending when a known tx transitions into pending (unapproved → submitted)', () => {
    const onPending = jest.fn();
    const { rerender } = renderHook(
      ({ txs }) => useTransactionLifecycle(txs, { onPending }),
      { initialProps: { txs: [approved('1')] } },
    );

    act(() => {
      rerender({ txs: [pending('1')] });
    });

    expect(onPending).toHaveBeenCalledTimes(1);
    expect(onPending).toHaveBeenCalledWith(pending('1'));
  });

  it('fires onSuccess when a pending tx is confirmed', () => {
    const onSuccess = jest.fn();
    const { rerender } = renderHook(
      ({ txs }) => useTransactionLifecycle(txs, { onSuccess }),
      { initialProps: { txs: [pending('1')] } },
    );

    act(() => {
      rerender({ txs: [confirmed('1')] });
    });

    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onSuccess).toHaveBeenCalledWith(confirmed('1'));
  });

  it('fires onFailure when a pending tx fails', () => {
    const onFailure = jest.fn();
    const { rerender } = renderHook(
      ({ txs }) => useTransactionLifecycle(txs, { onFailure }),
      { initialProps: { txs: [pending('1')] } },
    );

    act(() => {
      rerender({ txs: [failed('1')] });
    });

    expect(onFailure).toHaveBeenCalledTimes(1);
    expect(onFailure).toHaveBeenCalledWith(failed('1'));
  });

  it('does not fire onPending again when a tx stays pending', () => {
    const onPending = jest.fn();
    const { rerender } = renderHook(
      ({ txs }) => useTransactionLifecycle(txs, { onPending }),
      { initialProps: { txs: [pending('1')] } },
    );

    act(() => {
      rerender({ txs: [pending('1')] });
    });

    expect(onPending).not.toHaveBeenCalled();
  });

  it('does not fire handlers for a tx that was already confirmed in the first snapshot', () => {
    const onSuccess = jest.fn();
    const { rerender } = renderHook(
      ({ txs }) => useTransactionLifecycle(txs, { onSuccess }),
      { initialProps: { txs: [confirmed('1')] } },
    );

    act(() => {
      rerender({ txs: [confirmed('1')] });
    });

    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('handles multiple transactions independently', () => {
    const onPending = jest.fn();
    const onSuccess = jest.fn();
    const { rerender } = renderHook(
      ({ txs }) => useTransactionLifecycle(txs, { onPending, onSuccess }),
      { initialProps: { txs: [pending('1'), approved('2')] } },
    );

    act(() => {
      rerender({ txs: [confirmed('1'), pending('2')] });
    });

    expect(onSuccess).toHaveBeenCalledWith(confirmed('1'));
    expect(onPending).toHaveBeenCalledWith(pending('2'));
  });
});
