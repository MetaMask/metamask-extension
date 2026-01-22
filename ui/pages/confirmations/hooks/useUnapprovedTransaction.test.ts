import { renderHookWithConfirmContextProvider } from '../../../../test/lib/confirmations/render-helpers';
import {
  getMockTypedSignConfirmState,
  getMockContractInteractionConfirmState,
} from '../../../../test/data/confirmations/helper';
import { useUnapprovedTransaction } from './useUnapprovedTransaction';

describe('useUnapprovedTransaction', () => {
  it('returns transaction for transaction confirmation', () => {
    const state = getMockContractInteractionConfirmState();

    const { result } = renderHookWithConfirmContextProvider(
      () => useUnapprovedTransaction(),
      state,
    );

    expect(result.current).toBeDefined();
    expect(result.current?.type).toBe('contractInteraction');
  });

  it('returns undefined for signature confirmation', () => {
    const state = getMockTypedSignConfirmState();

    const { result } = renderHookWithConfirmContextProvider(
      () => useUnapprovedTransaction(),
      state,
    );

    expect(result.current).toBeUndefined();
  });
});
