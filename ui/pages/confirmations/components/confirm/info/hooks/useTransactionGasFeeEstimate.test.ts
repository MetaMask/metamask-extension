import { TransactionMeta } from '@metamask/transaction-controller';
import {
  CONTRACT_INTERACTION_SENDER_ADDRESS,
  genUnapprovedContractInteractionConfirmation,
} from '../../../../../../../test/data/confirmations/contract-interaction';
import mockState from '../../../../../../../test/data/mock-state.json';
import { renderHookWithProvider } from '../../../../../../../test/lib/render-helpers';
import { useTransactionGasFeeEstimate } from './useTransactionGasFeeEstimate';

describe('getGasFeeEstimate', () => {
  it('returns the correct estimate when EIP1559 is supported', () => {
    const transactionMeta = genUnapprovedContractInteractionConfirmation({
      address: CONTRACT_INTERACTION_SENDER_ADDRESS,
    }) as TransactionMeta;
    const supportsEIP1559 = true;

    const { result } = renderHookWithProvider(
      () => useTransactionGasFeeEstimate(transactionMeta, supportsEIP1559),
      mockState,
    );

    expect(result.current).toMatchInlineSnapshot(`"3be226d2d900"`);
  });

  it('returns the correct estimate when EIP1559 is not supported', () => {
    const transactionMeta = genUnapprovedContractInteractionConfirmation({
      address: CONTRACT_INTERACTION_SENDER_ADDRESS,
    }) as TransactionMeta;
    const supportsEIP1559 = false;

    const { result } = renderHookWithProvider(
      () => useTransactionGasFeeEstimate(transactionMeta, supportsEIP1559),
      mockState,
    );

    expect(result.current).toMatchInlineSnapshot(`"0"`);
  });
});
