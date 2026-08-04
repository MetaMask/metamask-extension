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
import type { MoneyAccountAvailability } from '../../../../shared/lib/money/availability';
import { isMoneyAccountEnabled } from '../../../../shared/lib/money/feature-flags';
import { getMoneyAccountVaultConfig } from '../../../../shared/lib/money/vault-config';
import { deriveMoneyAccountAddress } from './get-money-account-address';

const log = createProjectLogger('money-account-availability');

/**
 * The prefix of the on-chain code of an EOA that has an EIP-7702 delegation,
 * followed by the 20-byte address it is delegated to.
 */
const DELEGATION_PREFIX = '0xef0100';

/** `0x` + `ef0100` + a 20-byte address, as a hex string. */
const DELEGATED_CODE_LENGTH = 48;

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
 * Four things have to hold: the `moneyEnableMoneyAccount` flag is on, the
 * `moneyAccountVaultConfig` flag parses (it names the chain the money account
 * lives on), the money address can be derived (which requires an unlocked
 * wallet), and that address has an EIP-7702 delegation on that chain. The
 * extension does not implement money-account creation, so the delegation is the
 * evidence that the user onboarded on mobile — the address is a derivation of
 * the same seed, so a mobile-onboarded user has a live delegation at the same
 * address here.
 *
 * ## The chain comes from the vault config, with no fallback
 *
 * An unserved or malformed `moneyAccountVaultConfig` answers **unavailable**.
 * There is deliberately no fallback to a hardcoded Monad: the balance service
 * reads its chain from the same flag and rejects with
 * `VaultConfigNotAvailableError` until it is served, so a gate that guessed a
 * chain would show a surface that cannot load a balance — and could disagree
 * with the service about which chain it is reading. Hiding is also the answer
 * the "extension-first users see nothing" rule wants: a config the client cannot
 * parse is not a usable money account.
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
 * unavailable network client for the money chain). A deposit path must handle its own
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
 *
 * Both remote flags — the enablement flag and the vault config — are read on
 * **every** call, not cached alongside the address: they are synchronous state
 * reads costing nothing, and they can change while the wallet stays unlocked
 * when the remote flags refresh, which is exactly how the surface first appears
 * for a user the flag was not yet serving. The cached delegation is therefore
 * tagged with the chain it was read on and re-read if the config's chain
 * changes, so the cache can never answer for a chain the config no longer names.
 */
export class MoneyAccountAvailabilityService {
  readonly #messenger: MoneyAccountAvailabilityMessenger;

  /**
   * The derived address, cached until the next unlock. A promise rather than a
   * value, so concurrent callers share one in-flight read instead of racing.
   */
  #address?: Promise<Hex>;

  /**
   * The delegation read, tagged with the chain it was performed on. The chain
   * comes from a remote flag that is re-read every call, so a config that
   * changes chain must not be answered from a cache built against the old one.
   */
  #delegation?: { chainId: Hex; hasDelegation: Promise<boolean> };

  constructor({ messenger }: { messenger: MoneyAccountAvailabilityMessenger }) {
    this.#messenger = messenger;

    // An unlock can follow a vault restore, which changes the primary seed and
    // therefore the derived address, so both cached values are dropped.
    this.#messenger.subscribe('KeyringController:unlock', () => this.#forget());
  }

  /**
   * Resolve whether the Money Account is available.
   *
   * @returns The availability, with the money address when available.
   */
  async getAvailability(): Promise<MoneyAccountAvailability> {
    const { remoteFeatureFlags } = this.#messenger.call(
      'RemoteFeatureFlagController:getState',
    );

    if (!isMoneyAccountEnabled(remoteFeatureFlags)) {
      return UNAVAILABLE;
    }

    const vaultConfig = getMoneyAccountVaultConfig(remoteFeatureFlags);
    if (!vaultConfig) {
      log('No usable money account vault config; hiding the surface');
      return UNAVAILABLE;
    }

    try {
      const address = await this.#getAddress();

      return (await this.#getHasDelegation(address, vaultConfig.chainId))
        ? { isAvailable: true, address }
        : UNAVAILABLE;
    } catch (error) {
      // A locked wallet, no network client for the money chain, or an RPC failure
      // all land here. None of them are evidence that the user has no money
      // account, so the surface is hidden without the answer being cached.
      log('Failed to resolve money account availability', error);
      return UNAVAILABLE;
    }
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
   * Whether the address has an EIP-7702 delegation on the money chain, from
   * cache when already resolved for that same chain.
   *
   * @param address - The money account address.
   * @param chainId - The money chain, from the vault config.
   * @returns Whether the address is delegated.
   */
  async #getHasDelegation(address: Hex, chainId: Hex): Promise<boolean> {
    let cached = this.#delegation;

    if (cached?.chainId !== chainId) {
      const hasDelegation = this.#readDelegation(address, chainId);

      cached = { chainId, hasDelegation };
      this.#delegation = cached;
      hasDelegation.catch(() => this.#forget());
    }

    return await cached.hasDelegation;
  }

  /**
   * Drop the cached values so the next call retries.
   */
  #forget(): void {
    this.#address = undefined;
    this.#delegation = undefined;
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
   * @param chainId - The money chain, from the vault config.
   * @returns Whether the address has a delegation.
   */
  async #readDelegation(address: Hex, chainId: Hex): Promise<boolean> {
    const networkClientId = this.#messenger.call(
      'NetworkController:findNetworkClientIdByChainId',
      chainId,
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
