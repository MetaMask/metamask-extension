import { renderHook, act } from '@testing-library/react';
import { usePerpsMeasurement } from './usePerpsMeasurement';

// A measurement is an attribute on the active trace's root span.
function mockSentryWithRootSpan() {
  const setAttribute = jest.fn();
  const rootSpan = { setAttribute };
  (globalThis as Record<string, unknown>).sentry = {
    getActiveSpan: () => ({}),
    getRootSpan: () => rootSpan,
  };
  return setAttribute;
}

describe('usePerpsMeasurement', () => {
  afterEach(() => {
    jest.clearAllMocks();
    delete (globalThis as Record<string, unknown>).sentry;
  });

  it('does not set a measurement attribute when isReady is false', () => {
    const mockSetMeasurement = mockSentryWithRootSpan();

    renderHook(() => usePerpsMeasurement('PerpsTabLoaded', false));

    expect(mockSetMeasurement).not.toHaveBeenCalled();
  });

  it('sets the measurement attribute with the correct name and unit when isReady becomes true', () => {
    const mockSetMeasurement = mockSentryWithRootSpan();

    const { rerender } = renderHook(
      ({ isReady }: { isReady: boolean }) =>
        usePerpsMeasurement('PerpsTabLoaded', isReady),
      { initialProps: { isReady: false } },
    );

    expect(mockSetMeasurement).not.toHaveBeenCalled();

    rerender({ isReady: true });

    expect(mockSetMeasurement).toHaveBeenCalledTimes(1);
    expect(mockSetMeasurement).toHaveBeenCalledWith('PerpsTabLoaded', {
      value: expect.any(Number),
      unit: 'millisecond',
    });
  });

  it('reports a non-negative duration', () => {
    const mockSetMeasurement = mockSentryWithRootSpan();

    const { rerender } = renderHook(
      ({ isReady }: { isReady: boolean }) =>
        usePerpsMeasurement('PerpsTabLoaded', isReady),
      { initialProps: { isReady: false } },
    );

    rerender({ isReady: true });

    const { value: duration } = mockSetMeasurement.mock.calls[0][1] as {
      value: number;
    };
    expect(duration).toBeGreaterThanOrEqual(0);
  });

  it('only reports once even if isReady toggles back and forth', () => {
    const mockSetMeasurement = mockSentryWithRootSpan();

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

  it('sets the measurement attribute immediately when mounted with isReady=true', () => {
    const mockSetMeasurement = mockSentryWithRootSpan();

    renderHook(() => usePerpsMeasurement('PerpsMarketDetailLoaded', true));

    expect(mockSetMeasurement).toHaveBeenCalledTimes(1);
    expect(mockSetMeasurement).toHaveBeenCalledWith('PerpsMarketDetailLoaded', {
      value: expect.any(Number),
      unit: 'millisecond',
    });
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
    const mockSetMeasurement = mockSentryWithRootSpan();

    const { rerender } = renderHook(
      ({ isReady }: { isReady: boolean }) =>
        usePerpsMeasurement('PerpsAssetScreenLoaded', isReady),
      { initialProps: { isReady: false } },
    );

    rerender({ isReady: true });

    expect(mockSetMeasurement).toHaveBeenCalledWith('PerpsAssetScreenLoaded', {
      value: expect.any(Number),
      unit: 'millisecond',
    });
  });
});
