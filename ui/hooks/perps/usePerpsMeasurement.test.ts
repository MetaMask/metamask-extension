import { renderHook, act } from '@testing-library/react-hooks';
import { usePerpsMeasurement } from './usePerpsMeasurement';

describe('usePerpsMeasurement', () => {
  afterEach(() => {
    jest.clearAllMocks();
    delete (globalThis as Record<string, unknown>).sentry;
  });

  it('does not call setMeasurement when isReady is false', () => {
    const mockSetMeasurement = jest.fn();
    (globalThis as Record<string, unknown>).sentry = {
      setMeasurement: mockSetMeasurement,
    };

    renderHook(() => usePerpsMeasurement('PerpsTabLoaded', false));

    expect(mockSetMeasurement).not.toHaveBeenCalled();
  });

  it('calls setMeasurement with the correct name and unit when isReady becomes true', () => {
    const mockSetMeasurement = jest.fn();
    (globalThis as Record<string, unknown>).sentry = {
      setMeasurement: mockSetMeasurement,
    };

    const { rerender } = renderHook(
      ({ isReady }: { isReady: boolean }) =>
        usePerpsMeasurement('PerpsTabLoaded', isReady),
      { initialProps: { isReady: false } },
    );

    expect(mockSetMeasurement).not.toHaveBeenCalled();

    rerender({ isReady: true });

    expect(mockSetMeasurement).toHaveBeenCalledTimes(1);
    expect(mockSetMeasurement).toHaveBeenCalledWith(
      'PerpsTabLoaded',
      expect.any(Number),
      'millisecond',
    );
  });

  it('reports a non-negative duration', () => {
    const mockSetMeasurement = jest.fn();
    (globalThis as Record<string, unknown>).sentry = {
      setMeasurement: mockSetMeasurement,
    };

    const { rerender } = renderHook(
      ({ isReady }: { isReady: boolean }) =>
        usePerpsMeasurement('PerpsTabLoaded', isReady),
      { initialProps: { isReady: false } },
    );

    rerender({ isReady: true });

    const duration = mockSetMeasurement.mock.calls[0][1] as number;
    expect(duration).toBeGreaterThanOrEqual(0);
  });

  it('only reports once even if isReady toggles back and forth', () => {
    const mockSetMeasurement = jest.fn();
    (globalThis as Record<string, unknown>).sentry = {
      setMeasurement: mockSetMeasurement,
    };

    const { rerender } = renderHook(
      ({ isReady }: { isReady: boolean }) =>
        usePerpsMeasurement('PerpsTabLoaded', isReady),
      { initialProps: { isReady: false } },
    );

    rerender({ isReady: true });
    rerender({ isReady: false });
    rerender({ isReady: true });

    expect(mockSetMeasurement).toHaveBeenCalledTimes(1);
  });

  it('calls setMeasurement immediately when mounted with isReady=true', () => {
    const mockSetMeasurement = jest.fn();
    (globalThis as Record<string, unknown>).sentry = {
      setMeasurement: mockSetMeasurement,
    };

    renderHook(() => usePerpsMeasurement('PerpsMarketDetailLoaded', true));

    expect(mockSetMeasurement).toHaveBeenCalledTimes(1);
    expect(mockSetMeasurement).toHaveBeenCalledWith(
      'PerpsMarketDetailLoaded',
      expect.any(Number),
      'millisecond',
    );
  });

  it('does not throw when sentry is not initialized', () => {
    const { rerender } = renderHook(
      ({ isReady }: { isReady: boolean }) =>
        usePerpsMeasurement('PerpsTabLoaded', isReady),
      { initialProps: { isReady: false } },
    );

    expect(() => {
      act(() => {
        rerender({ isReady: true });
      });
    }).not.toThrow();
  });

  it('uses the provided measurement name', () => {
    const mockSetMeasurement = jest.fn();
    (globalThis as Record<string, unknown>).sentry = {
      setMeasurement: mockSetMeasurement,
    };

    const { rerender } = renderHook(
      ({ isReady }: { isReady: boolean }) =>
        usePerpsMeasurement('PerpsAssetScreenLoaded', isReady),
      { initialProps: { isReady: false } },
    );

    rerender({ isReady: true });

    expect(mockSetMeasurement).toHaveBeenCalledWith(
      'PerpsAssetScreenLoaded',
      expect.any(Number),
      'millisecond',
    );
  });
});
