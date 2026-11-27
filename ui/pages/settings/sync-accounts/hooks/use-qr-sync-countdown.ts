import { useEffect, useState } from 'react';

const SECOND_MS = 1000;

/**
 * Remaining whole seconds until `expiresAt`, shared by every surface that
 * renders the same session.
 *
 * @param expiresAt - Absolute expiry timestamp in milliseconds, or null when
 * the session has no deadline yet.
 * @param now - Current timestamp in milliseconds.
 * @returns Remaining seconds, or null when there is no deadline.
 */
export function getQrSyncSecondsLeft(
  expiresAt: number | null | undefined,
  now: number,
): number | null {
  if (typeof expiresAt !== 'number') {
    return null;
  }

  return Math.max(0, Math.ceil((expiresAt - now) / SECOND_MS));
}

/**
 * Milliseconds until the displayed second changes. Surfaces that share
 * `expiresAt` schedule this same delay, so their labels tick together.
 *
 * @param expiresAt - Absolute expiry timestamp in milliseconds.
 * @param now - Current timestamp in milliseconds.
 * @returns Delay until the next displayed second, or 0 when already expired.
 */
function getDelayUntilNextSecond(expiresAt: number, now: number): number {
  const remainingMs = expiresAt - now;
  if (remainingMs <= 0) {
    return 0;
  }

  const remainder = remainingMs % SECOND_MS;
  return remainder === 0 ? SECOND_MS : remainder;
}

/**
 * Countdown for a QR sync deadline. The value is derived from `expiresAt`, not
 * from when this component mounted, so two views of one session stay in step.
 *
 * @param expiresAt - Absolute expiry timestamp in milliseconds, or null.
 * @returns Remaining seconds, or null when there is no deadline.
 */
export function useQrSyncCountdown(
  expiresAt: number | null | undefined,
): number | null {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (typeof expiresAt !== 'number') {
      return undefined;
    }

    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const scheduleNextTick = () => {
      const currentTime = Date.now();
      setNow(currentTime);

      const delay = getDelayUntilNextSecond(expiresAt, currentTime);
      if (delay === 0) {
        return;
      }

      timeoutId = setTimeout(scheduleNextTick, delay);
    };

    scheduleNextTick();

    return () => {
      clearTimeout(timeoutId);
    };
  }, [expiresAt]);

  return getQrSyncSecondsLeft(expiresAt, now);
}
