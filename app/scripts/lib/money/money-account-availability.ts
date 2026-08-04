import type {
  KeyringControllerUnlockEvent,
  KeyringControllerWithKeyringUnsafeAction,
} from '@metamask/keyring-controller';
import type { Messenger } from '@metamask/messenger';
import type {
  NetworkControllerFindNetworkClientIdByChainIdAction,
  NetworkControllerGetNetworkClientByIdAction,
} from '@metamask/network-controller';
import type { RemoteFeatureFlagControllerGetStateAction } from '@metamask/remote-feature-flag-controller';
import { createProjectLogger, type Hex } from '@metamask/utils';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import type { MoneyAccountAvailability } from '../../../../shared/lib/money/availability';
import { isMoneyAccountEnabled } from '../../../../shared/lib/money/feature-flags';
import { deriveMoneyAccountAddress } from './get-money-account-address';

const log = createProjectLogger('money-account-availability');

/**
 * The prefix of the on-chain code of an EOA that has an EIP-7702 delegation,
 * followed by the 20-byte address it is delegated to.
 */
const DELEGATION_PREFIX = '0xef0100';

/** `0x` + `ef0100` + a 20-byte address, as a hex string. */
const DELEGATED_CODE_LENGTH = 48;

/** The chain the Money Account lives on. */
const MONEY_CHAIN_ID: Hex = CHAIN_IDS.MONAD;

type MoneyAccountAvailabilityActions =
  | KeyringControllerWithKeyringUnsafeAction
  | NetworkControllerFindNetworkClientIdByChainIdAction
  | NetworkControllerGetNetworkClientByIdAction
  | RemoteFeatureFlagControllerGetStateAction;

export type MoneyAccountAvailabilityMessenger = Messenger<
  string,
  MoneyAccountAvailabilityActions,
  KeyringControllerUnlockEvent
>;

export type { MoneyAccountAvailability };

const UNAVAILABLE: MoneyAccountAvailability = { isAvailable: false };

/**
 * Resolves whether the Money Account surface should be shown at all.
 *
 * Three things have to hold: the `moneyEnableMoneyAccount` flag is on, the
 * money address can be derived (which requires an unlocked wallet), and that
 * address has an EIP-7702 delegation on Monad. The extension does not implement
 * money-account creation, so the delegation is the evidence that the user
 * onboarded on mobile — the address is a derivation of the same seed, so a
 * mobile-onboarded user has a live delegation at the same address here.
 *
 * ## Not a deposit pre-flight
 *
 * A `true` answer means "this account was upgraded", nothing more. Do **not**
 * reuse it as evidence that a deposit batch will succeed. In particular, the
 * mobile upgrade can sit in a stuck `PENDING` state on the CHOMP side that is
 * silent in error reporting; such an account has no delegation, so it is
 * correctly hidden here, but the converse does not follow — a delegated account
 * can still fail a deposit (insufficient gas, a delegation target the
 * `transaction-controller` EIP-7702 feature flags do not recognise, an
 * unavailable Monad network client). A deposit path must handle its own
 * failures.
 *
 * ## Caching
 *
 * The delegation check is an `eth_getCode` round trip, so it is resolved once
 * per unlock and cached in memory, never per render. The state changes at most
 * once in an account's life — when the user upgrades on mobile — so the cost of
 * a stale `false` is that the surface appears at the next unlock (or the next
 * background restart), which is an acceptable trade for not putting an RPC read
 * behind a boolean the UI asks for on every render. Failures are not cached, so
 * a transient RPC error is retried on the next call rather than hiding the
 * surface until unlock.
 */
export class MoneyAccountAvailabilityService {
  readonly #messenger: MoneyAccountAvailabilityMessenger;

  /**
   * The derived address and its delegation state, cached until the next
   * unlock. Promises rather than values, so concurrent callers share one
   * in-flight read instead of racing.
   */
  #address?: Promise<Hex>;

  #hasDelegation?: Promise<boolean>;

  constructor({ messenger }: { messenger: MoneyAccountAvailabilityMessenger }) {
    this.#messenger = messenger;

    // An unlock can follow a vault restore, which changes the primary seed and
    // therefore the derived address, so both cached values are dropped.
    this.#messenger.subscribe('KeyringController:unlock', () => {
      this.#address = undefined;
      this.#hasDelegation = undefined;
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

      return (await this.#getHasDelegation(address))
        ? { isAvailable: true, address }
        : UNAVAILABLE;
    } catch (error) {
      // A locked wallet, a missing Monad network client, or an RPC failure all
      // land here. None of them are evidence that the user has no money
      // account, so the surface is hidden without the answer being cached.
      log('Failed to resolve money account availability', error);
      return UNAVAILABLE;
    }
  }

  /**
   * Read the `moneyEnableMoneyAccount` flag.
   *
   * Checked first and never cached: it is a synchronous state read, and it can
   * flip while the wallet stays unlocked when the remote flags refresh.
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
      address.catch(() => this.#forget());
    }

    return await this.#address;
  }

  /**
   * Whether the address has an EIP-7702 delegation on Monad, from cache when
   * already resolved.
   *
   * @param address - The money account address.
   * @returns Whether the address is delegated.
   */
  async #getHasDelegation(address: Hex): Promise<boolean> {
    if (!this.#hasDelegation) {
      const hasDelegation = this.#readDelegation(address);

      this.#hasDelegation = hasDelegation;
      hasDelegation.catch(() => this.#forget());
    }

    return await this.#hasDelegation;
  }

  /**
   * Drop the cached values so the next call retries.
   */
  #forget(): void {
    this.#address = undefined;
    this.#hasDelegation = undefined;
  }

  /**
   * Check the address's on-chain code for an EIP-7702 delegation.
   *
   * This is the same read `transaction-controller`'s internal
   * `getDelegationAddress` performs, and the one mobile's
   * `money-account-upgrade-controller` performs before it submits an
   * authorization. The controller's `isAccountUpgradedToEIP7702` is not
   * exported from the package, and its public wrapper
   * (`TransactionController:isAtomicBatchSupported`) answers a different
   * question: it filters to the chains in the EIP-7702 supported-chains
   * feature flag and reports `isSupported` only for delegation targets in the
   * signed contract allowlist. Either of those could hide the Money surface
   * from a user whose account is upgraded, for reasons unrelated to whether it
   * is upgraded, so the gate reads the code directly.
   *
   * @param address - The address to check.
   * @returns Whether the address has a delegation.
   */
  async #readDelegation(address: Hex): Promise<boolean> {
    const networkClientId = this.#messenger.call(
      'NetworkController:findNetworkClientIdByChainId',
      MONEY_CHAIN_ID,
    );

    const { provider } = this.#messenger.call(
      'NetworkController:getNetworkClientById',
      networkClientId,
    );

    const code = await provider.request({
      method: 'eth_getCode',
      params: [address, 'latest'],
    });

    return (
      typeof code === 'string' &&
      code.length === DELEGATED_CODE_LENGTH &&
      code.toLowerCase().startsWith(DELEGATION_PREFIX)
    );
  }
}
