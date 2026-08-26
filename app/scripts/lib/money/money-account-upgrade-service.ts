import type { KeyringControllerWithKeyringUnsafeAction } from '@metamask/keyring-controller';
import type { Messenger } from '@metamask/messenger';
import {
  isMoneyAccountUpgradeStepError,
  type MoneyAccountUpgradeController,
} from '@metamask/money-account-upgrade-controller';
import { createProjectLogger, type Hex } from '@metamask/utils';
import { captureException } from '../../../../shared/lib/sentry';
import { deriveMoneyAccountAddress } from './get-money-account-address';
import { upgradeAccountWithRetry } from './upgrade-account-with-retry';

const log = createProjectLogger('money-account-upgrade-service');

const serviceName = 'MoneyAccountUpgradeService';

const SENTRY_FEATURE_TAG = 'money-account-upgrade';

/**
 * How many retried failures one run reports to Sentry. The final failure that
 * ends the run is always reported; this only caps the intermediate ones, so a
 * long outage doesn't produce one report per backoff attempt.
 */
const MAX_REPORTED_RETRIED_FAILURES = 3;

/**
 * The message `MoneyAccountUpgradeController.upgradeAccount` rejects with when
 * no bootstrap has armed a config (flag off, wallet locked, or the last
 * bootstrap failed). The controller does not export a typed error for it.
 */
const NOT_BOOTSTRAPPED_MESSAGE =
  'MoneyAccountUpgradeController is not bootstrapped';

type MoneyAccountUpgradeAllowedActions =
  KeyringControllerWithKeyringUnsafeAction;

/**
 * The action UI clients use to kick off an upgrade of the primary money
 * account, e.g. when a Money surface opens.
 */
export type MoneyAccountUpgradeServiceTriggerUpgradeAction = {
  type: `${typeof serviceName}:triggerUpgrade`;
  handler: MoneyAccountUpgradeService['triggerUpgrade'];
};

export type MoneyAccountUpgradeServiceMessenger = Messenger<
  typeof serviceName,
  | MoneyAccountUpgradeServiceTriggerUpgradeAction
  | MoneyAccountUpgradeAllowedActions,
  never
>;

/**
 * Drives Money Account upgrades off user intent.
 *
 * Opening a Money surface is the user's signal of intent to use the feature,
 * so the UI fires `MoneyAccountUpgradeService:triggerUpgrade` on those
 * surfaces (mirroring mobile's focus-driven upgrade). Unlike mobile — where
 * the retry loop lives in the UI and is aborted on blur — the whole run lives
 * here in the background, so it survives the popup closing; in exchange the
 * retries are capped rather than unbounded, and a capped-out address is
 * re-armed by the next trigger. The upgraded address is derived from the seed
 * here rather than trusted from the UI.
 *
 * The bootstrap itself (config resolution, flag and keyring gating) belongs to
 * the `MoneyAccountUpgradeController`; this service only nudges it to re-sync
 * so a bootstrap that failed on a transient CHOMP outage heals on the next
 * surface open rather than on the next flag or keyring event.
 */
export class MoneyAccountUpgradeService {
  readonly name: typeof serviceName = serviceName;

  readonly #messenger: MoneyAccountUpgradeServiceMessenger;

  readonly #upgradeController: MoneyAccountUpgradeController;

  readonly #upgradesInFlight = new Map<Hex, Promise<void>>();

  constructor({
    messenger,
    upgradeController,
  }: {
    messenger: MoneyAccountUpgradeServiceMessenger;
    upgradeController: MoneyAccountUpgradeController;
  }) {
    this.#messenger = messenger;
    this.#upgradeController = upgradeController;

    this.#messenger.registerMethodActionHandlers(this, ['triggerUpgrade']);
  }

  /**
   * Kick off an upgrade of the primary money account.
   *
   * Fire-and-forget: the run — bootstrap re-sync, address derivation, and the
   * retry loop — continues in the background after this returns, so a closing
   * popup doesn't cut it short and the UI never awaits a minutes-long retry.
   * A trigger while a run for the same address is in flight is a no-op; a
   * trigger after a failed or capped-out run starts a fresh one. A completed
   * upgrade is a cheap no-op inside the controller (fingerprinted per
   * address), so re-triggering on every surface open is fine.
   */
  triggerUpgrade(): void {
    // `#runUpgrade` handles its own failures; the catch only keeps this
    // method synchronous-safe.
    this.#runUpgrade().catch(() => undefined);
  }

  async #runUpgrade(): Promise<void> {
    // Give a previously failed bootstrap the chance to re-arm off this user
    // signal rather than waiting for the next flag or keyring event.
    // `upgradeAccount` waits for any bootstrap this schedules.
    this.#upgradeController.sync();

    let address: Hex;
    try {
      address = (
        await deriveMoneyAccountAddress(this.#messenger)
      ).toLowerCase() as Hex;
    } catch (error) {
      // A lock between the trigger and the derivation lands here; the next
      // surface open retries.
      log('Upgrade skipped: could not derive the money account address', error);
      return;
    }

    if (this.#upgradesInFlight.has(address)) {
      return;
    }

    const run = this.#upgradeWithReporting(address);
    this.#upgradesInFlight.set(address, run);

    try {
      await run;
    } finally {
      this.#upgradesInFlight.delete(address);
    }
  }

  async #upgradeWithReporting(address: Hex): Promise<void> {
    let reportedRetries = 0;

    const onRetry = (error: unknown, attempt: number) => {
      log('Upgrade attempt failed; will retry', { address, attempt }, error);

      if (reportedRetries < MAX_REPORTED_RETRIED_FAILURES) {
        reportedRetries += 1;
        this.#reportUpgradeError(error, {
          attempt,
          willRetry: true,
          furtherRetryReportsSuppressed:
            reportedRetries === MAX_REPORTED_RETRIED_FAILURES,
        });
      }
    };

    try {
      await upgradeAccountWithRetry(
        (upgradeAddress) =>
          this.#upgradeController.upgradeAccount(upgradeAddress),
        address,
        { onRetry },
      );
      log('Upgrade complete', address);
    } catch (error) {
      if (isNotBootstrappedError(error)) {
        // Flag off, locked, or a bootstrap failure the controller has already
        // reported; the next surface open retries.
        log('Upgrade skipped: controller not bootstrapped', address);
        return;
      }
      log('Upgrade failed', address, error);
      this.#reportUpgradeError(error, { willRetry: false });
    }
  }

  #reportUpgradeError(
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
}

function isNotBootstrappedError(error: unknown): boolean {
  return (
    error instanceof Error && error.message.startsWith(NOT_BOOTSTRAPPED_MESSAGE)
  );
}
