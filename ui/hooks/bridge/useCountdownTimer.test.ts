import { act } from '@testing-library/react';
import { renderHookWithProvider } from '../../../test/lib/render-helpers-navigate';
import { createBridgeMockStore } from '../../../test/data/bridge/mock-bridge-store';
import { useCountdownTimer } from './useCountdownTimer';

const renderUseCountdownTimer = (mockStoreState: object) =>
  renderHookWithProvider(() => useCountdownTimer(), mockStoreState);

describe('useCountdownTimer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('returns time remaining', async () => {
    const quotesLastFetched = Date.now();
    const { result } = renderUseCountdownTimer(
      createBridgeMockStore({
        featureFlagOverrides: {
          bridgeConfig: { maxRefreshCount: 5, refreshRate: 40000 },
        },
        bridgeStateOverrides: {
          quotesLastFetched,
          quotesRefreshCount: 0,
        },
      }),
    );

    expect(result.current).toStrictEqual(41);

    for (let elapsedSeconds = 10; elapsedSeconds <= 40; elapsedSeconds += 10) {
      await act(async () => {
        jest.advanceTimersByTime(10000);
      });
      expect(result.current).toStrictEqual(41 - elapsedSeconds);
    }

    await act(async () => {
      jest.advanceTimersByTime(10000);
    });
    expect(result.current).toStrictEqual(0);
  });
});
