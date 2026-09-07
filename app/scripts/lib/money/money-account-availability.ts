import type { GeolocationControllerGetGeolocationAction } from '@metamask/geolocation-controller';
import type {
  KeyringControllerLockEvent,
  KeyringControllerUnlockEvent,
  KeyringControllerWithKeyringUnsafeAction,
} from '@metamask/keyring-controller';
import type { Messenger } from '@metamask/messenger';
import type { NetworkControllerGetStateAction } from '@metamask/network-controller';
import type { RemoteFeatureFlagControllerGetStateAction } from '@metamask/remote-feature-flag-controller';
import { createProjectLogger, type Hex } from '@metamask/utils';
import { FEATURED_RPCS } from '../../../../shared/constants/network';
import type { MoneyAccountAvailability } from '../../../../shared/lib/money/availability';
import {
  getMoneyAccountGeoBlockedCountries,
  isMoneyAccountGeoEligible,
} from '../../../../shared/lib/money/feature-flags';
import { getMoneyAccountVaultConfig } from '../../../../shared/lib/money/vault-config';
import type { LegacyBackgroundApiServiceAddNetworkAction } from '../../services/legacy-background-api-service-method-action-types';
import { deriveMoneyAccountAddress } from './get-money-account-address';

const log = createProjectLogger('money-account-availability');

const serviceName = 'MoneyAccountAvailabilityService';

type MoneyAccountAvailabilityAllowedActions =
  | KeyringControllerWithKeyringUnsafeAction
  | LegacyBackgroundApiServiceAddNetworkAction
  | NetworkControllerGetStateAction
  | RemoteFeatureFlagControllerGetStateAction
  | GeolocationControllerGetGeolocationAction;

type MoneyAccountAvailabilityEvents =
  | KeyringControllerUnlockEvent
  | KeyringControllerLockEvent;

/**
 * The action other clients use to call {@link MoneyAccountAvailabilityService.getAvailability}
 * directly through the messenger, instead of via a controller wrapper method.
 */
export type MoneyAccountAvailabilityServiceGetAvailabilityAction = {
  type: `${typeof serviceName}:getAvailability`;
  handler: MoneyAccountAvailabilityService['getAvailability'];
};

export type MoneyAccountAvailabilityMessenger = Messenger<
  typeof serviceName,
  | MoneyAccountAvailabilityServiceGetAvailabilityAction
  | MoneyAccountAvailabilityAllowedActions,
  MoneyAccountAvailabilityEvents
>;

export type { MoneyAccountAvailability };

const UNAVAILABLE: MoneyAccountAvailability = { isAvailable: false };

/**
 * Resolves whether the Money Account surface should be shown at all.
 *
 * We look at whether the user's region is allowed
 * (`moneyAccountGeoBlockedCountries`), and whether a money address can be
 * derived from an unlocked wallet. The configured Money Account chain must
 * also be ready for use.
 *
 * A money account being available doesn’t mean that the account has been
 * upgraded yet, nor that the Money keyring exists in the vault yet. The
 * address is derived straight from the seed, so it is the same whether or not
 * `MoneyAccountController.init()` has run; creating the keyring is that
 * controller's job, and it creates it on demand before any signing.
 *
 * Callers are expected to gate on the `moneyEnableMoneyAccount` flag
 * themselves before calling; this service does not check it, to avoid
 * re-implementing a check every caller already has to make.
 *
 * The geo check is never cached because it can change when remote feature
 * flags update or geolocation refreshes. Unknown or failed geolocation is
 * treated as blocked (fail closed).
 *
 * The derived address is cached as a promise until the next unlock,
 * so concurrent callers share one in-flight derivation; failures are not
 * cached, so a locked wallet is retried on the next call.
 */
export class MoneyAccountAvailabilityService {
  readonly name: typeof serviceName = serviceName;

  readonly #messenger: MoneyAccountAvailabilityMessenger;

  #address?: Promise<Hex>;

  #chainConfiguration?: Promise<void>;

  constructor({ messenger }: { messenger: MoneyAccountAvailabilityMessenger }) {
    this.#messenger = messenger;

    // An unlock can follow a vault restore, which changes the primary seed and
    // therefore the derived address, so the cached value is dropped. A lock
    // also drops it, so a re-derivation re-checks that the wallet is unlocked
    // rather than serving a stale address from before the lock.
    this.#messenger.subscribe('KeyringController:unlock', () => {
      this.#address = undefined;
    });
    this.#messenger.subscribe('KeyringController:lock', () => {
      this.#address = undefined;
    });

    this.#messenger.registerMethodActionHandlers(this, ['getAvailability']);
  }

  /**
   * Resolve whether the Money Account is available.
   *
   * @returns The availability, with the money address when available.
   */
  async getAvailability(): Promise<MoneyAccountAvailability> {
    try {
      const { remoteFeatureFlags } = this.#messenger.call(
        'RemoteFeatureFlagController:getState',
      );

      if (!(await this.#isGeoEligible(remoteFeatureFlags))) {
        return UNAVAILABLE;
      }

      const address = await this.#getAddress();
      await this.#ensureChainConfigured(remoteFeatureFlags);

      return { isAvailable: true, address };
    } catch (error) {
      // A locked wallet, unknown region, or a transient failure reading
      // feature flags, geolocation, deriving the address, or configuring the
      // chain lands here. None of these are evidence that the user has no
      // money account, so the surface is hidden without caching the answer.
      log('Failed to resolve money account availability', error);
      return UNAVAILABLE;
    }
  }

  /**
   * The money account address, derived from the primary HD seed. Requires an
   * unlocked wallet, but not the password.
   *
   * Cached as a promise until the next unlock, so concurrent callers share
   * one in-flight derivation; failures are not cached, so a locked wallet is
   * retried on the next call.
   *
   * @returns The money account address.
   */
  async #getAddress(): Promise<Hex> {
    if (!this.#address) {
      const address = deriveMoneyAccountAddress(this.#messenger);

      this.#address = address;
      address.catch(() => {
        // Only clear the cache if it still points at this derivation. A lock
        // or unlock in between may have already replaced it with a newer,
        // possibly successful, one.
        if (this.#address === address) {
          this.#address = undefined;
        }
      });
    }

    return await this.#address;
  }

  async #ensureChainConfigured(
    remoteFeatureFlags: Record<string, unknown> | undefined,
  ): Promise<void> {
    if (this.#chainConfiguration) {
      return await this.#chainConfiguration;
    }

    const chainConfiguration = this.#configureChain(remoteFeatureFlags);
    this.#chainConfiguration = chainConfiguration;

    try {
      await chainConfiguration;
    } finally {
      if (this.#chainConfiguration === chainConfiguration) {
        this.#chainConfiguration = undefined;
      }
    }
  }

  async #configureChain(
    remoteFeatureFlags: Record<string, unknown> | undefined,
  ): Promise<void> {
    const vaultConfig = getMoneyAccountVaultConfig(remoteFeatureFlags);
    if (!vaultConfig) {
      throw new Error('Money Account vault configuration is unavailable');
    }

    const { networkConfigurationsByChainId } = this.#messenger.call(
      'NetworkController:getState',
    );
    if (networkConfigurationsByChainId[vaultConfig.chainId]) {
      return;
    }

    const networkConfiguration = FEATURED_RPCS.find(
      ({ chainId }) => chainId === vaultConfig.chainId,
    );
    if (!networkConfiguration) {
      throw new Error(
        `Money Account chain ${vaultConfig.chainId} is not a featured network`,
      );
    }

    // TODO(MUSD-1270): Move this setup to MoneyAccountUpgradeController
    // bootstrap when https://consensyssoftware.atlassian.net/browse/MUSD-1270
    // is implemented.
    await this.#messenger.call(
      'LegacyBackgroundApiService:addNetwork',
      networkConfiguration,
      { setActive: false },
    );
  }

  /**
   * Whether the user's region is allowed to see Money Account.
   *
   * Fail-closed: unknown, empty, or failed geolocation is treated as blocked.
   *
   * @param remoteFeatureFlags - The current remote feature flags.
   * @returns Whether the user is geo-eligible.
   */
  async #isGeoEligible(
    remoteFeatureFlags: Record<string, unknown> | undefined,
  ): Promise<boolean> {
    const blockedCountries =
      getMoneyAccountGeoBlockedCountries(remoteFeatureFlags);
    const location = await this.#messenger.call(
      'GeolocationController:getGeolocation',
    );

    return isMoneyAccountGeoEligible(location, blockedCountries);
  }
}
