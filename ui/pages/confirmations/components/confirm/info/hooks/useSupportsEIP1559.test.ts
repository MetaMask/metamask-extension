import {
  TransactionEnvelopeType,
  TransactionMeta,
} from '@metamask/transaction-controller';
import {
  CONTRACT_INTERACTION_SENDER_ADDRESS,
  genUnapprovedContractInteractionConfirmation,
} from '../../../../../../../test/data/confirmations/contract-interaction';
import mockState from '../../../../../../../test/data/mock-state.json';
import { renderHookWithProvider } from '../../../../../../../test/lib/render-helpers';
import { useSupportsEIP1559 } from './useSupportsEIP1559';

describe('useSupportsEIP1559', () => {
  it('returns correctly for type 2 tx', () => {
    const transactionMeta = genUnapprovedContractInteractionConfirmation({
      address: CONTRACT_INTERACTION_SENDER_ADDRESS,
    }) as TransactionMeta;

    transactionMeta.txParams.type = TransactionEnvelopeType.feeMarket;

    const { result } = renderHookWithProvider(
      () => useSupportsEIP1559(transactionMeta),
      mockState,
    );

    expect(result.current.supportsEIP1559).toMatchInlineSnapshot(`true`);
  });

  it('returns correctly for type 0 tx', () => {
    const transactionMeta = genUnapprovedContractInteractionConfirmation({
      address: CONTRACT_INTERACTION_SENDER_ADDRESS,
    }) as TransactionMeta;

    transactionMeta.txParams.type = TransactionEnvelopeType.legacy;

    const { result } = renderHookWithProvider(
      () => useSupportsEIP1559(transactionMeta),
      mockState,
    );

    expect(result.current.supportsEIP1559).toMatchInlineSnapshot(`false`);
  });
});
