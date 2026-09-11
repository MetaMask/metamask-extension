import {
  isMoneyAccountUpgradeStepError,
  isTerminalMoneyAccountUpgradeError,
} from '@metamask/money-account-upgrade-controller';
import type { Hex } from '@metamask/utils';

/**
 * Delays between retry attempts. Once the schedule is exhausted the last
 * delay repeats.
 */
const RETRY_DELAYS_MS = [10_000, 20_000, 40_000, 60_000];

export class MoneyAccountUpgradeAbortedError extends Error {
  constructor() {
    super('Money Account upgrade retry aborted');
    this.name = 'MoneyAccountUpgradeAbortedError';
  }
}

export const isMoneyAccountUpgradeAbortedError = (
  error: unknown,
): error is MoneyAccountUpgradeAbortedError =>
  error instanceof Error && error.name === 'MoneyAccountUpgradeAbortedError';

/**
 * Runs the Money Account upgrade sequence, retrying failed attempts with
 * capped exponential backoff (10s, 20s, 40s, then every 60s) until the run
 * succeeds, fails terminally, or is aborted.
 *
 * There is no attempt cap: like mobile, the caller owns the run's lifetime
 * through `signal`, aborting it when the Money surface unmounts. An attempt
 * already in flight is not interrupted by abort; only the backoff wait and
 * further attempts are cancelled.
 *
 * `upgradeAccount` is idempotent and resumable, so a retry only re-runs the
 * steps that have not yet succeeded. Rethrows without further attempts when
 * the failure is terminal (see `isTerminalMoneyAccountUpgradeError`) or is not
 * a step failure at all (e.g. the controller was not bootstrapped).
 *
 * @param upgradeAccount - Runs a single upgrade attempt.
 * @param address - The Money Account address to upgrade.
 * @param options - Retry options.
 * @param options.signal - Aborts the run between attempts.
 * @param options.onRetry - Called with each failure that will be retried and
 * the (1-indexed) attempt that produced it. Failures that end the run are
 * rethrown instead, so between `onRetry` and the returned promise every
 * failure surfaces exactly once. Must not throw.
 */
export async function upgradeAccountWithRetry(
  upgradeAccount: (address: Hex) => Promise<void>,
  address: Hex,
  {
    signal,
    onRetry,
  }: {
    signal?: AbortSignal;
    onRetry?: (error: unknown, attempt: number) => void;
  } = {},
): Promise<void> {
  for (let attempt = 1; ; attempt++) {
    if (signal?.aborted) {
      throw new MoneyAccountUpgradeAbortedError();
    }
    try {
      await upgradeAccount(address);
      return;
    } catch (error) {
      const retryable =
        isMoneyAccountUpgradeStepError(error) &&
        !isTerminalMoneyAccountUpgradeError(error);
      if (!retryable) {
        throw error;
      }
      onRetry?.(error, attempt);
      await waitUnlessAborted(retryDelayMs(attempt), signal);
    }
  }
}

function retryDelayMs(attempt: number): number {
  return RETRY_DELAYS_MS[Math.min(attempt, RETRY_DELAYS_MS.length) - 1];
}

async function waitUnlessAborted(
  durationMs: number,
  signal?: AbortSignal,
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new MoneyAccountUpgradeAbortedError());
      return;
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, durationMs);
    function onAbort(): void {
      clearTimeout(timer);
      reject(new MoneyAccountUpgradeAbortedError());
    }
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}
