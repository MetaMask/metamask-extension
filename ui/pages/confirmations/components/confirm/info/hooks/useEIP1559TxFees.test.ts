import { TransactionMeta } from '@metamask/transaction-controller';
import {
  CONTRACT_INTERACTION_SENDER_ADDRESS,
  genUnapprovedContractInteractionConfirmation,
} from '../../../../../../../test/data/confirmations/contract-interaction';
import mockState from '../../../../../../../test/data/mock-state.json';
import { renderHookWithProvider } from '../../../../../../../test/lib/render-helpers-navigate';
import { useEIP1559TxFees } from './useEIP1559TxFees';

describe('useEIP1559TxFees', () => {
  it('returns the correct estimate', () => {
    const transactionMeta = genUnapprovedContractInteractionConfirmation({
      address: CONTRACT_INTERACTION_SENDER_ADDRESS,
    }) as TransactionMeta;

    const { result } = renderHookWithProvider(
      () => useEIP1559TxFees(transactionMeta),
      mockState,
    );

    expect(result.current.maxFeePerGas).toMatchInlineSnapshot(`"2855600979"`);
    expect(result.current.maxPriorityFeePerGas).toMatchInlineSnapshot(
      `"1500000000"`,
    );
  });
});
