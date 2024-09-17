import { TransactionMeta } from '@metamask/transaction-controller';
import {
  CONTRACT_INTERACTION_SENDER_ADDRESS,
  genUnapprovedContractInteractionConfirmation,
} from '../../../../../../../test/data/confirmations/contract-interaction';
import mockState from '../../../../../../../test/data/mock-state.json';
import { renderHookWithProvider } from '../../../../../../../test/lib/render-helpers';
import { useFourByte } from './useFourByte';

describe('useFourByte', () => {
  const depositHexData = '0xd0e30db0';

  it('returns the method name and params', () => {
    const currentConfirmation = genUnapprovedContractInteractionConfirmation({
      address: CONTRACT_INTERACTION_SENDER_ADDRESS,
      txData: depositHexData,
    }) as TransactionMeta;

    const { result } = renderHookWithProvider(
      () => useFourByte(currentConfirmation),
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

    expect(result.current.name).toEqual('Deposit');
    expect(result.current.params).toEqual([]);
  });

  it('returns empty object if resolution is turned off', () => {
    const currentConfirmation = genUnapprovedContractInteractionConfirmation({
      address: CONTRACT_INTERACTION_SENDER_ADDRESS,
      txData: depositHexData,
    }) as TransactionMeta;

    const { result } = renderHookWithProvider(
      () => useFourByte(currentConfirmation),
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

    expect(result.current).toEqual({});
  });

  it("returns undefined if it's not known even if resolution is enabled", () => {
    const currentConfirmation = genUnapprovedContractInteractionConfirmation({
      address: CONTRACT_INTERACTION_SENDER_ADDRESS,
      txData: depositHexData,
    }) as TransactionMeta;

    const { result } = renderHookWithProvider(
      () => useFourByte(currentConfirmation),
      {
        ...mockState,
        metamask: {
          ...mockState.metamask,
          use4ByteResolution: true,
          knownMethodData: {},
        },
      },
    );

    expect(result.current).toBeUndefined();
  });
});
