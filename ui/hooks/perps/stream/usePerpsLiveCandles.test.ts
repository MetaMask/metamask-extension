import { act, renderHook } from '@testing-library/react';
import type { CandleData } from '@metamask/perps-controller';
import { CandlePeriod } from '../../../components/app/perps/constants/chartConfig';
import {
  getPerpsStreamManager,
  resetPerpsStreamManager,
} from '../../../providers/perps/PerpsStreamManager';
import { usePerpsStreamManager } from './usePerpsStreamManager';
import { usePerpsLiveCandles } from './usePerpsLiveCandles';

jest.mock('./usePerpsStreamManager', () => ({
  usePerpsStreamManager: jest.fn(),
}));

jest.mock('../../../store/background-connection', () => ({
  submitRequestToBackground: jest.fn().mockResolvedValue(undefined),
}));

describe('usePerpsLiveCandles', () => {
  beforeEach(() => {
    resetPerpsStreamManager();
    jest.mocked(usePerpsStreamManager).mockReturnValue({
      streamManager: null,
      isInitializing: true,
      error: null,
      selectedAddress: '0xfirst',
    });
  });

  afterEach(() => {
    resetPerpsStreamManager();
  });

  it('waits for account readiness and resubscribes after invalidation without remounting', () => {
    const manager = getPerpsStreamManager();
    const unsubscribe = jest.fn();
    const subscribe = jest
      .spyOn(manager.candles, 'subscribe')
      .mockReturnValue(unsubscribe);
    const pending = {
      streamManager: null,
      isInitializing: true,
      error: null,
      selectedAddress: '0xfirst',
    };
    const ready = { ...pending, streamManager: manager, isInitializing: false };
    const { result, rerender, unmount } = renderHook(() =>
      usePerpsLiveCandles({ symbol: 'BTC', interval: CandlePeriod.OneHour }),
    );
    expect(subscribe).not.toHaveBeenCalled();

    jest.mocked(usePerpsStreamManager).mockReturnValue(ready);
    rerender();
    expect(subscribe).toHaveBeenCalledTimes(1);
    const data = {
      symbol: 'BTC',
      interval: CandlePeriod.OneHour,
      candles: [],
    } as CandleData;
    act(() => subscribe.mock.calls[0][0].callback(data));
    expect(result.current.candleData).toEqual(data);
    expect(result.current.isInitialLoading).toBe(false);

    jest.mocked(usePerpsStreamManager).mockReturnValue(pending);
    rerender();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
    expect(subscribe).toHaveBeenCalledTimes(1);

    jest.mocked(usePerpsStreamManager).mockReturnValue(ready);
    rerender();
    expect(subscribe).toHaveBeenCalledTimes(2);
    act(() => subscribe.mock.calls[1][0].callback(data));
    expect(result.current.candleData).toEqual(data);
    unmount();
    expect(unsubscribe).toHaveBeenCalledTimes(2);
  });
});
