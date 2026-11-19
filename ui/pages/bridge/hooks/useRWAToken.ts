import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import type { BridgeToken } from '../../../ducks/bridge/types';
import { getIsRWATokensEnabled } from '../../../selectors/rwa/feature-flags';

type DateLike = string | null | undefined | Date;
export type RWATokenLike = Pick<BridgeToken, 'rwaData'> | undefined;

const toMs = (value: DateLike): number | null => {
  if (!value) {
    return null;
  }

  const ms = new Date(value as string).getTime();
  return Number.isFinite(ms) ? ms : null;
};

/**
 * Returns true when `nowMs` falls inside the time window defined by
 * nextOpen/nextClose, using the same wraparound logic as regular market hours.
 * @param nextOpen
 * @param nextClose
 * @param nowMs
 */
const isInsideWindow = (
  nextOpen: DateLike,
  nextClose: DateLike,
  nowMs: number,
): boolean => {
  const openMs = toMs(nextOpen);
  const closeMs = toMs(nextClose);
  if (openMs === null || closeMs === null) {
    return false;
  }
  return closeMs > openMs
    ? nowMs >= openMs && nowMs < closeMs
    : nowMs < closeMs || nowMs >= openMs;
};

// Interval at which components re-evaluate market open/close status.
// Used by the useRWAToken hook to trigger periodic re-renders on surfaces
// (token list, asset detail page) that lack other sources of re-renders.
// On the bridge page, the selector-based approach (getIsStockMarketClosed)
// with Date.now() is preferred, following the isQuoteExpired pattern.
const RWA_TIME_TICK_MS = 60_000;

/**
 * Pure function: returns true when the given token's market is currently open
 * (not paused and within trading hours). Tokens without rwaData are treated
 * as always open.
 *
 * @param token - A token-like object that may contain rwaData.
 * @param nowMs - The current timestamp in milliseconds to evaluate against.
 */
export const isTokenTradingOpenAt = (
  token?: RWATokenLike,
  nowMs: number = Date.now(),
) => {
  if (!token?.rwaData) {
    return true;
  }

  const nextOpenMs = toMs(token.rwaData.market?.nextOpen);
  const nextCloseMs = toMs(token.rwaData.market?.nextClose);
  if (nextOpenMs === null || nextCloseMs === null) {
    return false;
  }

  const marketIsOpen =
    nextCloseMs > nextOpenMs
      ? nowMs >= nextOpenMs && nowMs < nextCloseMs
      : nowMs < nextCloseMs || nowMs >= nextOpenMs;

  const pauseStartMs = toMs(token.rwaData.nextPause?.start);
  const pauseEndMs = toMs(token.rwaData.nextPause?.end);
  const hasPauseStart = pauseStartMs !== null;
  const hasPauseEnd = pauseEndMs !== null;
  const inPause =
    (hasPauseStart &&
      nowMs >= pauseStartMs &&
      (!hasPauseEnd || nowMs < pauseEndMs)) ||
    (!hasPauseStart && hasPauseEnd && nowMs < pauseEndMs);

  return marketIsOpen && !inPause;
};

/**
 * Pure function: returns true when the token's off-hours trading window
 * is currently active. This is independent of whether the regular market
 * is open or closed — it only checks the offhours window.
 *
 * Intentionally ignores `rwaData.nextPause`: pauses (e.g. dividends,
 * corporate actions) apply only to regular market hours, which are gated
 * by {@link isTokenTradingOpenAt}. Off-hours sessions remain tradable
 * even when a regular-hours pause is present.
 *
 * Returns false when:
 * - The token has no rwaData or no offhours data
 * - The offhours window timestamps are missing/invalid
 * - The current time is outside the offhours window
 *
 * @param token - A token-like object that may contain rwaData.
 * @param nowMs - The current timestamp in milliseconds to evaluate against.
 */
export const isTokenInOffHoursAt = (
  token?: RWATokenLike,
  nowMs: number = Date.now(),
): boolean => {
  if (!token?.rwaData) {
    return false;
  }

  const { offhours } = token.rwaData;
  if (!offhours) {
    return false;
  }

  return isInsideWindow(offhours.nextOpen, offhours.nextClose, nowMs);
};

/**
 * Pure function: returns true when the token is a stock instrument.
 *
 * @param token - A token-like object that may contain rwaData.
 */
export const isStockRWAToken = (token?: RWATokenLike): boolean =>
  token?.rwaData?.instrumentType === 'stock';

/**
 * Hook that provides helpers to check whether a token is a stock RWA token
 * and whether it is currently tradable.
 *
 * `isTokenTradingOpen` is true during regular market hours **or** an active
 * off-hours session — matching `getIsStockMarketClosed`'s notion of
 * "not closed". Callers that gate selection / show a market-closed modal
 * (e.g. bridge asset picker) must use this so off-hours tokens remain
 * selectable and can reach the off-hours warning.
 *
 * `nowMs` is a cached timestamp updated every {@link RWA_TIME_TICK_MS} (60 s).
 * It exists solely to trigger periodic re-renders so that market open/close
 * transitions are reflected in the UI even when nothing else causes a
 * re-render (e.g. the home token list or asset detail page).
 *
 * On the bridge page, prefer the selector-based `getIsStockMarketClosed`
 * (which uses `Date.now()` inline, because that
 * page already re-renders frequently from quote polling and user interaction.
 */
export function useRWAToken() {
  const isRWAEnabled = useSelector(getIsRWATokensEnabled);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (!isRWAEnabled) {
      return undefined;
    }
    queueMicrotask(() => {
      setNowMs(Date.now());
    });
    const id = setInterval(() => setNowMs(Date.now()), RWA_TIME_TICK_MS);
    return () => clearInterval(id);
  }, [isRWAEnabled]);

  const isStockTokenFlagGated = useCallback(
    (token?: RWATokenLike) => isRWAEnabled && isStockRWAToken(token),
    [isRWAEnabled],
  );

  const isTokenTradingOpen = useCallback(
    (token?: RWATokenLike) => {
      if (!isRWAEnabled) {
        return true;
      }
      // Off-hours sessions are tradable even when regular hours are closed
      // (and even when a regular-hours pause is present).
      return (
        isTokenTradingOpenAt(token, nowMs) || isTokenInOffHoursAt(token, nowMs)
      );
    },
    [isRWAEnabled, nowMs],
  );

  return {
    isStockToken: isStockTokenFlagGated,
    isTokenTradingOpen,
  };
}
