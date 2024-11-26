import { renderHookWithProvider } from '../../../test/lib/render-helpers';
import { createBridgeMockStore } from '../../../test/jest/mock-store';
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
      createBridgeMockStore(
        { extensionConfig: { maxRefreshCount: 5, refreshRate: 40000 } },
        {},
        {
          quotesLastFetched,
          quotesRefreshCount: 0,
        },
      ),
    );

    let i = 0;
    while (i <= 40) {
      const secondsLeft = Math.min(41, 40 - i + 2);
      expect(result.current).toStrictEqual(
        `0:${secondsLeft < 10 ? '0' : ''}${secondsLeft}`,
      );
      i += 10;
      jest.advanceTimersByTime(10000);
      await flushPromises();
    }
    expect(result.current).toStrictEqual('0:00');
  });
});
