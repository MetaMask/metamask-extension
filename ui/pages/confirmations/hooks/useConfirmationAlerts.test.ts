import { setBackgroundConnection } from '../../../store/background-connection';
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

// Mock async hooks used by useSpenderAlerts to prevent React Act warnings
jest.mock('../components/confirm/info/approve/hooks/use-is-nft', () => ({
  ...jest.requireActual('../components/confirm/info/approve/hooks/use-is-nft'),
  useIsNFT: () => ({ isNFT: false, pending: false }),
}));

jest.mock('../../../hooks/useAsync', () => ({
  ...jest.requireActual('../../../hooks/useAsync'),
  useAsyncResult: () => ({ value: null, pending: false, error: undefined }),
}));

jest.mock('./alerts/useSpenderAlerts', () => ({
  useSpenderAlerts: () => [],
}));

describe('useConfirmationAlerts', () => {
  const backgroundConnectionMock = new Proxy(
    {},
    {
      get: () => jest.fn().mockResolvedValue(undefined),
    },
  );

  beforeEach(() => {
    jest.resetAllMocks();
    setBackgroundConnection(backgroundConnectionMock as never);
  });

  it('returns empty array if no alerts', () => {
    const { result } = renderHookWithConfirmContextProvider(
      useConfirmationAlerts,
      mockState,
    );
    expect(result.current).toEqual([]);
  });
});
