import { act, renderHook } from '@testing-library/react';
import {
  TransactionMeta,
  UserFeeLevel,
} from '@metamask/transaction-controller';

import { useAdvancedGasLimit } from './useAdvancedGasLimit';

const createTransactionMeta = (
  overrides: Partial<TransactionMeta> = {},
): TransactionMeta =>
  ({
    id: 'transaction-id',
    chainId: '0x1',
    networkClientId: 'mainnet',
    txParams: {
      from: '0x0000000000000000000000000000000000000001',
      to: '0x0000000000000000000000000000000000000002',
      data: '0x1234',
      gas: '0x7530',
    },
    ...overrides,
  }) as TransactionMeta;

describe('useAdvancedGasLimit', () => {
  it('uses the gas limit from the current transaction', () => {
    const transactionMeta = createTransactionMeta();
    const { result } = renderHook(() => useAdvancedGasLimit(transactionMeta));

    expect(result.current.gasLimit).toBe('0x7530');
    expect(result.current.isGasLimitAvailable).toBe(true);
    expect(result.current.isGasLimitEditable).toBe(true);
  });

  it('keeps a user-edited gas limit for the current transaction', () => {
    const transactionMeta = createTransactionMeta();
    const { result } = renderHook(() => useAdvancedGasLimit(transactionMeta));

    act(() => result.current.setGasLimit('0x9c40'));

    expect(result.current.gasLimit).toBe('0x9c40');
    expect(result.current.isGasLimitAvailable).toBe(true);
  });

  it('reports a missing estimate as unavailable', () => {
    const transactionMeta = createTransactionMeta({
      txParams: {
        from: '0x0000000000000000000000000000000000000001',
        to: '0x0000000000000000000000000000000000000002',
        data: '0x1234',
      },
    });
    const { result } = renderHook(() => useAdvancedGasLimit(transactionMeta));

    act(() => result.current.setGasLimit('0x9c40'));

    expect(result.current.gasLimit).toBeUndefined();
    expect(result.current.isGasLimitAvailable).toBe(false);
    expect(result.current.isGasLimitEditable).toBe(false);
  });

  it('allows manual gas limit editing after estimation fails', () => {
    const transactionMeta = createTransactionMeta({
      simulationFails: { debug: {}, reason: 'execution reverted' },
    });
    const { result } = renderHook(() => useAdvancedGasLimit(transactionMeta));

    expect(result.current.gasLimit).toBeUndefined();
    expect(result.current.isGasLimitAvailable).toBe(false);
    expect(result.current.isGasLimitEditable).toBe(true);

    act(() => result.current.setGasLimit('0x9c40'));

    expect(result.current.gasLimit).toBe('0x9c40');
    expect(result.current.isGasLimitAvailable).toBe(true);
  });

  it('uses custom gas despite a previous estimation failure', () => {
    const transactionMeta = createTransactionMeta({
      simulationFails: { debug: {}, reason: 'execution reverted' },
      userFeeLevel: UserFeeLevel.CUSTOM,
    });
    const { result } = renderHook(() => useAdvancedGasLimit(transactionMeta));

    expect(result.current.gasLimit).toBe('0x7530');
    expect(result.current.isGasLimitAvailable).toBe(true);
    expect(result.current.isGasLimitEditable).toBe(true);
  });

  it('does not reuse a failed estimate when the failure clears', () => {
    const transactionMeta = createTransactionMeta();
    const { result, rerender } = renderHook(
      ({ transaction }) => useAdvancedGasLimit(transaction),
      { initialProps: { transaction: transactionMeta } },
    );

    rerender({
      transaction: createTransactionMeta({
        simulationFails: { debug: {}, reason: 'execution reverted' },
      }),
    });
    rerender({ transaction: createTransactionMeta() });

    expect(result.current.gasLimit).toBeUndefined();
    expect(result.current.isGasLimitAvailable).toBe(false);
    expect(result.current.isGasLimitEditable).toBe(false);
  });

  it('keeps a user edit after a new estimate arrives', () => {
    const transactionMeta = createTransactionMeta({
      txParams: {
        from: '0x0000000000000000000000000000000000000001',
        to: '0x0000000000000000000000000000000000000002',
        data: '0x1234',
      },
    });
    const { result, rerender } = renderHook(
      ({ transaction }) => useAdvancedGasLimit(transaction),
      { initialProps: { transaction: transactionMeta } },
    );

    rerender({
      transaction: createTransactionMeta({
        txParams: {
          ...transactionMeta.txParams,
          gas: '0x9c40',
        },
      }),
    });
    act(() => result.current.setGasLimit('0xc350'));

    expect(result.current.gasLimit).toBe('0xc350');
    expect(result.current.isGasLimitAvailable).toBe(true);
  });

  it('invalidates an unchanged estimate when the transaction shape changes', () => {
    const transactionMeta = createTransactionMeta();
    const { result, rerender } = renderHook(
      ({ transaction }) => useAdvancedGasLimit(transaction),
      { initialProps: { transaction: transactionMeta } },
    );

    rerender({
      transaction: createTransactionMeta({
        txParams: {
          ...transactionMeta.txParams,
          data: '0x5678',
        },
      }),
    });

    act(() => result.current.setGasLimit('0xc350'));

    expect(result.current.gasLimit).toBeUndefined();
    expect(result.current.isGasLimitAvailable).toBe(false);
  });

  it('uses a repeated estimate after the stale value is cleared', () => {
    const transactionMeta = createTransactionMeta();
    const updatedTxParams = {
      ...transactionMeta.txParams,
      data: '0x5678',
    };
    const { result, rerender } = renderHook(
      ({ transaction }) => useAdvancedGasLimit(transaction),
      { initialProps: { transaction: transactionMeta } },
    );

    rerender({
      transaction: createTransactionMeta({ txParams: updatedTxParams }),
    });
    rerender({
      transaction: createTransactionMeta({
        txParams: { ...updatedTxParams, gas: undefined },
      }),
    });
    rerender({
      transaction: createTransactionMeta({ txParams: updatedTxParams }),
    });

    expect(result.current.gasLimit).toBe('0x7530');
    expect(result.current.isGasLimitAvailable).toBe(true);
  });

  it('uses a new estimate after the transaction shape changes', () => {
    const transactionMeta = createTransactionMeta();
    const { result, rerender } = renderHook(
      ({ transaction }) => useAdvancedGasLimit(transaction),
      { initialProps: { transaction: transactionMeta } },
    );

    rerender({
      transaction: createTransactionMeta({
        txParams: {
          ...transactionMeta.txParams,
          data: '0x5678',
          gas: '0x9c40',
        },
      }),
    });

    expect(result.current.gasLimit).toBe('0x9c40');
    expect(result.current.isGasLimitAvailable).toBe(true);
  });

  it('invalidates an unchanged estimate when the network client changes', () => {
    const transactionMeta = createTransactionMeta();
    const { result, rerender } = renderHook(
      ({ transaction }) => useAdvancedGasLimit(transaction),
      { initialProps: { transaction: transactionMeta } },
    );

    rerender({
      transaction: createTransactionMeta({
        networkClientId: 'alternate-mainnet-client',
      }),
    });

    expect(result.current.gasLimit).toBeUndefined();
    expect(result.current.isGasLimitAvailable).toBe(false);
  });
});
