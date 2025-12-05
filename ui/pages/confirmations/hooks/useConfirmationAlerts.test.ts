import { renderHookWithConfirmContextProvider } from '../../../../test/lib/confirmations/render-helpers';
import mockState from '../../../../test/data/mock-state.json';
import useConfirmationAlerts from './useConfirmationAlerts';

const mockUseNavigate = jest.fn();
jest.mock('react-router-dom', () => {
  return {
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockUseNavigate,
  };
});

describe('useConfirmationAlerts', () => {
  it('returns empty array if no alerts', () => {
    const { result } = renderHookWithConfirmContextProvider(
      useConfirmationAlerts,
      mockState,
    );
    expect(result.current).toEqual([]);
  });
});
