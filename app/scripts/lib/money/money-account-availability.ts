import type {
  KeyringControllerLockEvent,
  KeyringControllerUnlockEvent,
  KeyringControllerWithKeyringUnsafeAction,
} from '@metamask/keyring-controller';
import type { Messenger } from '@metamask/messenger';
import type { RemoteFeatureFlagControllerGetStateAction } from '@metamask/remote-feature-flag-controller';
import { createProjectLogger, type Hex } from '@metamask/utils';
import { isMoneyAccountEnabled } from '../../../../shared/lib/money/feature-flags';
import { deriveMoneyAccountAddress } from './get-money-account-address';

const log = createProjectLogger('money-account-availability');

const serviceName = 'MoneyAccountAvailabilityService';

type MoneyAccountAvailabilityAllowedActions =
  | KeyringControllerWithKeyringUnsafeAction
  | RemoteFeatureFlagControllerGetStateAction;

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

/**
 * The action other clients use to call {@link MoneyAccountAvailabilityService.getAddress}
 * directly through the messenger, instead of via a controller wrapper method.
 */
export type MoneyAccountAvailabilityServiceGetAddressAction = {
  type: `${typeof serviceName}:getAddress`;
  handler: MoneyAccountAvailabilityService['getAddress'];
};

type MoneyAccountAvailabilityActions =
  | MoneyAccountAvailabilityServiceGetAvailabilityAction
  | MoneyAccountAvailabilityServiceGetAddressAction;

export type MoneyAccountAvailabilityMessenger = Messenger<
  typeof serviceName,
  MoneyAccountAvailabilityActions | MoneyAccountAvailabilityAllowedActions,
  MoneyAccountAvailabilityEvents
>;

/**
 * Whether this user has a usable Money Account, and its address when they do.
 */
export type MoneyAccountAvailability =
  | { isAvailable: true; address: Hex }
  | { isAvailable: false };

const UNAVAILABLE: MoneyAccountAvailability = { isAvailable: false };

/**
 * Resolves whether the Money Account surface should be shown at all.
 *
 * We look at the state of the `moneyEnableMoneyAccount` flag, and whether
 * a money address can be derived from an unlocked wallet.
 *
 * A money account being available doesn’t mean that the account has been
 * upgraded yet.
 *
 * The flag is checked first and never cached because it can
 * change when remote feature flags update.
 *
 * The derived address is cached as a promise until the next unlock,
 * so concurrent callers share one in-flight derivation; failures are not
 * cached, so a locked wallet is retried on the next call.
 */
export class MoneyAccountAvailabilityService {
  readonly name: typeof serviceName = serviceName;

  readonly #messenger: MoneyAccountAvailabilityMessenger;

  #address?: Promise<Hex>;

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

    this.#messenger.registerMethodActionHandlers(this, [
      'getAvailability',
      'getAddress',
    ]);
  }

  /**
   * Resolve whether the Money Account is available.
   *
   * @returns The availability, with the money address when available.
   */
  async getAvailability(): Promise<MoneyAccountAvailability> {
    try {
      if (!this.#isEnabled()) {
        return UNAVAILABLE;
      }

      const address = await this.getAddress();

      return { isAvailable: true, address };
    } catch (error) {
      // A locked wallet, or a transient failure reading the feature flag or
      // deriving the address, lands here. None of these are evidence that
      // the user has no money account, so the surface is hidden without the
      // answer being cached.
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
  async getAddress(): Promise<Hex> {
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

  /**
   * Read the `moneyEnableMoneyAccount` flag.
   *
   * @returns Whether the Money Account feature is enabled.
   */
  #isEnabled(): boolean {
    const { remoteFeatureFlags } = this.#messenger.call(
      'RemoteFeatureFlagController:getState',
    );

    return isMoneyAccountEnabled(remoteFeatureFlags);
  }
}
