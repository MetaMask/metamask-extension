import mockState from '../../../../../test/data/mock-state.json';
import { renderHookWithProvider } from '../../../../../test/lib/render-helpers';
import { useAmountValidation } from './useAmountValidation';

describe('useAmountValidation', () => {
  it('return field for amount error', () => {
    const { result } = renderHookWithProvider(() => useAmountValidation(), {
      state: mockState,
    });
    expect(result.current).toEqual({ amountError: undefined });
  });
});
