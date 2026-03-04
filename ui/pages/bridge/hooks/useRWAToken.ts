import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import type { BridgeToken } from '../../../ducks/bridge/types';
import { getIsRWATokensEnabled } from '../../../selectors/rwa/feature-flags';

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

const isTokenTradingOpenAt = (
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
  const isRWAEnabled = useSelector(getIsRWATokensEnabled);
  const [nowMs, setNowMs] = useState(Date.now);

  useEffect(() => {
    if (!isRWAEnabled) {
      return undefined;
    }
    const id = setInterval(() => setNowMs(Date.now()), RWA_TIME_TICK_MS);
    return () => clearInterval(id);
  }, [isRWAEnabled]);

  const isStockTokenFlagGated = useCallback(
    (token?: RWATokenLike) =>
      isRWAEnabled && token?.rwaData?.instrumentType === 'stock',
    [isRWAEnabled],
  );

  const isTokenTradingOpen = useCallback(
    (token?: RWATokenLike) => {
      if (!isRWAEnabled) {
        return true;
      }
      return isTokenTradingOpenAt(token, nowMs);
    },
    [isRWAEnabled, nowMs],
  );

  return {
    isStockToken: isStockTokenFlagGated,
    isTokenTradingOpen,
  };
}
