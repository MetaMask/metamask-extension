import { TransactionMeta } from '@metamask/transaction-controller';
import {
  CONTRACT_INTERACTION_SENDER_ADDRESS,
  genUnapprovedContractInteractionConfirmation,
} from '../../../../../../../test/data/confirmations/contract-interaction';
import mockState from '../../../../../../../test/data/mock-state.json';
import { renderHookWithProvider } from '../../../../../../../test/lib/render-helpers';
import { useKnownMethodDataInTransaction } from './known-method-data-in-transaction';

describe('useKnownMethodDataInTransaction', () => {
  const depositHexData = '0xd0e30db0';

  it('returns the method name and params', () => {
    const currentConfirmation = genUnapprovedContractInteractionConfirmation({
      address: CONTRACT_INTERACTION_SENDER_ADDRESS,
      txData: depositHexData,
    }) as TransactionMeta;

    const { result } = renderHookWithProvider(
      () => useKnownMethodDataInTransaction(currentConfirmation),
      {
        ...mockState,
        metamask: {
          ...mockState.metamask,
          use4ByteResolution: true,
          knownMethodData: {
            [depositHexData]: { name: 'Deposit', params: [] },
          },
        },
      },
    );

    expect(result.current.knownMethodData.name).toEqual('Deposit');
    expect(result.current.knownMethodData.params).toEqual([]);
  });

  it('returns no known method data if resolution is turned off', () => {
    const currentConfirmation = genUnapprovedContractInteractionConfirmation({
      address: CONTRACT_INTERACTION_SENDER_ADDRESS,
      txData: depositHexData,
    }) as TransactionMeta;

    const { result } = renderHookWithProvider(
      () => useKnownMethodDataInTransaction(currentConfirmation),
      {
        ...mockState,
        metamask: {
          ...mockState.metamask,
          use4ByteResolution: false,
          knownMethodData: {
            [depositHexData]: { name: 'Deposit', params: [] },
          },
        },
      },
    );

    expect(result.current.knownMethodData).toEqual({});
  });

  it("returns no method data if it's not known even if resolution is enabled", () => {
    const currentConfirmation = genUnapprovedContractInteractionConfirmation({
      address: CONTRACT_INTERACTION_SENDER_ADDRESS,
      txData: depositHexData,
    }) as TransactionMeta;

    const { result } = renderHookWithProvider(
      () => useKnownMethodDataInTransaction(currentConfirmation),
      {
        ...mockState,
        metamask: {
          ...mockState.metamask,
          use4ByteResolution: true,
          knownMethodData: {},
        },
      },
    );

    expect(result.current.knownMethodData).toEqual({});
  });
});
