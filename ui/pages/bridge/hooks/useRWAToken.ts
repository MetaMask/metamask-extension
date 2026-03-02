import { useCallback, useEffect, useState } from 'react';
import type { BridgeToken } from '../../../ducks/bridge/types';

type DateLike = string | null | undefined | Date;
type RWATokenLike = Pick<BridgeToken, 'rwaData'> | undefined;

const toMs = (value: DateLike): number | null => {
  if (!value) {
    return null;
  }

  const ms = new Date(value as string).getTime();
  return Number.isFinite(ms) ? ms : null;
};

const RWA_TIME_TICK_MS = 60_000;

let currentNowMs = Date.now();
let nowMsInterval: ReturnType<typeof setInterval> | null = null;
const listeners = new Set<() => void>();

const emitNowMs = () => {
  currentNowMs = Date.now();
  listeners.forEach((listener) => listener());
};

const subscribeToNowMs = (listener: () => void) => {
  listeners.add(listener);

  if (listeners.size === 1) {
    currentNowMs = Date.now();
    nowMsInterval = setInterval(emitNowMs, RWA_TIME_TICK_MS);
  }

  return () => {
    listeners.delete(listener);

    if (listeners.size === 0 && nowMsInterval) {
      clearInterval(nowMsInterval);
      nowMsInterval = null;
    }
  };
};

const getNowMsSnapshot = () => currentNowMs;

export const isStockToken = (token?: RWATokenLike) =>
  token?.rwaData?.instrumentType === 'stock';

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

export function useRWAToken() {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    return subscribeToNowMs(() => {
      setNowMs(getNowMsSnapshot());
    });
  }, []);

  const isTokenTradingOpen = useCallback(
    (token?: RWATokenLike) => isTokenTradingOpenAt(token, nowMs),
    [nowMs],
  );

  return {
    isStockToken,
    isTokenTradingOpen,
  };
}
