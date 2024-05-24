import { renderHookWithProvider } from '../../../../test/lib/render-helpers';
import mockState from '../../../../test/data/mock-state.json';
import useConfirmationAlertActions from './useConfirmationAlertActions';

describe('useConfirmationAlertActions', () => {
  it('returns a function', () => {
    const { result } = renderHookWithProvider(
      () => useConfirmationAlertActions(),
      { ...mockState },
    );
    expect(typeof result.current).toBe('function');
  });
});
