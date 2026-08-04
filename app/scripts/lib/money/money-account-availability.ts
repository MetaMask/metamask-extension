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
 *
 * The address is only present in the available case: when the account is
 * unavailable the entire Money surface is hidden, so there is nothing for a
 * caller to render it against. Callers get one answer rather than a flag per
 * input to recombine.
 */
export type MoneyAccountAvailability =
  | { isAvailable: true; address: Hex }
  | { isAvailable: false };

const UNAVAILABLE: MoneyAccountAvailability = { isAvailable: false };

/**
 * Resolves whether the Money Account surface should be shown at all.
 *
 * Two things have to hold: the `moneyEnableMoneyAccount` flag is on, and the
 * money address can be derived (which requires an unlocked wallet).
 * Visibility is deliberately controlled by the flag alone — it is **not**
 * gated on the account having an EIP-7702 delegation, because an upgrade flow
 * is planned for the extension: a user whose account is not yet upgraded
 * should still see the surface that leads them there.
 *
 * ## Not a deposit pre-flight
 *
 * A `true` answer means "the feature is on and this wallet derives a money
 * address", nothing more. A visible account may not be upgraded yet, and even
 * an upgraded one can fail a deposit (insufficient gas, an unavailable
 * network client). A deposit path must handle its own failures.
 *
 * ## Caching
 *
 * The flag is checked first and never cached: it is a synchronous state read,
 * and it can flip while the wallet stays unlocked when the remote flags
 * refresh. The derived address is cached as a promise until the next unlock,
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
