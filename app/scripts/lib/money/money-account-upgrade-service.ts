import {
  KeyringTypes,
  type KeyringControllerGetStateAction,
  type KeyringControllerStateChangeEvent,
  type KeyringControllerWithKeyringUnsafeAction,
} from '@metamask/keyring-controller';
import type { Messenger } from '@metamask/messenger';
import {
  isMoneyAccountUpgradeStepError,
  type MoneyAccountUpgradeController,
} from '@metamask/money-account-upgrade-controller';
import type { NetworkControllerGetStateAction } from '@metamask/network-controller';
import type {
  RemoteFeatureFlagControllerGetStateAction,
  RemoteFeatureFlagControllerStateChangeEvent,
} from '@metamask/remote-feature-flag-controller';
import { createProjectLogger, type Hex } from '@metamask/utils';
import { isMoneyAccountEnabled } from '../../../../shared/lib/money/feature-flags';
import {
  getMoneyAccountVaultConfig,
  type MoneyAccountVaultConfig,
} from '../../../../shared/lib/money/vault-config';
import { captureException } from '../../../../shared/lib/sentry';
import type { LegacyBackgroundApiServiceAddNetworkAction } from '../../services/legacy-background-api-service-method-action-types';
import { deriveMoneyAccountAddress } from './get-money-account-address';
import {
  createMoneyChainConfigurator,
  type EnsureMoneyChainConfigured,
} from './money-chain-config';
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

type MoneyAccountUpgradeAllowedActions =
  | KeyringControllerGetStateAction
  | KeyringControllerWithKeyringUnsafeAction
  | LegacyBackgroundApiServiceAddNetworkAction
  | NetworkControllerGetStateAction
  | RemoteFeatureFlagControllerGetStateAction;

type MoneyAccountUpgradeAllowedEvents =
  | KeyringControllerStateChangeEvent
  | RemoteFeatureFlagControllerStateChangeEvent;

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
  MoneyAccountUpgradeAllowedEvents
>;

/**
 * Whether two vault configs would produce the same upgrade setup.
 *
 * Every field is compared, not just the two the upgrade controller consumes
 * (`chainId` and `boringVault`): the others feed the upgrade config
 * fingerprint indirectly through CHOMP, so a fresher flag payload that changes
 * any of them is treated as a new config and re-runs the bootstrap.
 *
 * @param a - One vault config.
 * @param b - The other vault config.
 * @returns Whether the configs are equal.
 */
const configsEqual = (
  a: MoneyAccountVaultConfig,
  b: MoneyAccountVaultConfig,
): boolean =>
  a.chainId === b.chainId &&
  a.boringVault === b.boringVault &&
  a.tellerAddress === b.tellerAddress &&
  a.accountantAddress === b.accountantAddress &&
  a.lensAddress === b.lensAddress &&
  a.underlyingToken === b.underlyingToken;

/**
 * Owns the `MoneyAccountUpgradeController` bootstrap and drives account
 * upgrades.
 *
 * ## Bootstrap
 *
 * The controller's `init()` resolves the upgrade config — Delegation Framework
 * contracts plus CHOMP service details, a network call — and must run before
 * any account can be upgraded. This service runs it as soon as the
 * `moneyEnableMoneyAccount` flag is on, the wallet is unlocked with an HD
 * keyring in state, and the `moneyAccountVaultConfig` flag is served, and
 * re-runs it when that vault config genuinely changes.
 *
 * The keyring-side trigger is `KeyringController:stateChange`, not `:unlock`,
 * for the same vault-restore ordering reason documented on
 * `MoneyAccountControllerInit`: during a restore, `:unlock` fires while the
 * keyring list is still empty.
 *
 * Bootstraps are serialized: a config change chains onto whatever run is in
 * flight, and a failed run (e.g. a transient CHOMP outage) is forgotten so the
 * next flag or keyring trigger retries rather than staying broken until the
 * next background restart. `init()` is idempotent, so re-running is safe.
 *
 * ## Upgrades
 *
 * Opening a Money surface is the user's signal of intent to use the feature,
 * so the UI fires `MoneyAccountUpgradeService:triggerUpgrade` on those
 * surfaces (mirroring mobile's focus-driven upgrade). Unlike mobile — where
 * the retry loop lives in the UI and is aborted on blur — the whole run lives
 * here in the background, so it survives the popup closing; in exchange the
 * retries are capped rather than unbounded, and a capped-out address is
 * re-armed by the next trigger. The upgraded address is derived from the seed
 * here rather than trusted from the UI.
 */
export class MoneyAccountUpgradeService {
  readonly name: typeof serviceName = serviceName;

  readonly #messenger: MoneyAccountUpgradeServiceMessenger;

  readonly #upgradeController: MoneyAccountUpgradeController;

  readonly #ensureChainConfigured: EnsureMoneyChainConfigured;

  #bootstrap?: Promise<void>;

  #bootstrappedConfig?: MoneyAccountVaultConfig;

  #missingConfigReported = false;

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
    this.#ensureChainConfigured = createMoneyChainConfigurator(messenger);

    this.#messenger.registerMethodActionHandlers(this, ['triggerUpgrade']);

    const onTrigger = () => this.#sync();
    this.#messenger.subscribe(
      'RemoteFeatureFlagController:stateChange',
      onTrigger,
    );
    this.#messenger.subscribe('KeyringController:stateChange', onTrigger);
    onTrigger();
  }

  /**
   * Kick off an upgrade of the primary money account.
   *
   * Fire-and-forget: the run — bootstrap gate, address derivation, and the
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
    // Give a previously failed (and forgotten) bootstrap the chance to
    // re-arm off this user signal rather than waiting for the next flag or
    // keyring event.
    this.#sync();

    const bootstrap = this.#bootstrap;
    if (!bootstrap) {
      log('Upgrade skipped: bootstrap not scheduled (flag off or locked)');
      return;
    }

    try {
      await bootstrap;
    } catch {
      // Already reported by the bootstrap's own failure handling.
      log('Upgrade skipped: bootstrap failed');
      return;
    }

    let address: Hex;
    try {
      address = (await deriveMoneyAccountAddress(
        this.#messenger,
      )).toLowerCase() as Hex;
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
        ...(isMoneyAccountUpgradeStepError(error)
          ? { step: error.step }
          : {}),
      },
      extra,
    });
  }

  #sync(): void {
    try {
      const { remoteFeatureFlags } = this.#messenger.call(
        'RemoteFeatureFlagController:getState',
      );
      if (!isMoneyAccountEnabled(remoteFeatureFlags)) {
        return;
      }

      const { isUnlocked, keyrings } = this.#messenger.call(
        'KeyringController:getState',
      );
      if (
        !isUnlocked ||
        !keyrings.some((keyring) => keyring.type === KeyringTypes.hd)
      ) {
        return;
      }

      const vaultConfig = getMoneyAccountVaultConfig(remoteFeatureFlags);
      if (!vaultConfig) {
        this.#reportMissingConfig();
        return;
      }

      if (
        this.#bootstrappedConfig &&
        configsEqual(vaultConfig, this.#bootstrappedConfig)
      ) {
        return;
      }

      this.#scheduleBootstrap(vaultConfig);
    } catch (error) {
      // A failure here must not take the background down with it; the next
      // keyring state change or remote-flag refresh retries.
      log('Failed to sync the money account upgrade bootstrap', error);
    }
  }

  #scheduleBootstrap(vaultConfig: MoneyAccountVaultConfig): void {
    this.#bootstrappedConfig = vaultConfig;

    const run = async () => {
      await this.#ensureChainConfigured(vaultConfig);
      await this.#upgradeController.init({
        chainId: vaultConfig.chainId,
        boringVaultAddress: vaultConfig.boringVault,
      });
    };

    const bootstrap = this.#bootstrap
      ? this.#bootstrap.catch(() => undefined).then(run)
      : run();
    this.#bootstrap = bootstrap;

    bootstrap.catch((error) => {
      log('Failed to bootstrap the money account upgrade', error);

      // Only forgotten if no newer config has been scheduled meanwhile: a
      // newer config supersedes this run, success or failure.
      if (this.#bootstrappedConfig === vaultConfig) {
        this.#bootstrappedConfig = undefined;
      }
    });
  }

  /**
   * Report a served `moneyEnableMoneyAccount` flag without a usable
   * `moneyAccountVaultConfig` — a flag misconfiguration that silently disables
   * upgrades. Reported to Sentry once per background lifetime; flag refreshes
   * arrive continuously and would otherwise spam.
   */
  #reportMissingConfig(): void {
    log('Money Account vault configuration is unavailable');

    if (!this.#missingConfigReported) {
      this.#missingConfigReported = true;
      captureException(
        new Error(
          'Money Account upgrade bootstrap skipped: vault configuration is unavailable',
        ),
      );
    }
  }
}
