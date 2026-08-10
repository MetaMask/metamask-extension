import type {
  KeyringControllerUnlockEvent,
  KeyringControllerWithKeyringUnsafeAction,
} from '@metamask/keyring-controller';
import type { Messenger } from '@metamask/messenger';
import type { RemoteFeatureFlagControllerGetStateAction } from '@metamask/remote-feature-flag-controller';
import { createProjectLogger, type Hex } from '@metamask/utils';
import { isMoneyAccountEnabled } from '../../../../shared/lib/money/feature-flags';
import { deriveMoneyAccountAddress } from './get-money-account-address';

const log = createProjectLogger('money-account-availability');

type MoneyAccountAvailabilityActions =
  | KeyringControllerWithKeyringUnsafeAction
  | RemoteFeatureFlagControllerGetStateAction;

export type MoneyAccountAvailabilityMessenger = Messenger<
  string,
  MoneyAccountAvailabilityActions,
  KeyringControllerUnlockEvent
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
  readonly #messenger: MoneyAccountAvailabilityMessenger;

  #address?: Promise<Hex>;

  constructor({ messenger }: { messenger: MoneyAccountAvailabilityMessenger }) {
    this.#messenger = messenger;

    // An unlock can follow a vault restore, which changes the primary seed and
    // therefore the derived address, so the cached value is dropped.
    this.#messenger.subscribe('KeyringController:unlock', () => {
      this.#address = undefined;
    });
  }

  /**
   * Resolve whether the Money Account is available.
   *
   * @returns The availability, with the money address when available.
   */
  async getAvailability(): Promise<MoneyAccountAvailability> {
    if (!this.#isEnabled()) {
      return UNAVAILABLE;
    }

    try {
      const address = await this.#getAddress();

      return { isAvailable: true, address };
    } catch (error) {
      // A locked wallet lands here. It is not evidence that the user has no
      // money account, so the surface is hidden without the answer being
      // cached.
      log('Failed to resolve money account availability', error);
      return UNAVAILABLE;
    }
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

  /**
   * The derived money address, from cache when already resolved.
   *
   * @returns The money account address.
   */
  async #getAddress(): Promise<Hex> {
    if (!this.#address) {
      const address = deriveMoneyAccountAddress(this.#messenger);

      this.#address = address;
      address.catch(() => {
        this.#address = undefined;
      });
    }

    return await this.#address;
  }
}
