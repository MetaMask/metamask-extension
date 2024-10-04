import { TransactionMeta } from '@metamask/transaction-controller';
import { CONTRACT_INTERACTION_SENDER_ADDRESS } from '../../../../../../../test/data/confirmations/contract-interaction';
import { genUnapprovedApproveConfirmation } from '../../../../../../../test/data/confirmations/token-approve';
import mockState from '../../../../../../../test/data/mock-state.json';
import { renderHookWithConfirmContextProvider } from '../../../../../../../test/lib/confirmations/render-helpers';
import { useCurrentSpendingCap } from './useCurrentSpendingCap';

describe('useCurrentSpendingCap', () => {
  it('returns the correct spending cap', () => {
    const transactionMeta = genUnapprovedApproveConfirmation({
      address: CONTRACT_INTERACTION_SENDER_ADDRESS,
    }) as TransactionMeta;

    const { result } = renderHookWithConfirmContextProvider(
      () => useCurrentSpendingCap(transactionMeta),
      mockState,
    );

    expect(result.current.customSpendingCap).toMatchInlineSnapshot(`"#0"`);
  });
});
