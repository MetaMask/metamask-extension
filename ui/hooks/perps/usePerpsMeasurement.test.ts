import { createElement, type PropsWithChildren } from 'react';
import { act, renderHook } from '@testing-library/react-hooks';
import {
  MetaMetricsContext,
  type MetaMetricsContextValue,
} from '../../contexts/metametrics';
import { TraceName, TraceOperation } from '../../../shared/lib/trace';
import { usePerpsMeasurement } from './usePerpsMeasurement';

const bufferedTrace = jest.fn();
const bufferedEndTrace = jest.fn();

const context: MetaMetricsContextValue = {
  trackEvent: jest.fn(),
  bufferedTrace,
  bufferedEndTrace,
  onboardingParentContext: { current: null },
};

const wrapper = ({ children }: PropsWithChildren) =>
  createElement(MetaMetricsContext.Provider, { value: context }, children);

const useRenderPerpsMeasurement = (isReady: boolean) =>
  usePerpsMeasurement({
    traceName: TraceName.PerpsEntryToLiveMarketList,
    isReady,
  });

describe('usePerpsMeasurement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date, 'now').mockReturnValue(1_000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('starts a background-owned Perps trace at mount time', () => {
    renderHook(() => useRenderPerpsMeasurement(false), { wrapper });

    expect(bufferedTrace).toHaveBeenCalledWith({
      name: TraceName.PerpsEntryToLiveMarketList,
      op: TraceOperation.PerpsOperation,
      tags: { feature: 'perps' },
      startTime: 1_000,
    });
    expect(bufferedEndTrace).not.toHaveBeenCalled();
  });

  it('ends the trace successfully once primary data is ready', () => {
    let isReady = false;
    const { rerender } = renderHook(
      () => useRenderPerpsMeasurement(isReady),
      { wrapper },
    );

    jest.spyOn(Date, 'now').mockReturnValue(1_250);
    isReady = true;
    rerender();

    expect(bufferedEndTrace).toHaveBeenCalledTimes(1);
    expect(bufferedEndTrace).toHaveBeenCalledWith({
      name: TraceName.PerpsEntryToLiveMarketList,
      timestamp: 1_250,
      data: { success: true },
    });
  });

  it('ends only once when readiness changes again', () => {
    let isReady = false;
    const { rerender } = renderHook(
      () => useRenderPerpsMeasurement(isReady),
      { wrapper },
    );

    isReady = true;
    rerender();
    isReady = false;
    rerender();
    isReady = true;
    rerender();

    expect(bufferedEndTrace).toHaveBeenCalledTimes(1);
  });

  it('uses the market-detail trace identity when requested', () => {
    renderHook(
      () =>
        usePerpsMeasurement({
          traceName: TraceName.PerpsMarketDetailLive,
          isReady: true,
        }),
      { wrapper },
    );

    expect(bufferedTrace).toHaveBeenCalledWith(
      expect.objectContaining({ name: TraceName.PerpsMarketDetailLive }),
    );
    expect(bufferedEndTrace).toHaveBeenCalledWith(
      expect.objectContaining({
        name: TraceName.PerpsMarketDetailLive,
        data: { success: true },
      }),
    );
    expect(bufferedTrace.mock.invocationCallOrder[0]).toBeLessThan(
      bufferedEndTrace.mock.invocationCallOrder[0],
    );
  });

  it('ends an unfinished trace as an unmounted failure', () => {
    const { unmount } = renderHook(() => useRenderPerpsMeasurement(false), {
      wrapper,
    });

    jest.spyOn(Date, 'now').mockReturnValue(1_500);
    act(() => unmount());

    expect(bufferedEndTrace).toHaveBeenCalledWith({
      name: TraceName.PerpsEntryToLiveMarketList,
      timestamp: 1_500,
      data: { success: false, reason: 'unmounted' },
    });
  });
});
