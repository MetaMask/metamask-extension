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
import type {
  OnboardingControllerGetStateAction,
  OnboardingControllerStateChangeEvent,
} from '../../controllers/onboarding';
import type {
  PreferencesControllerGetStateAction,
  PreferencesControllerStateChangeEvent,
} from '../../controllers/preferences-controller';
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
  | OnboardingControllerGetStateAction
  | PreferencesControllerGetStateAction
  | RemoteFeatureFlagControllerGetStateAction;

type MoneyAccountUpgradeAllowedEvents =
  | KeyringControllerStateChangeEvent
  | OnboardingControllerStateChangeEvent
  | PreferencesControllerStateChangeEvent
  | RemoteFeatureFlagControllerStateChangeEvent;

export type MoneyAccountUpgradeServiceMessenger = Messenger<
  typeof serviceName,
  MoneyAccountUpgradeAllowedActions,
  MoneyAccountUpgradeAllowedEvents
>;

/**
 * Compares vault configs, if anything doesn’t match this tells
 * us that we’ll need to re-run the upgrade bootstrap
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
 * This service runs the init when
 * 1. Onboarding is complete with basic functionality enabled
 * 2. the moneyEnableMoneyAccount flag is on
 * 3. The wallet is unlocked
 * 4. The moneyAccountVaultConfig flag is served
 *
 * We then re-run the init if the vault config ever changes.
 *
 * The bootstrap awaits chain configuration before calling out to Chomp, so
 * gates 1–3 are re-checked immediately before `init()`: a lock or a Basic
 * Functionality opt-out during that window must not still produce an external
 * call. A skipped bootstrap is forgotten so it re-runs when the gates reopen.
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
    this.#messenger.subscribe('OnboardingController:stateChange', onTrigger);
    this.#messenger.subscribe('PreferencesController:stateChange', onTrigger);
    onTrigger();
  }

  #sync(): void {
    try {
      if (!this.#areGatesOpen()) {
        return;
      }

      const { remoteFeatureFlags } = this.#messenger.call(
        'RemoteFeatureFlagController:getState',
      );
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

  #areExternalServicesAllowed(): boolean {
    const { completedOnboarding } = this.#messenger.call(
      'OnboardingController:getState',
    );
    const { useExternalServices } = this.#messenger.call(
      'PreferencesController:getState',
    );

    return completedOnboarding && Boolean(useExternalServices);
  }

  /**
   * Whether the synchronous bootstrap gates are open right now: onboarding
   * complete with basic functionality enabled, the feature flag on, and the
   * wallet unlocked with an HD keyring. Re-read from live state on every call
   * because the bootstrap re-validates them across its `await` points.
   *
   * @returns Whether the bootstrap may proceed.
   */
  #areGatesOpen(): boolean {
    if (!this.#areExternalServicesAllowed()) {
      return false;
    }

    const { remoteFeatureFlags } = this.#messenger.call(
      'RemoteFeatureFlagController:getState',
    );
    if (!isMoneyAccountEnabled(remoteFeatureFlags)) {
      return false;
    }

    const { isUnlocked, keyrings } = this.#messenger.call(
      'KeyringController:getState',
    );
    return (
      isUnlocked && keyrings.some((keyring) => keyring.type === KeyringTypes.hd)
    );
  }

  #scheduleBootstrap(vaultConfig: MoneyAccountVaultConfig): void {
    this.#bootstrappedConfig = vaultConfig;

    const run = async () => {
      // The gates were checked when this run was scheduled, but it may start
      // much later, chained behind an in-flight bootstrap.
      if (!this.#areGatesOpen()) {
        this.#forget(vaultConfig);
        return;
      }

      await this.#ensureChainConfigured(vaultConfig);

      // Configuring the chain can suspend for a while, so re-check the gates
      // before the external Chomp call inside `init()`.
      if (!this.#areGatesOpen()) {
        this.#forget(vaultConfig);
        return;
      }

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
      this.#forget(vaultConfig);
    });
  }

  /**
   * Forget a scheduled bootstrap that was skipped or failed, so the next
   * trigger re-runs it — but only if no newer config has been scheduled
   * meanwhile: a newer config supersedes this run, success or failure.
   *
   * @param vaultConfig - The config the abandoned run was scheduled with.
   */
  #forget(vaultConfig: MoneyAccountVaultConfig): void {
    if (this.#bootstrappedConfig === vaultConfig) {
      this.#bootstrappedConfig = undefined;
    }
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
