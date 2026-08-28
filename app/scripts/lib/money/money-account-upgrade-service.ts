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
      if (!this.#areExternalServicesAllowed()) {
        return;
      }

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

  #areExternalServicesAllowed(): boolean {
    const { completedOnboarding } = this.#messenger.call(
      'OnboardingController:getState',
    );
    const { useExternalServices } = this.#messenger.call(
      'PreferencesController:getState',
    );

    return completedOnboarding && Boolean(useExternalServices);
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
