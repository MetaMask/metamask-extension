import {
  KeyringTypes,
  type KeyringControllerGetStateAction,
  type KeyringControllerStateChangeEvent,
} from '@metamask/keyring-controller';
import type { Messenger } from '@metamask/messenger';
import type { MoneyAccountUpgradeController } from '@metamask/money-account-upgrade-controller';
import type { NetworkControllerGetStateAction } from '@metamask/network-controller';
import type {
  RemoteFeatureFlagControllerGetStateAction,
  RemoteFeatureFlagControllerStateChangeEvent,
} from '@metamask/remote-feature-flag-controller';
import { createProjectLogger } from '@metamask/utils';
import { isMoneyAccountEnabled } from '../../../../shared/lib/money/feature-flags';
import {
  getMoneyAccountVaultConfig,
  type MoneyAccountVaultConfig,
} from '../../../../shared/lib/money/vault-config';
import { captureException } from '../../../../shared/lib/sentry';
import type { LegacyBackgroundApiServiceAddNetworkAction } from '../../services/legacy-background-api-service-method-action-types';
import {
  createMoneyChainConfigurator,
  type EnsureMoneyChainConfigured,
} from './money-chain-config';

const log = createProjectLogger('money-account-upgrade-service');

const serviceName = 'MoneyAccountUpgradeService';

type MoneyAccountUpgradeAllowedActions =
  | KeyringControllerGetStateAction
  | LegacyBackgroundApiServiceAddNetworkAction
  | NetworkControllerGetStateAction
  | RemoteFeatureFlagControllerGetStateAction;

type MoneyAccountUpgradeAllowedEvents =
  | KeyringControllerStateChangeEvent
  | RemoteFeatureFlagControllerStateChangeEvent;

export type MoneyAccountUpgradeServiceMessenger = Messenger<
  typeof serviceName,
  MoneyAccountUpgradeAllowedActions,
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
 * Owns the `MoneyAccountUpgradeController` bootstrap.
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
 */
export class MoneyAccountUpgradeService {
  readonly name: typeof serviceName = serviceName;

  readonly #messenger: MoneyAccountUpgradeServiceMessenger;

  readonly #upgradeController: MoneyAccountUpgradeController;

  readonly #ensureChainConfigured: EnsureMoneyChainConfigured;

  #bootstrap?: Promise<void>;

  #bootstrappedConfig?: MoneyAccountVaultConfig;

  #missingConfigReported = false;

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

    const onTrigger = () => this.#sync();
    this.#messenger.subscribe(
      'RemoteFeatureFlagController:stateChange',
      onTrigger,
    );
    this.#messenger.subscribe('KeyringController:stateChange', onTrigger);
    onTrigger();
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
