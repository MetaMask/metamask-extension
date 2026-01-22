import { TransactionType } from '@metamask/transaction-controller';
import { renderHookWithConfirmContextProvider } from '../../../../test/lib/confirmations/render-helpers';
import {
  getMockTypedSignConfirmState,
  getMockPersonalSignConfirmState,
  getMockContractInteractionConfirmState,
} from '../../../../test/data/confirmations/helper';
import { unapprovedTypedSignMsgV4 } from '../../../../test/data/confirmations/typed_sign';
import { unapprovedPersonalSignMsg } from '../../../../test/data/confirmations/personal_sign';
import { useSignatureRequest } from './useSignatureRequest';

describe('useSignatureRequest', () => {
  it('returns signature request for typed sign confirmation', () => {
    const state = getMockTypedSignConfirmState();

    const { result } = renderHookWithConfirmContextProvider(
      () => useSignatureRequest(),
      state,
    );

    expect(result.current).toStrictEqual(
      expect.objectContaining({
        id: unapprovedTypedSignMsgV4.id,
        type: TransactionType.signTypedData,
      }),
    );
  });

  it('returns signature request for personal sign confirmation', () => {
    const state = getMockPersonalSignConfirmState();

    const { result } = renderHookWithConfirmContextProvider(
      () => useSignatureRequest(),
      state,
    );

    expect(result.current).toStrictEqual(
      expect.objectContaining({
        id: unapprovedPersonalSignMsg.id,
        type: TransactionType.personalSign,
      }),
    );
  });

  it('returns undefined for transaction confirmation', () => {
    const state = getMockContractInteractionConfirmState();

    const { result } = renderHookWithConfirmContextProvider(
      () => useSignatureRequest(),
      state,
    );

    expect(result.current).toBeUndefined();
  });
});
