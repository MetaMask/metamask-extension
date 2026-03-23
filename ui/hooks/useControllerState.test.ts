import { renderHook, act } from '@testing-library/react-hooks';
import { createControllerStore, useControllerState } from './useControllerState';

const mockSubscribeToMessengerEvent = jest.fn();

jest.mock('../store/background-connection', () => ({
  subscribeToMessengerEvent: (...args: unknown[]) =>
    mockSubscribeToMessengerEvent(...args),
}));

jest.mock('./useMessenger', () => ({
  useMessenger: jest.fn(),
}));

describe('createControllerStore + useControllerState', () => {
  let capturedCallback: ((payload: unknown) => void) | undefined;

  beforeEach(() => {
    jest.clearAllMocks();
    capturedCallback = undefined;

    mockSubscribeToMessengerEvent.mockImplementation((_event, callback) => {
      capturedCallback = callback;
      return Promise.resolve(jest.fn());
    });
  });

  it('subscribes to the messenger event on first render', () => {
    const store = createControllerStore(
      'TestService:cacheUpdate',
      (payload) => (payload as [{ data: string }])[0]?.data,
    );

    renderHook(() => useControllerState(store, 'TestService:cacheUpdate'));

    expect(mockSubscribeToMessengerEvent).toHaveBeenCalledWith(
      'TestService:cacheUpdate',
      expect.any(Function),
    );
  });

  it('returns undefined before any event fires', () => {
    const store = createControllerStore(
      'TestService:cacheUpdate',
      (payload) => (payload as [{ data: string }])[0]?.data,
    );

    const { result } = renderHook(() => useControllerState(store, 'TestService:cacheUpdate'));

    expect(result.current).toBeUndefined();
  });

  it('returns extracted data after event fires', async () => {
    const store = createControllerStore<string>(
      'TestService:cacheUpdate',
      (payload) => (payload as [{ data: string }])[0]?.data,
    );

    const { result } = renderHook(() => useControllerState(store, 'TestService:cacheUpdate'));
    await act(async () => { await Promise.resolve(); });

    act(() => {
      capturedCallback?.([{ data: 'hello' }]);
    });

    expect(result.current).toBe('hello');
  });

  it('re-renders when new data arrives', async () => {
    const store = createControllerStore<string>(
      'TestService:cacheUpdate',
      (payload) => (payload as [{ data: string }])[0]?.data,
    );

    const { result } = renderHook(() => useControllerState(store, 'TestService:cacheUpdate'));
    await act(async () => { await Promise.resolve(); });

    act(() => {
      capturedCallback?.([{ data: 'first' }]);
    });
    expect(result.current).toBe('first');

    act(() => {
      capturedCallback?.([{ data: 'second' }]);
    });
    expect(result.current).toBe('second');
  });

  it('does not update when extractor returns undefined', async () => {
    const store = createControllerStore<string>(
      'TestService:cacheUpdate',
      (payload) => (payload as [{ data?: string }])[0]?.data,
    );

    const { result } = renderHook(() => useControllerState(store, 'TestService:cacheUpdate'));
    await act(async () => { await Promise.resolve(); });

    act(() => {
      capturedCallback?.([{ data: 'valid' }]);
    });
    expect(result.current).toBe('valid');

    act(() => {
      capturedCallback?.([{}]); // no data field → extractor returns undefined
    });
    expect(result.current).toBe('valid'); // unchanged
  });

  it('only subscribes once across multiple hook consumers', () => {
    const store = createControllerStore(
      'TestService:cacheUpdate',
      (payload) => (payload as [{ data: string }])[0]?.data,
    );

    renderHook(() => useControllerState(store, 'TestService:cacheUpdate'));
    renderHook(() => useControllerState(store, 'TestService:cacheUpdate'));

    expect(mockSubscribeToMessengerEvent).toHaveBeenCalledTimes(1);
  });
});
