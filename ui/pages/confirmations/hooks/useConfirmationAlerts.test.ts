import { renderHookWithProvider } from '../../../../test/lib/render-helpers';
import mockState from '../../../../test/data/mock-state.json';
import useConfirmationAlerts from './useConfirmationAlerts';

describe('useConfirmationAlerts', () => {
  it('returns empty array if no alerts', () => {
    const { result } = renderHookWithProvider(useConfirmationAlerts, mockState);
    expect(result.current).toEqual([]);
  });
});
