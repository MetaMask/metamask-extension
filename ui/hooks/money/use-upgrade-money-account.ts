import { useEffect } from 'react';
import log from 'loglevel';
import { isMoneyAccountUpgradeStepError } from '@metamask/money-account-upgrade-controller';
import { hasProperty, isObject, type Hex } from '@metamask/utils';
import { captureException } from '../../../shared/lib/sentry';
import { submitRequestToBackground } from '../../store/background-connection';
import {
  isMoneyAccountUpgradeAbortedError,
  upgradeAccountWithRetry,
} from './upgrade-account-with-retry';
import { useMoneyAccountAvailability } from './use-money-account-availability';

const UPGRADE_ACCOUNT_ACTION = 'MoneyAccountUpgradeController:upgradeAccount';

const SENTRY_FEATURE_TAG = 'money-account-upgrade';

/**
 * How many retried failures one run reports to Sentry. The final failure that
 * ends the run is always reported; this only caps the intermediate ones, so an
 * unbounded retry loop can't flood Sentry during an outage.
 */
const MAX_REPORTED_RETRIED_FAILURES = 3;

/**
 * The message `MoneyAccountUpgradeController.upgradeAccount` rejects with when
 * no bootstrap has armed a config (flag off, wallet locked, or the last
 * bootstrap failed). The controller does not export a typed error for it.
 */
const NOT_BOOTSTRAPPED_MESSAGE =
  'MoneyAccountUpgradeController is not bootstrapped';

type InFlightUpgrade = {
  takeoverSignal?: AbortSignal;
};

const upgradesInFlight = new Map<Hex, InFlightUpgrade>();

/**
 * Attempts the Money Account upgrade while a Money surface is mounted, and
 * stops retrying when it unmounts. This is the extension analog of mobile's
 * focus-driven upgrade: the retry loop lives here in the UI and is aborted on
 * unmount, so nothing is left running once the user leaves the surface.
 *
 * Each attempt is a single call into the background controller, which
 * completes even if the popup closes mid-attempt; only the backoff wait and
 * further attempts are lost. Because `upgradeAccount` is idempotent and
 * resumable, the next surface open simply picks up where it left off.
 * Accounts already recorded as upgraded make this a no-op in the controller.
 *
 * The run starts once the Money Account is available and its address known;
 * while it is not (flag off, locked, geo-blocked) nothing is called.
 */
export function useUpgradeMoneyAccount() {
  const { availability } = useMoneyAccountAvailability();
  const address = availability.isAvailable ? availability.address : undefined;

  useEffect(() => {
    if (!address) {
      return undefined;
    }

    const abortController = new AbortController();
    startUpgradeRun(address.toLowerCase() as Hex, abortController.signal);
    return () => abortController.abort();
  }, [address]);
}

function startUpgradeRun(address: Hex, signal: AbortSignal): void {
  const inFlight = upgradesInFlight.get(address);
  if (inFlight) {
    // A second surface mounted while the first is still retrying. If the
    // first run ends by abort (its surface unmounting), the run restarts
    // under this signal so the still-mounted surface keeps it alive.
    inFlight.takeoverSignal = signal;
    return;
  }

  const entry: InFlightUpgrade = {};
  upgradesInFlight.set(address, entry);
  let endedByAbort = false;

  runUpgrade(address, signal)
    .catch((error: unknown) => {
      if (isMoneyAccountUpgradeAbortedError(error)) {
        endedByAbort = true;
        log.debug('Money account upgrade aborted', address);
        return;
      }
      if (isNotBootstrappedError(error)) {
        // Flag off, locked, or a bootstrap failure the background has already
        // reported; the next surface open retries.
        log.debug('Money account upgrade skipped: not bootstrapped', address);
        return;
      }
      log.debug('Money account upgrade failed', address, error);
      reportUpgradeError(error, { willRetry: false });
    })
    .finally(() => {
      upgradesInFlight.delete(address);
      const { takeoverSignal } = entry;
      if (endedByAbort && takeoverSignal && !takeoverSignal.aborted) {
        startUpgradeRun(address, takeoverSignal);
      }
    });
}

async function runUpgrade(address: Hex, signal: AbortSignal): Promise<void> {
  let reportedRetries = 0;

  await upgradeAccountWithRetry(upgradeAccountInBackground, address, {
    signal,
    onRetry: (error, attempt) => {
      log.debug('Money account upgrade attempt failed; will retry', {
        address,
        attempt,
      });
      if (reportedRetries < MAX_REPORTED_RETRIED_FAILURES) {
        reportedRetries += 1;
        reportUpgradeError(error, {
          attempt,
          willRetry: true,
          furtherRetryReportsSuppressed:
            reportedRetries === MAX_REPORTED_RETRIED_FAILURES,
        });
      }
    },
  });
}

async function upgradeAccountInBackground(address: Hex): Promise<void> {
  try {
    await submitRequestToBackground<void>('messengerCall', [
      UPGRADE_ACCOUNT_ACTION,
      [address],
    ]);
  } catch (error) {
    throw restoreBackgroundError(error);
  }
}

/**
 * Errors thrown in the background reach the UI as a `JsonRpcError` whose
 * `data.cause` holds the original error's own enumerable properties. A
 * `MoneyAccountUpgradeStepError` therefore arrives with its `name`, `step`
 * and `terminal` fields intact but on the wrong object, so this rebuilds an
 * `Error` shaped for the package's structural type guards. Anything else is
 * returned as received.
 *
 * @param error - The error rejected by `submitRequestToBackground`.
 * @returns The step error as the controller threw it, or the original error.
 */
function restoreBackgroundError(error: unknown): unknown {
  if (
    !isObject(error) ||
    !hasProperty(error, 'data') ||
    !isObject(error.data) ||
    !hasProperty(error.data, 'cause') ||
    !isObject(error.data.cause)
  ) {
    return error;
  }

  const { cause } = error.data;
  const restored = Object.assign(new Error(String(cause.message)), cause);
  return isMoneyAccountUpgradeStepError(restored) ? restored : error;
}

function isNotBootstrappedError(error: unknown): boolean {
  return (
    error instanceof Error && error.message.startsWith(NOT_BOOTSTRAPPED_MESSAGE)
  );
}

function reportUpgradeError(
  error: unknown,
  extra: {
    attempt?: number;
    willRetry: boolean;
    furtherRetryReportsSuppressed?: boolean;
  },
): void {
  captureException(error, {
    tags: {
      feature: SENTRY_FEATURE_TAG,
      ...(isMoneyAccountUpgradeStepError(error) ? { step: error.step } : {}),
    },
    extra,
  });
}
