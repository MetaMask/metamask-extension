import { TransactionType } from '@metamask/transaction-controller';
import { renderHookWithProvider } from '../../../../test/lib/render-helpers-navigate';
import {
  getMockTypedSignConfirmState,
  getMockPersonalSignConfirmState,
  getMockContractInteractionConfirmState,
} from '../../../../test/data/confirmations/helper';
import { unapprovedTypedSignMsgV4 } from '../../../../test/data/confirmations/typed_sign';
import { unapprovedPersonalSignMsg } from '../../../../test/data/confirmations/personal_sign';
import { useSignatureRequest } from './useSignatureRequest';

const mockUseParams = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => mockUseParams(),
}));

describe('useSignatureRequest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns signature request for typed sign confirmation', () => {
    mockUseParams.mockReturnValue({ id: unapprovedTypedSignMsgV4.id });
    const state = getMockTypedSignConfirmState();

    const { result } = renderHookWithProvider(
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
    mockUseParams.mockReturnValue({ id: unapprovedPersonalSignMsg.id });
    const state = getMockPersonalSignConfirmState();

    const { result } = renderHookWithProvider(
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
    mockUseParams.mockReturnValue({});
    const state = getMockContractInteractionConfirmState();

    const { result } = renderHookWithProvider(
      () => useSignatureRequest(),
      state,
    );

    expect(result.current).toBeUndefined();
  });
});
