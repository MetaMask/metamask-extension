import { act } from '@testing-library/react';
import { renderHookWithProvider } from '../../../test/lib/render-helpers-navigate';
import { createBridgeMockStore } from '../../../test/data/bridge/mock-bridge-store';
import { flushPromises } from '../../../test/lib/timer-helpers';
import { useCountdownTimer } from './useCountdownTimer';

jest.useFakeTimers();
const renderUseCountdownTimer = (mockStoreState: object) =>
  renderHookWithProvider(() => useCountdownTimer(), mockStoreState);

describe('useCountdownTimer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
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

    for (let secondsElapsed = 1; secondsElapsed <= 50; secondsElapsed += 1) {
      await act(async () => {
        jest.advanceTimersByTime(1000);
        await flushPromises();
      });

      if (secondsElapsed % 10 === 0 && secondsElapsed <= 40) {
        expect(result.current).toStrictEqual(41 - secondsElapsed);
      }
    }

    expect(result.current).toStrictEqual(0);
  });
});
