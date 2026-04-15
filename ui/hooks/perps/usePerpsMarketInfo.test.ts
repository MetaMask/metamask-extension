import { renderHook, act } from '@testing-library/react-hooks';
import type { MarketInfo } from '@metamask/perps-controller';
import { usePerpsMarketInfo } from './usePerpsMarketInfo';

const mockSubmitRequestToBackground = jest.fn();
jest.mock('../../store/background-connection', () => ({
  submitRequestToBackground: (...args: unknown[]) =>
    mockSubmitRequestToBackground(...args),
}));

function makeMarketInfo(overrides: Partial<MarketInfo> = {}): MarketInfo {
  return {
    name: 'BTC',
    szDecimals: 5,
    maxLeverage: 50,
    marginTableId: 0,
    ...overrides,
  } as MarketInfo;
}

describe('usePerpsMarketInfo', () => {
  beforeEach(() => {
    mockSubmitRequestToBackground.mockReset();
  });

  it('returns undefined before the fetch resolves', () => {
    mockSubmitRequestToBackground.mockReturnValue(new Promise(() => undefined));
    const { result } = renderHook(() => usePerpsMarketInfo('BTC'));
    expect(result.current).toBeUndefined();
  });

  it('returns the matching market after the fetch resolves', async () => {
    const markets = [
      makeMarketInfo({ name: 'BTC' }),
      makeMarketInfo({ name: 'ETH', szDecimals: 4 }),
    ];
    mockSubmitRequestToBackground.mockResolvedValue(markets);

    const { result, waitForNextUpdate } = renderHook(() =>
      usePerpsMarketInfo('BTC'),
    );

    await waitForNextUpdate();

    expect(result.current).toBeDefined();
    expect(result.current?.name).toBe('BTC');
    expect(result.current?.szDecimals).toBe(5);
  });

  it('matches symbol case-insensitively', async () => {
    const markets = [makeMarketInfo({ name: 'HYPE' })];
    mockSubmitRequestToBackground.mockResolvedValue(markets);

    const { result, waitForNextUpdate } = renderHook(() =>
      usePerpsMarketInfo('hype'),
    );

    await waitForNextUpdate();

    expect(result.current?.name).toBe('HYPE');
  });

  it('returns undefined when the symbol is not in the market list', async () => {
    const markets = [makeMarketInfo({ name: 'BTC' })];
    mockSubmitRequestToBackground.mockResolvedValue(markets);

    const { result, waitForNextUpdate } = renderHook(() =>
      usePerpsMarketInfo('SOL'),
    );

    await waitForNextUpdate();

    expect(result.current).toBeUndefined();
  });

  it('returns undefined and does not throw when the fetch rejects', async () => {
    mockSubmitRequestToBackground.mockRejectedValue(new Error('network error'));

    const { result } = renderHook(() => usePerpsMarketInfo('BTC'));

    // Allow the promise rejection to be handled
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current).toBeUndefined();
  });

  it('does not update state after unmount (cancelled flag)', async () => {
    let resolvePromise!: (v: MarketInfo[]) => void;
    mockSubmitRequestToBackground.mockReturnValue(
      new Promise<MarketInfo[]>((res) => {
        resolvePromise = res;
      }),
    );

    const { result, unmount } = renderHook(() => usePerpsMarketInfo('BTC'));

    unmount();

    // Resolve after unmount — should not cause a state update
    await act(async () => {
      resolvePromise([makeMarketInfo({ name: 'BTC' })]);
      await Promise.resolve();
    });

    // Still undefined because the update was cancelled
    expect(result.current).toBeUndefined();
  });
});
