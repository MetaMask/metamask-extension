import { useCallback, useEffect, useRef } from 'react';
import { readRewardsMoneyHttpFailure } from './read-rewards-money-http-failure';

/**
 * Longest `Retry-After` this hook waits out. The data service retries at most
 * 5 seconds, so a statement timeout's 30 arrives here without that retry.
 * Anything longer is left alone.
 */
const BUSY_REFETCH_MAX_SECONDS = 30;

/** Spread refetches so a slow-query spike does not return in the same second. */
const BUSY_REFETCH_JITTER_MS = 1000;

/** 0..BUSY_REFETCH_JITTER_MS inclusive. Jitter only, not a secret. */
function busyRefetchJitterMs(): number {
  const values = new Uint32Array(1);
  globalThis.crypto.getRandomValues(values);
  return values[0] % (BUSY_REFETCH_JITTER_MS + 1);
}

/**
 * Schedules one refetch for a busy read. A `Retry-After` of 5 seconds or less
 * has already been retried once inside the data service. A statement timeout's
 * 30 has not, so this wait is its first. The timer adds up to a second of
 * jitter. A newer fetch or unmount cancels it, and the follow-up itself must
 * not arm another.
 *
 * @returns `cancel` to drop a pending timer, and `arm` to schedule one refetch.
 */
export function useOneShotBusyRefetch(): {
  cancel: () => void;
  arm: (error: unknown, refetch: () => void) => void;
} {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancel = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => cancel, [cancel]);

  const arm = useCallback(
    (error: unknown, refetch: () => void) => {
      cancel();
      const failure = readRewardsMoneyHttpFailure(error);
      if (failure.status !== 429 && failure.status !== 503) {
        return;
      }
      const waitSeconds = failure.retryAfterSeconds;
      if (waitSeconds === undefined || waitSeconds > BUSY_REFETCH_MAX_SECONDS) {
        return;
      }
      timerRef.current = setTimeout(
        () => {
          timerRef.current = null;
          refetch();
        },
        waitSeconds * 1000 + busyRefetchJitterMs(),
      );
    },
    [cancel],
  );

  return { cancel, arm };
}
