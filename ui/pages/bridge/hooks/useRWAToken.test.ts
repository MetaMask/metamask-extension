import { act } from '@testing-library/react';
import type { BridgeToken } from '../../../ducks/bridge/types';
import { renderHookWithProvider } from '../../../../test/lib/render-helpers-navigate';
import {
  useRWAToken,
  isTokenTradingOpenAt,
  isStockRWAToken,
  type RWATokenLike,
} from './useRWAToken';

type TestToken = Pick<BridgeToken, 'rwaData'>;

const buildToken = (
  overrides?: Partial<NonNullable<TestToken['rwaData']>>,
): TestToken => ({
  rwaData: {
    instrumentType: 'stock',
    market: {
      nextOpen: '2026-03-02T09:00:00.000Z',
      nextClose: '2026-03-02T17:00:00.000Z',
    },
    nextPause: undefined,
    ...overrides,
  },
});

const buildState = (rwaTokensEnabled: boolean) => ({
  metamask: {
    remoteFeatureFlags: { rwaTokensEnabled },
  },
});

const enabledState = buildState(true);

const NOON = new Date('2026-03-02T12:00:00.000Z').getTime();

describe('isStockRWAToken', () => {
  it('returns true for stock instrument type', () => {
    expect(isStockRWAToken(buildToken())).toBe(true);
  });

  it('returns false for non-stock instrument type', () => {
    expect(isStockRWAToken(buildToken({ instrumentType: 'currency' }))).toBe(
      false,
    );
  });

  it('returns false when token is undefined', () => {
    expect(isStockRWAToken(undefined)).toBe(false);
  });

  it('returns false when rwaData is undefined', () => {
    expect(isStockRWAToken({ rwaData: undefined } as RWATokenLike)).toBe(
      false,
    );
  });
});

describe('isTokenTradingOpenAt', () => {
  describe('early-return paths', () => {
    it('returns true when token is undefined', () => {
      expect(isTokenTradingOpenAt(undefined, NOON)).toBe(true);
    });

    it('returns true when rwaData is undefined', () => {
      expect(
        isTokenTradingOpenAt({ rwaData: undefined } as RWATokenLike, NOON),
      ).toBe(true);
    });

    it('returns false when market object is undefined', () => {
      expect(
        isTokenTradingOpenAt(
          buildToken({ market: undefined as never }),
          NOON,
        ),
      ).toBe(false);
    });

    it('returns false when only nextOpen is null', () => {
      expect(
        isTokenTradingOpenAt(
          buildToken({
            market: {
              nextOpen: null as never,
              nextClose: '2026-03-02T17:00:00.000Z',
            },
          }),
          NOON,
        ),
      ).toBe(false);
    });

    it('returns false when only nextClose is null', () => {
      expect(
        isTokenTradingOpenAt(
          buildToken({
            market: {
              nextOpen: '2026-03-02T09:00:00.000Z',
              nextClose: null as never,
            },
          }),
          NOON,
        ),
      ).toBe(false);
    });
  });

  describe('normal market window (nextClose > nextOpen)', () => {
    const token = buildToken({
      market: {
        nextOpen: '2026-03-02T09:00:00.000Z',
        nextClose: '2026-03-02T17:00:00.000Z',
      },
    });

    it('returns true when now is within the window', () => {
      expect(isTokenTradingOpenAt(token, NOON)).toBe(true);
    });

    it('returns true at exact open time', () => {
      const openMs = new Date('2026-03-02T09:00:00.000Z').getTime();
      expect(isTokenTradingOpenAt(token, openMs)).toBe(true);
    });

    it('returns false at exact close time', () => {
      const closeMs = new Date('2026-03-02T17:00:00.000Z').getTime();
      expect(isTokenTradingOpenAt(token, closeMs)).toBe(false);
    });

    it('returns false before the market opens', () => {
      const beforeOpen = new Date('2026-03-02T08:00:00.000Z').getTime();
      expect(isTokenTradingOpenAt(token, beforeOpen)).toBe(false);
    });

    it('returns false after the market closes', () => {
      const afterClose = new Date('2026-03-02T18:00:00.000Z').getTime();
      expect(isTokenTradingOpenAt(token, afterClose)).toBe(false);
    });
  });

  describe('overnight market window (nextClose <= nextOpen)', () => {
    const overnightToken = buildToken({
      market: {
        nextOpen: '2026-03-02T22:00:00.000Z',
        nextClose: '2026-03-02T04:00:00.000Z',
      },
    });

    it('returns true when now is after open', () => {
      const lateEvening = new Date('2026-03-02T23:30:00.000Z').getTime();
      expect(isTokenTradingOpenAt(overnightToken, lateEvening)).toBe(true);
    });

    it('returns true when now is before close', () => {
      const earlyMorning = new Date('2026-03-02T03:00:00.000Z').getTime();
      expect(isTokenTradingOpenAt(overnightToken, earlyMorning)).toBe(true);
    });

    it('returns false when now is between close and open', () => {
      expect(isTokenTradingOpenAt(overnightToken, NOON)).toBe(false);
    });
  });

  describe('pause windows', () => {
    it('returns false when inside a pause with start and end', () => {
      const token = buildToken({
        nextPause: {
          start: '2026-03-02T11:30:00.000Z',
          end: '2026-03-02T12:30:00.000Z',
        },
      });
      expect(isTokenTradingOpenAt(token, NOON)).toBe(false);
    });

    it('returns true when before a pause starts', () => {
      const token = buildToken({
        nextPause: {
          start: '2026-03-02T13:00:00.000Z',
          end: '2026-03-02T14:00:00.000Z',
        },
      });
      expect(isTokenTradingOpenAt(token, NOON)).toBe(true);
    });

    it('returns true when after a pause ends', () => {
      const token = buildToken({
        nextPause: {
          start: '2026-03-02T10:00:00.000Z',
          end: '2026-03-02T11:00:00.000Z',
        },
      });
      expect(isTokenTradingOpenAt(token, NOON)).toBe(true);
    });

    it('returns false for indefinite pause (start only, no end)', () => {
      const token = buildToken({
        nextPause: {
          start: '2026-03-02T11:00:00.000Z',
          end: undefined,
        },
      });
      expect(isTokenTradingOpenAt(token, NOON)).toBe(false);
    });

    it('returns false for pause with only end time when now is before end', () => {
      const token = buildToken({
        nextPause: {
          start: undefined,
          end: '2026-03-02T13:00:00.000Z',
        },
      });
      expect(isTokenTradingOpenAt(token, NOON)).toBe(false);
    });

    it('returns true for pause with only end time when now is after end', () => {
      const token = buildToken({
        nextPause: {
          start: undefined,
          end: '2026-03-02T11:00:00.000Z',
        },
      });
      expect(isTokenTradingOpenAt(token, NOON)).toBe(true);
    });
  });

  it('uses Date.now() as default when nowMs is omitted', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-03-02T12:00:00.000Z'));
    try {
      expect(isTokenTradingOpenAt(buildToken())).toBe(true);
    } finally {
      jest.useRealTimers();
    }
  });
});

describe('useRWAToken', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-03-02T12:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns false for non-stock tokens', () => {
    const { result } = renderHookWithProvider(
      () => useRWAToken(),
      enabledState,
    );

    expect(
      result.current.isStockToken(buildToken({ instrumentType: 'currency' })),
    ).toBe(false);
  });

  it('returns true for stock tokens', () => {
    const { result } = renderHookWithProvider(
      () => useRWAToken(),
      enabledState,
    );

    expect(result.current.isStockToken(buildToken())).toBe(true);
  });

  it('isStockToken returns false for undefined token', () => {
    const { result } = renderHookWithProvider(
      () => useRWAToken(),
      enabledState,
    );

    expect(result.current.isStockToken(undefined)).toBe(false);
  });

  it('returns true while the market is open', () => {
    const { result } = renderHookWithProvider(
      () => useRWAToken(),
      enabledState,
    );

    expect(result.current.isTokenTradingOpen(buildToken())).toBe(true);
  });

  it('isTokenTradingOpen returns true for undefined token', () => {
    const { result } = renderHookWithProvider(
      () => useRWAToken(),
      enabledState,
    );

    expect(result.current.isTokenTradingOpen(undefined)).toBe(true);
  });

  it('returns false when market timestamps are invalid', () => {
    const { result } = renderHookWithProvider(
      () => useRWAToken(),
      enabledState,
    );

    expect(
      result.current.isTokenTradingOpen(
        buildToken({
          market: {
            nextOpen: 'not-a-date',
            nextClose: 'also-not-a-date',
          },
        }),
      ),
    ).toBe(false);
  });

  it('supports overnight market windows', () => {
    jest.setSystemTime(new Date('2026-03-02T23:30:00.000Z'));
    const { result } = renderHookWithProvider(
      () => useRWAToken(),
      enabledState,
    );

    expect(
      result.current.isTokenTradingOpen(
        buildToken({
          market: {
            nextOpen: '2026-03-02T22:00:00.000Z',
            nextClose: '2026-03-02T04:00:00.000Z',
          },
        }),
      ),
    ).toBe(true);
  });

  it('returns false while inside a pause window', () => {
    const { result } = renderHookWithProvider(
      () => useRWAToken(),
      enabledState,
    );

    expect(
      result.current.isTokenTradingOpen(
        buildToken({
          nextPause: {
            start: '2026-03-02T11:30:00.000Z',
            end: '2026-03-02T12:30:00.000Z',
          },
        }),
      ),
    ).toBe(false);
  });

  it('treats a pause with only an end time as active until that end', () => {
    const { result } = renderHookWithProvider(
      () => useRWAToken(),
      enabledState,
    );

    expect(
      result.current.isTokenTradingOpen(
        buildToken({
          nextPause: {
            start: undefined,
            end: '2026-03-02T12:30:00.000Z',
          },
        }),
      ),
    ).toBe(false);
  });

  it('updates market status when the internal clock ticks', () => {
    jest.setSystemTime(new Date('2026-03-02T12:00:00.000Z'));
    const { result } = renderHookWithProvider(
      () => useRWAToken(),
      enabledState,
    );
    const token = buildToken({
      market: {
        nextOpen: '2026-03-02T11:00:00.000Z',
        nextClose: '2026-03-02T12:00:30.000Z',
      },
    });

    expect(result.current.isTokenTradingOpen(token)).toBe(true);

    act(() => {
      jest.setSystemTime(new Date('2026-03-02T12:01:00.000Z'));
      jest.advanceTimersByTime(60_000);
    });

    expect(result.current.isTokenTradingOpen(token)).toBe(false);
  });

  it('cleans up the interval on unmount', () => {
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
    const { unmount } = renderHookWithProvider(
      () => useRWAToken(),
      enabledState,
    );

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
    clearIntervalSpy.mockRestore();
  });

  describe('when rwaTokensEnabled is false', () => {
    const disabledState = buildState(false);

    it('isStockToken returns false even for stock tokens', () => {
      const { result } = renderHookWithProvider(
        () => useRWAToken(),
        disabledState,
      );

      expect(result.current.isStockToken(buildToken())).toBe(false);
    });

    it('isTokenTradingOpen returns true regardless of market hours', () => {
      jest.setSystemTime(new Date('2026-03-02T03:00:00.000Z'));
      const { result } = renderHookWithProvider(
        () => useRWAToken(),
        disabledState,
      );

      expect(result.current.isTokenTradingOpen(buildToken())).toBe(true);
    });

    it('does not start an interval', () => {
      const setIntervalSpy = jest.spyOn(global, 'setInterval');
      const callCountBefore = setIntervalSpy.mock.calls.length;

      renderHookWithProvider(() => useRWAToken(), disabledState);

      expect(setIntervalSpy.mock.calls.length).toBe(callCountBefore);
      setIntervalSpy.mockRestore();
    });
  });
});
