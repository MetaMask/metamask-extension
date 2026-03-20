import { renderHook, act } from '@testing-library/react-hooks';
import { useBackgroundQuerySync } from './useBackgroundQuerySync';

const mockSubscribeToMessengerEvent = jest.fn();
const mockHydrate = jest.fn();
const mockUseQueryClient = jest.fn();

jest.mock('../store/background-connection', () => ({
  subscribeToMessengerEvent: (...args: unknown[]) =>
    mockSubscribeToMessengerEvent(...args),
}));

jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => mockUseQueryClient(),
}));

jest.mock('@tanstack/query-core', () => ({
  hydrate: (...args: unknown[]) => mockHydrate(...args),
}));

const EXPECTED_EVENTS = ['CurrencyRateDataService:cacheUpdate'];

describe('useBackgroundQuerySync', () => {
  const mockQueryClient = {};

  const capturedCallbacks: Record<
    string,
    (payload: [{ state: unknown }]) => void
  > = {};
  const mockUnsubscribes: Record<string, jest.Mock> = {};

  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(capturedCallbacks).forEach((k) => delete capturedCallbacks[k]);
    Object.keys(mockUnsubscribes).forEach((k) => delete mockUnsubscribes[k]);

    mockUseQueryClient.mockReturnValue(mockQueryClient);

    mockSubscribeToMessengerEvent.mockImplementation((event, callback) => {
      capturedCallbacks[event] = callback;
      const unsub = jest.fn().mockResolvedValue(undefined);
      mockUnsubscribes[event] = unsub;
      return Promise.resolve(unsub);
    });
  });

  it('subscribes to all background sync events on mount', () => {
    renderHook(() => useBackgroundQuerySync());

    expect(mockSubscribeToMessengerEvent).toHaveBeenCalledTimes(
      EXPECTED_EVENTS.length,
    );
    EXPECTED_EVENTS.forEach((event) => {
      expect(mockSubscribeToMessengerEvent).toHaveBeenCalledWith(
        event,
        expect.any(Function),
      );
    });
  });

  it('calls hydrate when cacheUpdate event fires with state', async () => {
    renderHook(() => useBackgroundQuerySync());
    await act(async () => { await Promise.resolve(); });

    const dehydratedState = {
      mutations: [],
      queries: [
        {
          queryKey: ['CurrencyRateDataService:getCurrencyRates'],
          state: { data: { ETH: { conversionRate: 3000 } } },
        },
      ],
    };

    capturedCallbacks['CurrencyRateDataService:cacheUpdate']([
      { state: dehydratedState },
    ]);

    expect(mockHydrate).toHaveBeenCalledWith(mockQueryClient, dehydratedState);
  });

  it('does not call hydrate when payload.state is falsy', async () => {
    renderHook(() => useBackgroundQuerySync());
    await act(async () => { await Promise.resolve(); });

    capturedCallbacks['CurrencyRateDataService:cacheUpdate']([
      { state: null },
    ]);

    expect(mockHydrate).not.toHaveBeenCalled();
  });

  it('calls all cleanup functions on unmount', async () => {
    const { unmount } = renderHook(() => useBackgroundQuerySync());
    await act(async () => { await Promise.resolve(); });

    unmount();

    EXPECTED_EVENTS.forEach((event) => {
      expect(mockUnsubscribes[event]).toHaveBeenCalled();
    });
  });

  it('does not call hydrate before any event fires', async () => {
    renderHook(() => useBackgroundQuerySync());
    await act(async () => { await Promise.resolve(); });

    expect(mockHydrate).not.toHaveBeenCalled();
  });
});
