import {
  EthAccountType,
  EthMethod,
  EthScope,
  KeyringAccountEntropyTypeOption,
} from '@metamask/keyring-api';
import type { EntropySourceId, KeyringAccount } from '@metamask/keyring-api';
import { KeyringType } from '@metamask/keyring-api/v2';
import type {
  CreateAccountOptions,
  Keyring,
  KeyringCapabilities,
} from '@metamask/keyring-api/v2';
import { EthKeyringWrapper } from '@metamask/keyring-sdk/v2';
import type { AccountId, EthKeyring } from '@metamask/keyring-utils';
import { add0x } from '@metamask/utils';
import type { Hex } from '@metamask/utils';
import LatticeKeyring from 'eth-lattice-keyring';

type LegacyLatticeKeyring = InstanceType<typeof LatticeKeyring>;

type LatticePage = { address: string; balance: string | null }[];

// `LatticeKeyring` returns `any[]` from `addAccounts` and lacks the full
// `EthKeyring` signature surface, but it implements the same runtime methods.
// We assert it conforms to `EthKeyring` (plus the runtime device-management
// methods the wrapper depends on) so the V2 wrapper can use it.
type LatticeKeyringAsEthKeyring = LegacyLatticeKeyring &
  EthKeyring & {
    hdPath: string;
    appName: string | undefined;
    network: string | null;
    setHdPath(hdPath: string): void;
    setAccountToUnlock(index: number): void;
    addAccounts(n?: number): Promise<string[]>;
    getFirstPage(): Promise<LatticePage>;
    getNextPage(): Promise<LatticePage>;
    getPreviousPage(): Promise<LatticePage>;
    isUnlocked(): boolean;
    forgetDevice(): void;
    removeAccount(address: string): void;
  };

/**
 * Methods supported by Lattice keyring EOA accounts. Lattice supports the
 * standard signing methods plus typed-data variants; no encryption, app keys,
 * or EIP-7702.
 */
const LATTICE_KEYRING_METHODS = [
  EthMethod.SignTransaction,
  EthMethod.PersonalSign,
  EthMethod.SignTypedDataV1,
  EthMethod.SignTypedDataV3,
  EthMethod.SignTypedDataV4,
];

const latticeKeyringCapabilities: KeyringCapabilities = {
  scopes: [EthScope.Eoa],
  custom: {
    createAccounts: true,
  },
};

/**
 * Options for creating an account via the V2 `createAccounts` API.
 *
 * Lattice's account model does not fit cleanly into BIP-44 derivation —
 * each account carries its own `hdPath` and `walletUID`. We expose account
 * creation as a `custom` flow that mirrors the legacy
 * `setAccountToUnlock` + `addAccounts` sequence.
 */
export type LatticeCreateAccountOptions = {
  type: 'custom';
  /**
   * The entropy source ID (device fingerprint) to verify we're targeting
   * the correct device.
   */
  entropySource: EntropySourceId;
  /**
   * The Lattice address index to add. Maps to `setAccountToUnlock(index)`
   * on the legacy keyring.
   */
  addressIndex: number;
};

export type LatticeKeyringV2Options = {
  legacyKeyring: LegacyLatticeKeyring;
  entropySource: EntropySourceId;
};

/**
 * Concrete {@link Keyring} adapter for the legacy `LatticeKeyring`.
 *
 * Lattice's path model is per-account, so V2 account creation is exposed
 * through a `custom` flow rather than `bip44:derive-index`. All other
 * device-management surfaces are pass-throughs to the legacy keyring,
 * keeping the migration to `withKeyringV2` mechanical.
 */
export class LatticeKeyringV2
  extends EthKeyringWrapper<LatticeKeyringAsEthKeyring>
  implements Keyring
{
  readonly entropySource: EntropySourceId;

  constructor(options: LatticeKeyringV2Options) {
    super({
      type: KeyringType.Lattice,
      inner: options.legacyKeyring as LatticeKeyringAsEthKeyring,
      capabilities: latticeKeyringCapabilities,
    });
    this.entropySource = options.entropySource;
    // The legacy `eth-lattice-keyring` constructs with `appName` unset
    // unless `opts.name`/`opts.appName` were provided, and `_resetDefaults`
    // (called from `forgetDevice`) does not clear `appName`. Set it once
    // here so every Lattice flow downstream sees a populated identifier
    // without callers having to remember.
    this.inner.appName = 'MetaMask';
  }

  #createKeyringAccount(address: Hex): KeyringAccount {
    const id = this.registry.register(address);

    const account: KeyringAccount = {
      id,
      type: EthAccountType.Eoa,
      address,
      scopes: [...this.capabilities.scopes],
      methods: [...LATTICE_KEYRING_METHODS],
      options: {
        entropy: {
          type: KeyringAccountEntropyTypeOption.Custom,
        },
      },
    };

    this.registry.set(account);
    return account;
  }

  async getAccounts(): Promise<KeyringAccount[]> {
    const addresses = await this.inner.getAccounts();

    return addresses.map((address) => {
      const hexAddress = add0x(address);
      const existingId = this.registry.getAccountId(hexAddress);
      if (existingId) {
        const cached = this.registry.get(existingId);
        if (cached) {
          return cached;
        }
      }
      return this.#createKeyringAccount(hexAddress);
    });
  }

  async createAccounts(
    options: CreateAccountOptions,
  ): Promise<KeyringAccount[]> {
    return this.withLock(async () => {
      if (options.type !== 'custom') {
        throw new Error(
          `Unsupported account creation type for LatticeKeyring: ${String(
            options.type,
          )}. Supported type: 'custom'.`,
        );
      }

      const { entropySource, addressIndex } =
        options as LatticeCreateAccountOptions;

      if (entropySource !== this.entropySource) {
        throw new Error(
          `Entropy source mismatch: expected '${this.entropySource}', got '${String(entropySource)}'`,
        );
      }

      if (
        typeof addressIndex !== 'number' ||
        !Number.isInteger(addressIndex) ||
        addressIndex < 0
      ) {
        throw new Error(
          `Invalid addressIndex: ${String(addressIndex)}. Must be a non-negative integer.`,
        );
      }

      this.inner.setAccountToUnlock(addressIndex);
      const [newAddress] = await this.inner.addAccounts(1);

      if (!newAddress) {
        throw new Error('Failed to create new account');
      }

      return [this.#createKeyringAccount(add0x(newAddress as string))];
    });
  }

  async deleteAccount(accountId: AccountId): Promise<void> {
    await this.withLock(async () => {
      const { address } = await this.getAccount(accountId);
      this.inner.removeAccount(add0x(address));
      this.registry.delete(accountId);
    });
  }

  /**
   * @returns The current derivation path used by the inner keyring.
   */
  get hdPath(): string {
    return this.inner.hdPath;
  }

  /**
   * @returns The configured Lattice connector app name (e.g. 'MetaMask'),
   * or `undefined` if not yet set.
   */
  get appName(): string | undefined {
    return this.inner.appName;
  }

  /**
   * Set the Lattice connector app name. The legacy keyring resets this in
   * `forgetDevice`, so callers re-set it before each pairing flow.
   *
   * @param value - The app name to send to the Lattice connector.
   */
  set appName(value: string | undefined) {
    this.inner.appName = value;
  }

  /**
   * @returns The configured network type, or `null` if not set.
   */
  get network(): string | null {
    return this.inner.network;
  }

  /**
   * Set the network type on the inner keyring.
   *
   * @param value - The network type to set.
   */
  set network(value: string | null) {
    this.inner.network = value;
  }

  /**
   * Set the derivation path on the inner keyring.
   *
   * @param hdPath - The derivation path to set.
   */
  setHdPath(hdPath: string): void {
    this.inner.setHdPath(hdPath);
  }

  /**
   * Mark the account at `index` as the next one to add.
   *
   * @param index - The account index.
   */
  setAccountToUnlock(index: number): void {
    this.inner.setAccountToUnlock(index);
  }

  /**
   * Add `n` accounts to the keyring using the previously-set unlock index.
   *
   * @param n - The number of accounts to add. Defaults to 1.
   * @returns The list of added account addresses.
   */
  async addAccounts(n = 1): Promise<string[]> {
    return this.inner.addAccounts(n);
  }

  /**
   * Fetch the first page of candidate addresses from the device.
   *
   * @returns The first page of accounts.
   */
  async getFirstPage(): Promise<LatticePage> {
    return this.inner.getFirstPage();
  }

  /**
   * Fetch the next page of candidate addresses from the device.
   *
   * @returns The next page of accounts.
   */
  async getNextPage(): Promise<LatticePage> {
    return this.inner.getNextPage();
  }

  /**
   * Fetch the previous page of candidate addresses from the device.
   *
   * @returns The previous page of accounts.
   */
  async getPreviousPage(): Promise<LatticePage> {
    return this.inner.getPreviousPage();
  }

  /**
   * @returns Whether the inner keyring is currently unlocked.
   */
  isUnlocked(): boolean {
    return this.inner.isUnlocked();
  }

  /**
   * Clear the inner keyring's device-pairing state and accounts, and reset
   * the V2 account registry to keep them in sync.
   */
  async forgetDevice(): Promise<void> {
    await this.withLock(async () => {
      this.inner.forgetDevice();
      this.registry.clear();
    });
  }
}
