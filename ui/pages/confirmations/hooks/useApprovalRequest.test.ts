import { ApprovalType } from '@metamask/controller-utils';
import { renderHookWithProvider } from '../../../../test/lib/render-helpers-navigate';
import {
  getMockTypedSignConfirmState,
  getMockPersonalSignConfirmState,
  getMockContractInteractionConfirmState,
} from '../../../../test/data/confirmations/helper';
import { unapprovedTypedSignMsgV4 } from '../../../../test/data/confirmations/typed_sign';
import { unapprovedPersonalSignMsg } from '../../../../test/data/confirmations/personal_sign';
import { useApprovalRequest } from './useApprovalRequest';

const mockUseParams = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => mockUseParams(),
}));

describe('useApprovalRequest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns approval request for typed sign confirmation', () => {
    mockUseParams.mockReturnValue({ id: unapprovedTypedSignMsgV4.id });
    const state = getMockTypedSignConfirmState();

    const { result } = renderHookWithProvider(
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
    mockUseParams.mockReturnValue({ id: unapprovedPersonalSignMsg.id });
    const state = getMockPersonalSignConfirmState();

    const { result } = renderHookWithProvider(
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
    mockUseParams.mockReturnValue({});
    const state = getMockContractInteractionConfirmState();

    const { result } = renderHookWithProvider(
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
