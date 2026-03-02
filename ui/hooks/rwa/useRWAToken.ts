import { useCallback } from 'react';
import { selectRWAEnabledFlag } from '../../selectors/rwa';
import { useSelector } from 'react-redux';
import { BridgeToken } from '../../ducks/bridge/types';

export type DateLike = string | null | undefined | Date;

function toMs(v: DateLike): number | null {
  if (!v) return null;
  const ms = new Date(v as string).getTime();
  return Number.isFinite(ms) ? ms : null;
}

export function useRWAToken() {
  // Check remote feature flag for RWA token enablement
  const isRWAEnabled = useSelector(selectRWAEnabledFlag);

  // TODO: Borrowed isRwaTokenTradable function from crosschain API src/utils/tokens.ts file.
  // To be removed once `isOpen` flag is also available from token API
  /**
   * Checks if the token is trading open
   * @returns {boolean} - True if the token is trading open, false otherwise
   */
  const isTokenTradingOpen = useCallback(
    (token?: BridgeToken) => {
      if (!isRWAEnabled || !token?.rwaData) {
        return true;
      }
      const nextOpenMs = toMs(token?.rwaData?.market?.nextOpen);
      const nextCloseMs = toMs(token?.rwaData?.market?.nextClose);
      if (nextOpenMs == null || nextCloseMs == null) return false;

      const nowMs = new Date().getTime();

      let marketIsOpen;
      if (nextCloseMs > nextOpenMs) {
        marketIsOpen = nowMs >= nextOpenMs && nowMs < nextCloseMs;
      } else {
        marketIsOpen = nowMs < nextCloseMs || nowMs >= nextOpenMs;
      }

      const pauseStartMs = toMs(token?.rwaData?.nextPause?.start);
      const pauseEndMs = toMs(token?.rwaData?.nextPause?.end);

      const inPause =
        (pauseStartMs != null &&
          nowMs >= pauseStartMs &&
          (pauseEndMs == null || nowMs < pauseEndMs)) ||
        (pauseStartMs == null && pauseEndMs != null && nowMs < pauseEndMs);

      return marketIsOpen && !inPause;
    },
    [isRWAEnabled],
  );

  /**
   * Checks if the token is a stock token
   * @returns {boolean} - True if the token is a stock token, false otherwise
   */
  const isStockToken = useCallback(
    (token?: BridgeToken) => {
      // If RWA is not enabled, always return false
      if (!isRWAEnabled) {
        return false;
      }

      return Boolean(token?.rwaData?.instrumentType === 'stock');
    },
    [isRWAEnabled],
  );

  return {
    isStockToken,
    isTokenTradingOpen,
  };
}
