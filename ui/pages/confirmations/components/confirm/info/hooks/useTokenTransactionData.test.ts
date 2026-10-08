import { act } from '@testing-library/react';
import { Hex } from '@metamask/utils';
import { TransactionDescription } from '@ethersproject/abi';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../../test/data/confirmations/contract-interaction';
import { getMockConfirmStateForTransaction } from '../../../../../../../test/data/confirmations/helper';
import {
  genUnapprovedTokenTransferConfirmation,
  TRANSFER_FROM_TRANSACTION_DATA,
} from '../../../../../../../test/data/confirmations/token-transfer';
import { renderHookWithConfirmContextProvider } from '../../../../../../../test/lib/confirmations/render-helpers';
import { genUnapprovedApproveConfirmation } from '../../../../../../../test/data/confirmations/token-approve';
import {
  genUnapprovedSetApprovalForAllConfirmation,
  INCREASE_ALLOWANCE_TRANSACTION_DATA,
} from '../../../../../../../test/data/confirmations/set-approval-for-all';
import { useTokenTransactionData } from './useTokenTransactionData';

function runHook(transactionData: string) {
  const transaction = genUnapprovedContractInteractionConfirmation({
    txData: transactionData as Hex,
  });

  const state = getMockConfirmStateForTransaction(transaction);

  const { result } = renderHookWithConfirmContextProvider(
    useTokenTransactionData,
    state,
  );

  return result.current as TransactionDescription;
}

describe('useTokenTransactionData', () => {
  it('parses transfer transaction', () => {
    const transactionData =
      genUnapprovedTokenTransferConfirmation().txParams.data;

    const result = runHook(transactionData);

    expect(result.name).toBe('transfer');
    expect(result.args._to).toBe('0x2e0D7E8c45221FcA00d74a3609A0f7097035d09B');
    expect(result.args._value.toHexString()).toBe('0x01');
  });

  it('parses transferFrom transaction', () => {
    const result = runHook(TRANSFER_FROM_TRANSACTION_DATA);

    expect(result.name).toBe('transferFrom');
    expect(result.args._from).toBe(
      '0x2e0D7E8c45221FcA00d74a3609A0f7097035d09B',
    );
    expect(result.args._to).toBe('0x2e0d7E8c45221fCa00d74A3609A0F7097035D09c');
    expect(result.args._value.toHexString()).toEqual('0x0123');
  });

  it('parses approve transaction', () => {
    const transactionData = genUnapprovedApproveConfirmation().txParams.data;

    const result = runHook(transactionData);

    expect(result.name).toBe('approve');
    expect(result.args._spender).toBe(
      '0x2e0D7E8c45221FcA00d74a3609A0f7097035d09B',
    );
    expect(result.args._value.toHexString()).toBe('0x01');
  });

  it('parses setApprovalForAll transaction', () => {
    const transactionData =
      genUnapprovedSetApprovalForAllConfirmation().txParams.data;

    const result = runHook(transactionData);

    expect(result.name).toBe('setApprovalForAll');
    expect(result.args._operator).toBe(
      '0x2e0D7E8c45221FcA00d74a3609A0f7097035d09B',
    );
    expect(result.args._approved).toBe(true);
  });

  it('parses increaseAllowance transaction', () => {
    const result = runHook(INCREASE_ALLOWANCE_TRANSACTION_DATA);

    expect(result.name).toBe('increaseAllowance');
    expect(result.args.spender).toBe(
      '0x2e0D7E8c45221FcA00d74a3609A0f7097035d09B',
    );
    expect(result.args.increment.toHexString()).toBe('0x0123');
  });

  it('updates decoded values when calldata changes and prefers original calldata', () => {
    const transaction = genUnapprovedTokenTransferConfirmation();
    const { result, store, rerender } = renderHookWithConfirmContextProvider(
      useTokenTransactionData,
      getMockConfirmStateForTransaction(transaction),
    );
    const initialResult = result.current;
    rerender();
    expect(result.current).toBe(initialResult);

    const updatedTransaction = {
      ...transaction,
      txParams: {
        ...transaction.txParams,
        data: TRANSFER_FROM_TRANSACTION_DATA,
      },
    };
    act(() => {
      store.dispatch({
        type: 'UPDATE_METAMASK_STATE',
        value: { transactions: [updatedTransaction] },
      });
    });
    expect((result.current as TransactionDescription).name).toBe(
      'transferFrom',
    );
    expect(
      (result.current as TransactionDescription).args._value.toHexString(),
    ).toBe('0x0123');

    act(() => {
      store.dispatch({
        type: 'UPDATE_METAMASK_STATE',
        value: {
          transactions: [
            { ...updatedTransaction, txParamsOriginal: transaction.txParams },
          ],
        },
      });
    });
    expect((result.current as TransactionDescription).name).toBe('transfer');
    expect(
      (result.current as TransactionDescription).args._value.toHexString(),
    ).toBe('0x01');

    act(() => {
      store.dispatch({
        type: 'UPDATE_METAMASK_STATE',
        value: {
          transactions: [
            {
              ...transaction,
              txParams: { ...transaction.txParams, data: '0x' },
            },
          ],
        },
      });
    });
    expect(result.current).toBeUndefined();
  });

  it('returns undefined if no transaction data', () => {
    const result = runHook(undefined as never);
    expect(result).toBeUndefined();
  });
});
