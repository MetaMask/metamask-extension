import { act } from '@testing-library/react';
import type { BridgeToken } from '../../../ducks/bridge/types';
import { renderHookWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { useRWAToken } from './useRWAToken';

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

describe('useRWAToken', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-03-02T12:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns false for non-stock tokens', () => {
    const { result } = renderHookWithProvider(() => useRWAToken());

    expect(
      result.current.isStockToken(buildToken({ instrumentType: 'currency' })),
    ).toBe(false);
  });

  it('returns true for stock tokens', () => {
    const { result } = renderHookWithProvider(() => useRWAToken());

    expect(result.current.isStockToken(buildToken())).toBe(true);
  });

  it('returns true while the market is open', () => {
    const { result } = renderHookWithProvider(() => useRWAToken());

    expect(result.current.isTokenTradingOpen(buildToken())).toBe(true);
  });

  it('returns false when market timestamps are invalid', () => {
    const { result } = renderHookWithProvider(() => useRWAToken());

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
    const { result } = renderHookWithProvider(() => useRWAToken());

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
    const { result } = renderHookWithProvider(() => useRWAToken());

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
    const { result } = renderHookWithProvider(() => useRWAToken());

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
    const { result } = renderHookWithProvider(() => useRWAToken());
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
});
