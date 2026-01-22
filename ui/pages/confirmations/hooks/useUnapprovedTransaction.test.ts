import { renderHookWithProvider } from '../../../../test/lib/render-helpers-navigate';
import {
  getMockTypedSignConfirmState,
  getMockContractInteractionConfirmState,
} from '../../../../test/data/confirmations/helper';
import { unapprovedTypedSignMsgV4 } from '../../../../test/data/confirmations/typed_sign';
import { useUnapprovedTransaction } from './useUnapprovedTransaction';

const mockUseParams = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => mockUseParams(),
}));

describe('useUnapprovedTransaction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns transaction for transaction confirmation', () => {
    mockUseParams.mockReturnValue({});
    const state = getMockContractInteractionConfirmState();

    const { result } = renderHookWithProvider(
      () => useUnapprovedTransaction(),
      state,
    );

    expect(result.current).toBeDefined();
    expect(result.current?.type).toBe('contractInteraction');
  });

  it('returns undefined for signature confirmation', () => {
    mockUseParams.mockReturnValue({ id: unapprovedTypedSignMsgV4.id });
    const state = getMockTypedSignConfirmState();

    const { result } = renderHookWithProvider(
      () => useUnapprovedTransaction(),
      state,
    );

    expect(result.current).toBeUndefined();
  });
});
