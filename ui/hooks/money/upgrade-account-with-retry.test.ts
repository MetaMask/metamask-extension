import {
  MoneyAccountUpgradeStepError,
  TerminalUpgradeError,
} from '@metamask/money-account-upgrade-controller';
import type { Hex } from '@metamask/utils';
import { upgradeAccountWithRetry } from './upgrade-account-with-retry';

const ABORTED_MESSAGE = 'Money Account upgrade retry aborted';

const ADDRESS = '0xd5fe9b0579443e7025cf3309ba420977710e7183' as Hex;

const retryableError = () =>
  new MoneyAccountUpgradeStepError('associate-address', new Error('offline'));

const terminalError = () =>
  new MoneyAccountUpgradeStepError(
    'eip-7702-authorization',
    new TerminalUpgradeError('delegated elsewhere'),
  );

/**
 * Flush microtasks and run any due timers until the given promise settles.
 *
 * @param promise - The promise to settle.
 * @returns The promise's outcome.
 */
async function settle(promise: Promise<void>): Promise<void> {
  let outcome: { error?: unknown } | undefined;
  promise.then(
    () => {
      outcome = {};
    },
    (error) => {
      outcome = { error };
    },
  );

  const pending = () => outcome === undefined;
  while (pending()) {
    await jest.runAllTimersAsync();
  }

  if (outcome?.error !== undefined) {
    throw outcome.error;
  }
}

describe('upgradeAccountWithRetry', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('resolves on first success without retrying', async () => {
    const upgradeAccount = jest.fn().mockResolvedValue(undefined);
    const onRetry = jest.fn();

    await settle(upgradeAccountWithRetry(upgradeAccount, ADDRESS, { onRetry }));

    expect(upgradeAccount).toHaveBeenCalledTimes(1);
    expect(upgradeAccount).toHaveBeenCalledWith(ADDRESS);
    expect(onRetry).not.toHaveBeenCalled();
  });

  it('retries a step failure and reports it to onRetry', async () => {
    const error = retryableError();
    const upgradeAccount = jest
      .fn()
      .mockRejectedValueOnce(error)
      .mockResolvedValue(undefined);
    const onRetry = jest.fn();

    await settle(upgradeAccountWithRetry(upgradeAccount, ADDRESS, { onRetry }));

    expect(upgradeAccount).toHaveBeenCalledTimes(2);
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRetry).toHaveBeenCalledWith(error, 1);
  });

  it('rethrows a terminal step failure without retrying', async () => {
    const error = terminalError();
    const upgradeAccount = jest.fn().mockRejectedValue(error);
    const onRetry = jest.fn();

    await expect(
      settle(upgradeAccountWithRetry(upgradeAccount, ADDRESS, { onRetry })),
    ).rejects.toBe(error);
    expect(upgradeAccount).toHaveBeenCalledTimes(1);
    expect(onRetry).not.toHaveBeenCalled();
  });

  it('rethrows a non-step failure without retrying', async () => {
    const error = new Error(
      'MoneyAccountUpgradeController is not bootstrapped',
    );
    const upgradeAccount = jest.fn().mockRejectedValue(error);

    await expect(
      settle(upgradeAccountWithRetry(upgradeAccount, ADDRESS)),
    ).rejects.toBe(error);
    expect(upgradeAccount).toHaveBeenCalledTimes(1);
  });

  it('backs off 10s, 20s, 40s, then 60s repeating', async () => {
    const setTimeoutSpy = jest.spyOn(global, 'setTimeout');
    const abortController = new AbortController();
    const upgradeAccount = jest.fn().mockImplementation(() => {
      if (upgradeAccount.mock.calls.length === 7) {
        abortController.abort();
      }
      return Promise.reject(retryableError());
    });

    await expect(
      settle(
        upgradeAccountWithRetry(upgradeAccount, ADDRESS, {
          signal: abortController.signal,
        }),
      ),
    ).rejects.toThrow(ABORTED_MESSAGE);

    const delays = setTimeoutSpy.mock.calls.map((call: unknown[]) => call[1]);
    expect(delays).toStrictEqual([
      10_000, 20_000, 40_000, 60_000, 60_000, 60_000,
    ]);
  });

  it('stops during the backoff wait when aborted', async () => {
    const abortController = new AbortController();
    const upgradeAccount = jest
      .fn()
      .mockImplementation(() => Promise.reject(retryableError()));

    const run = upgradeAccountWithRetry(upgradeAccount, ADDRESS, {
      signal: abortController.signal,
    });
    const settled = expect(run).rejects.toThrow(ABORTED_MESSAGE);

    await jest.advanceTimersByTimeAsync(5_000);
    abortController.abort();

    await settled;
    expect(upgradeAccount).toHaveBeenCalledTimes(1);
  });

  it('does not start an attempt when already aborted', async () => {
    const abortController = new AbortController();
    abortController.abort();
    const upgradeAccount = jest.fn().mockResolvedValue(undefined);

    await expect(
      settle(
        upgradeAccountWithRetry(upgradeAccount, ADDRESS, {
          signal: abortController.signal,
        }),
      ),
    ).rejects.toThrow(ABORTED_MESSAGE);
    expect(upgradeAccount).not.toHaveBeenCalled();
  });
});
