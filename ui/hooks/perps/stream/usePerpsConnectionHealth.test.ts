import { renderHook, act } from '@testing-library/react-hooks';
import { useSelector } from 'react-redux';
import { usePerpsConnectionHealth } from './usePerpsConnectionHealth';

const mockSubmitRequestToBackground = jest.fn();
jest.mock('../../../store/background-connection', () => ({
  submitRequestToBackground: (...args: unknown[]) =>
    mockSubmitRequestToBackground(...args),
}));

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

const useSelectorMock = useSelector as jest.MockedFunction<typeof useSelector>;

const MIN_HIDDEN_DURATION_MS = 30_000;

function fireVisibilityChange(state: 'visible' | 'hidden') {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => state,
  });
  document.dispatchEvent(new Event('visibilitychange'));
}

describe('usePerpsConnectionHealth', () => {
  let nowSpy: jest.SpyInstance;
  let currentTime: number;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSubmitRequestToBackground.mockReset();
    mockSubmitRequestToBackground.mockResolvedValue(undefined);

    currentTime = 100_000;
    nowSpy = jest.spyOn(Date, 'now').mockImplementation(() => currentTime);

    useSelectorMock.mockImplementation((selector) =>
      (selector as (s: Record<string, unknown>) => unknown)({
        metamask: { connectivityStatus: 'online' },
      }),
    );

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'visible',
    });
  });

  afterEach(() => {
    nowSpy.mockRestore();
  });

  it('calls perpsCheckHealth on visibility change after long hide', async () => {
    renderHook(() => usePerpsConnectionHealth());

    fireVisibilityChange('hidden');
    currentTime += MIN_HIDDEN_DURATION_MS + 1;

    await act(async () => {
      fireVisibilityChange('visible');
    });

    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'perpsCheckHealth',
    );
  });

  it('skips check if hidden for less than MIN_HIDDEN_DURATION_MS', async () => {
    renderHook(() => usePerpsConnectionHealth());

    fireVisibilityChange('hidden');
    currentTime += MIN_HIDDEN_DURATION_MS - 1;

    await act(async () => {
      fireVisibilityChange('visible');
    });

    expect(mockSubmitRequestToBackground).not.toHaveBeenCalled();
  });

  it('calls perpsCheckHealth when device transitions from offline to online', async () => {
    useSelectorMock.mockImplementation((selector) =>
      (selector as (s: Record<string, unknown>) => unknown)({
        metamask: { connectivityStatus: 'offline' },
      }),
    );

    const { rerender } = renderHook(() => usePerpsConnectionHealth());

    useSelectorMock.mockImplementation((selector) =>
      (selector as (s: Record<string, unknown>) => unknown)({
        metamask: { connectivityStatus: 'online' },
      }),
    );

    await act(async () => {
      rerender();
    });

    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'perpsCheckHealth',
    );
  });

  it('does not call perpsCheckHealth when device stays online', async () => {
    useSelectorMock.mockImplementation((selector) =>
      (selector as (s: Record<string, unknown>) => unknown)({
        metamask: { connectivityStatus: 'online' },
      }),
    );

    const { rerender } = renderHook(() => usePerpsConnectionHealth());

    await act(async () => {
      rerender();
    });

    expect(mockSubmitRequestToBackground).not.toHaveBeenCalled();
  });

  it('does not throw when perpsCheckHealth fails', async () => {
    mockSubmitRequestToBackground.mockRejectedValue(
      new Error('not available'),
    );

    renderHook(() => usePerpsConnectionHealth());

    fireVisibilityChange('hidden');
    currentTime += MIN_HIDDEN_DURATION_MS + 1;

    await act(async () => {
      fireVisibilityChange('visible');
    });

    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'perpsCheckHealth',
    );
  });

  it('fires health check on visible event with no prior hidden timestamp', async () => {
    renderHook(() => usePerpsConnectionHealth());

    await act(async () => {
      fireVisibilityChange('visible');
    });

    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'perpsCheckHealth',
    );
  });

  it('cleans up visibilitychange listener on unmount', () => {
    const addSpy = jest.spyOn(document, 'addEventListener');
    const removeSpy = jest.spyOn(document, 'removeEventListener');

    const { unmount } = renderHook(() => usePerpsConnectionHealth());

    expect(addSpy).toHaveBeenCalledWith(
      'visibilitychange',
      expect.any(Function),
    );

    unmount();

    expect(removeSpy).toHaveBeenCalledWith(
      'visibilitychange',
      expect.any(Function),
    );

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });
});
