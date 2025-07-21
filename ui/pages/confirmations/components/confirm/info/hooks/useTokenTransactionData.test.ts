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

  it('returns undefined if no transaction data', () => {
    const result = runHook(undefined as never);
    expect(result).toBeUndefined();
  });
});
