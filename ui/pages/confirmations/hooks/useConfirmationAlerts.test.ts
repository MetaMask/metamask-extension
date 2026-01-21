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

// Mock async hooks to prevent React Act warnings from async state updates
jest.mock('../components/confirm/info/approve/hooks/use-is-nft', () => ({
  useIsNFT: () => ({ isNFT: false, pending: false }),
}));

jest.mock('../../../hooks/useAsync', () => ({
  useAsyncResult: () => ({ value: null, pending: false, error: undefined }),
}));

describe('useConfirmationAlerts', () => {
  it('returns empty array if no alerts', () => {
    const { result } = renderHookWithConfirmContextProvider(
      useConfirmationAlerts,
      mockState,
    );
    expect(result.current).toEqual([]);
  });
});
