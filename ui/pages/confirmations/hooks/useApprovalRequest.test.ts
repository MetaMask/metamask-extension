import { ApprovalType } from '@metamask/controller-utils';
import { renderHookWithConfirmContextProvider } from '../../../../test/lib/confirmations/render-helpers';
import {
  getMockTypedSignConfirmState,
  getMockPersonalSignConfirmState,
  getMockContractInteractionConfirmState,
} from '../../../../test/data/confirmations/helper';
import { unapprovedTypedSignMsgV4 } from '../../../../test/data/confirmations/typed_sign';
import { unapprovedPersonalSignMsg } from '../../../../test/data/confirmations/personal_sign';
import { useApprovalRequest } from './useApprovalRequest';

describe('useApprovalRequest', () => {
  it('returns approval request for typed sign confirmation', () => {
    const state = getMockTypedSignConfirmState();

    const { result } = renderHookWithConfirmContextProvider(
      () => useApprovalRequest(),
      state,
    );

    expect(result.current).toStrictEqual(
      expect.objectContaining({
        id: unapprovedTypedSignMsgV4.id,
        type: ApprovalType.EthSignTypedData,
      }),
    );
  });

  it('returns approval request for personal sign confirmation', () => {
    const state = getMockPersonalSignConfirmState();

    const { result } = renderHookWithConfirmContextProvider(
      () => useApprovalRequest(),
      state,
    );

    expect(result.current).toStrictEqual(
      expect.objectContaining({
        id: unapprovedPersonalSignMsg.id,
        type: ApprovalType.PersonalSign,
      }),
    );
  });

  it('returns approval request for transaction confirmation', () => {
    const state = getMockContractInteractionConfirmState();

    const { result } = renderHookWithConfirmContextProvider(
      () => useApprovalRequest(),
      state,
    );

    expect(result.current).toStrictEqual(
      expect.objectContaining({
        type: ApprovalType.Transaction,
      }),
    );
  });
});
