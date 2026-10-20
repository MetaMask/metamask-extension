import type { MpcMoneyKeyringSetupMode } from '@metamask/eth-money-mpc-keyring';
import { KeyringTypes } from '@metamask/keyring-controller';
import type { Keyring } from '@metamask/keyring-utils';
import { isValidHexAddress, type Hex, type Json } from '@metamask/utils';

const MPC_MONEY_KEYRING_TYPE = KeyringTypes.mpcMoney;

/**
 * Stub implementation of the V1 MPC money keyring contract.
 *
 * The real implementation ships in `@metamask/eth-money-mpc-keyring` (backed
 * by the DKLS23/CL24 threshold-signature WebAssembly libraries and the MPC
 * cloud service), which the extension does not use yet: it requires the WASM
 * TSS libraries and live service endpoints. This local stub stands in with
 * the same keyring type and satisfies the same V1 contract that the
 * package's V2 adapter (`@metamask/eth-money-mpc-keyring/v2`) wraps, so the
 * real V1 keyring can replace it later without vault migration: it takes no
 * options, keeps no state, `addAccounts` and `init` are noops, and every
 * method that requires the underlying MPC stack throws a `Not implemented`
 * error. Like the real keyring, it supports message signing only — no
 * transaction signing.
 *
 * `getAccounts` returns the static address configured through the
 * `MM_MONEY_MPC_ADDRESS` environment variable (inlined at build time), or no
 * accounts when it is unset.
 */
export class MpcMoneyKeyring implements Keyring {
  static type: string = MPC_MONEY_KEYRING_TYPE;

  readonly type: string = MPC_MONEY_KEYRING_TYPE;

  /**
   * Return the serialized state of the keyring.
   *
   * @returns The serialized state of the keyring.
   */
  async serialize(): Promise<Json> {
    return {};
  }

  /**
   * Initialize the keyring with the given serialized state.
   *
   * @param _state - The serialized state of the keyring.
   */
  async deserialize(_state: Json): Promise<void> {
    // Stub: no state is kept.
  }

  /**
   * Run key generation or import.
   *
   * The V2 adapter invokes this during account creation; the stub keeps it a
   * noop because `getAccounts` already serves the static address.
   *
   * @param _mode - The MPC setup mode.
   */
  async init(_mode?: MpcMoneyKeyringSetupMode): Promise<void> {
    // Stub: no MPC setup runs.
  }

  /**
   * Rotate the MPC key shares.
   */
  async rotateKeyShares(): Promise<never> {
    throw new Error('Not implemented');
  }

  /**
   * Check the MPC key share state.
   *
   * @returns Whether the key share is up to date.
   */
  async checkKeyShare(): Promise<never> {
    throw new Error('Not implemented');
  }

  /**
   * Synchronize the MPC key share.
   */
  async syncKeyShare(): Promise<never> {
    throw new Error('Not implemented');
  }

  /**
   * Add new accounts to the keyring.
   *
   * @param _numberOfAccounts - The number of accounts to add.
   * @returns The addresses of the new accounts.
   */
  async addAccounts(_numberOfAccounts = 1): Promise<Hex[]> {
    // Stub: account creation is a noop.
    return [];
  }

  /**
   * Get the addresses of all accounts in the keyring.
   *
   * The configured address may be all-lowercase or EIP-55 checksummed.
   *
   * @returns The addresses of all accounts in the keyring.
   */
  async getAccounts(): Promise<Hex[]> {
    const address = process.env.MM_MONEY_MPC_ADDRESS;
    if (!address) {
      return [];
    }
    // The env value is an unvalidated `string`: `isValidHexAddress` performs
    // the actual all-lowercase / EIP-55 checksummed validation at runtime
    // (its parameter is typed `Hex`, hence the cast, but it also verify
    // it's a proper hex address, so we can safely cast it here).
    if (!isValidHexAddress(address as Hex)) {
      throw new Error(
        `MM_MONEY_MPC_ADDRESS must be a valid hex address: \`${address}\``,
      );
    }
    // `toLowerCase()` widens the type back to `string`, losing the `Hex`
    // typing of the validated address, so the result must be re-cast.
    return [address.toLowerCase() as Hex];
  }

  /**
   * Get the public address of the account for the given app key origin.
   *
   * @param _address - The address of the account.
   * @param _origin - The origin of the app requesting the account.
   * @returns The public address of the account.
   */
  async getAppKeyAddress(_address: Hex, _origin: string): Promise<never> {
    throw new Error('Not implemented');
  }

  /**
   * Sign a personal message using the specified account.
   *
   * @param _address - The address of the account.
   * @param _message - The message to sign.
   * @param _opts - The options for signing the message.
   * @returns The signature of the message.
   */
  async signPersonalMessage(
    _address: Hex,
    _message: Hex,
    _opts?: { version?: string } & Record<string, unknown>,
  ): Promise<never> {
    throw new Error('Not implemented');
  }

  /**
   * Sign a typed message using the specified account.
   *
   * @param _address - The address of the account.
   * @param _typedData - The typed data to sign.
   * @param _options - The options for signing the message.
   * @returns The signature of the message.
   */
  async signTypedData(
    _address: Hex,
    _typedData: unknown[] | Record<string, unknown>,
    _options?: Record<string, unknown>,
  ): Promise<never> {
    throw new Error('Not implemented');
  }

  /**
   * Sign an EIP-7702 authorization using the specified account.
   *
   * @param _address - The address of the account.
   * @param _authorization - The EIP-7702 authorization to sign.
   * @param _opts - The options for signing the authorization.
   * @returns The signature of the authorization.
   */
  async signEip7702Authorization(
    _address: Hex,
    _authorization: [chainId: number, contractAddress: Hex, nonce: number],
    _opts?: Record<string, unknown>,
  ): Promise<never> {
    throw new Error('Not implemented');
  }
}
