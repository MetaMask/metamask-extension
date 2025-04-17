import { createBridgeMockStore } from '../../../../test/data/bridge/mock-bridge-store';
import { renderHookWithProvider } from '../../../../test/lib/render-helpers';
import { useIsMultichainSwap } from './useIsMultichainSwap';

jest.mock('../../../selectors/multichain', () => ({
  ...jest.requireActual('../../../selectors/multichain'),
  getMultichainIsSolana: jest.fn(),
}));

const mockHistoryReplace = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: () => ({
    replace: mockHistoryReplace,
  }),
}));

const renderUseIsMultichainSwap = (
  initialPath: string,
  mockStoreOverrides = {},
) => {
  return renderHookWithProvider(
    () => useIsMultichainSwap(),
    createBridgeMockStore(mockStoreOverrides),
    initialPath,
  );
};

describe('useIsMultichainSwap', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns true when swaps=true in URL and chain is Solana', () => {
    jest
      .requireMock('../../../selectors/multichain')
      .getMultichainIsSolana.mockReturnValue(true);

    const { result } = renderUseIsMultichainSwap('/bridge?swaps=true');
    expect(result.current).toBe(true);
  });

  it('returns false when swaps=true but chain is not Solana', () => {
    jest
      .requireMock('../../../selectors/multichain')
      .getMultichainIsSolana.mockReturnValue(false);

    const { result } = renderUseIsMultichainSwap('/bridge?swaps=true');
    expect(result.current).toBe(false);
  });

  it('returns false when chain is Solana but swaps param is not set', () => {
    jest
      .requireMock('../../../selectors/multichain')
      .getMultichainIsSolana.mockReturnValue(true);

    const { result } = renderUseIsMultichainSwap('/bridge');
    expect(result.current).toBe(false);
  });

  it('adds swaps=true to URL when quote is a Solana swap', async () => {
    jest
      .requireMock('../../../selectors/multichain')
      .getMultichainIsSolana.mockReturnValue(true);

    const { result } = renderUseIsMultichainSwap('/bridge', {
      bridgeStateOverrides: {
        quoteRequest: {
          srcChainId: 'solana:4sGjMW1sUnHzSxGspuhpqLDx6wiyjNtZ',
          destChainId: 'solana:4sGjMW1sUnHzSxGspuhpqLDx6wiyjNtZ',
        },
      },
    });

    expect(result.current).toBe(false);
    // Check if URL was updated
    expect(mockHistoryReplace).toHaveBeenCalledWith({
      pathname: '/bridge',
      search: 'swaps=true',
    });
  });

  it('does not modify URL when not a Solana swap', () => {
    jest
      .requireMock('../../../selectors/multichain')
      .getMultichainIsSolana.mockReturnValue(false);

    const { result } = renderUseIsMultichainSwap('/bridge', {
      bridgeStateOverrides: {
        quoteRequest: {
          srcChainId: '0x1',
          destChainId: '0x1',
        },
      },
    });

    expect(result.current).toBe(false);
    expect(window.location.search).not.toContain('swaps=true');
  });

  it('preserves existing query parameters when adding swaps=true', () => {
    jest
      .requireMock('../../../selectors/multichain')
      .getMultichainIsSolana.mockReturnValue(true);

    const { result } = renderUseIsMultichainSwap('/bridge?existing=param', {
      bridgeStateOverrides: {
        quoteRequest: {
          srcChainId: 'solana:4sGjMW1sUnHzSxGspuhpqLDx6wiyjNtZ',
          destChainId: 'solana:4sGjMW1sUnHzSxGspuhpqLDx6wiyjNtZ',
        },
      },
    });

    expect(result.current).toBe(false);
    expect(mockHistoryReplace).toHaveBeenCalledWith({
      pathname: '/bridge',
      search: 'existing=param&swaps=true',
    });
  });

  it('returns true when there are other query params and swaps=true is added', () => {
    jest
      .requireMock('../../../selectors/multichain')
      .getMultichainIsSolana.mockReturnValue(true);

    const { result } = renderUseIsMultichainSwap(
      '/bridge?existing=param&swaps=true',
      {
        bridgeStateOverrides: {
          quoteRequest: {
            srcChainId: 'solana:4sGjMW1sUnHzSxGspuhpqLDx6wiyjNtZ',
            destChainId: 'solana:4sGjMW1sUnHzSxGspuhpqLDx6wiyjNtZ',
          },
        },
      },
    );

    expect(result.current).toBe(true);
    expect(mockHistoryReplace).not.toHaveBeenCalled();
  });
});
