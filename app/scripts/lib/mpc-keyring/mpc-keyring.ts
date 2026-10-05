import type { TypedTransaction } from '@ethereumjs/tx';
import type {
  EIP7702Authorization,
  MessageTypes,
  SignTypedDataVersion,
  TypedDataV1,
  TypedMessage,
} from '@metamask/eth-sig-util';
import type {
  MpcKeyring as MpcKeyringDefinition,
  MpcKeyringSetupParams,
} from '@metamask/eth-mpc-keyring';
import type { Hex, Json } from '@metamask/utils';
import { EthAccountType, EthScope, KeyringAccount } from '@metamask/keyring-api';
import { generateEthAccountId } from '@metamask/keyring-sdk';

const mpcKeyringType = 'MPC Keyring';

const MPC_ADDRESS = '0xabcdabcdabcdabcdabcdabcdabcdabcdabcdabcd';
//const MPC_KEYRING_ACCOUNT: KeyringAccount = {
//  type: EthAccountType.Eoa,
//  id: generateEthAccountId(MPC_ADDRESS),
//  options: {},
//  scopes: [EthScope.Eoa],
//  methods: [],
//};

/**
 * Stub implementation of the V1 MPC keyring contract.
 *
 * `@metamask/eth-mpc-keyring` does not ship a V1 implementation yet, pending
 * the availability of the MFA Wallet SDK packages, so this local stub stands
 * in: it takes no options, and every method that requires the underlying
 * MPC stack throws a `Not implemented` error.
 *
 * The methods that do not require the MPC stack mirror the behavior of an
 * uninitialized keyring: `getAccounts` returns an empty list, `serialize`
 * returns an empty object, and `deserialize` is a no-op.
 *
 * This stub will be replaced by the package's implementation once it ships.
 */
export class MpcKeyring implements MpcKeyringDefinition {
  static type: string = mpcKeyringType;

  readonly type: string = mpcKeyringType;

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
   * @param _mode - The MPC setup mode.
   */
  async init(_mode?: MpcKeyringSetupParams['mode']): Promise<void> {
    // Stub: This method is always invoked during the keyring setup process, so we need it
    // to exist.
  }

  /**
   * Rotate the MPC key shares.
   */
  async rotateKeyShares(): Promise<void> {
    throw new Error('Not implemented');
  }

  /**
   * Check the MPC key share state.
   */
  async checkKeyShare(): Promise<boolean> {
    throw new Error('Not implemented');
  }

  /**
   * Synchronize the MPC key share.
   */
  async syncKeyShare(): Promise<void> {
    throw new Error('Not implemented');
  }

  /**
   * Add new accounts to the keyring.
   *
   * @param _numberOfAccounts - The number of accounts to add.
   * @returns The addresses of the new accounts.
   */
  async addAccounts(_numberOfAccounts = 1): Promise<Hex[]> {
    throw new Error('Not implemented');
  }

  /**
   * Get the addresses of all accounts in the keyring.
   *
   * @returns The addresses of all accounts in the keyring.
   */
  async getAccounts(): Promise<Hex[]> {
    return [MPC_ADDRESS];
  }

  /**
   * Get the public address of the account for the given app key origin.
   *
   * @param _address - The address of the account.
   * @param _origin - The origin of the app requesting the account.
   * @returns The public address of the account.
   */
  async getAppKeyAddress(_address: Hex, _origin: string): Promise<Hex> {
    throw new Error('Not implemented');
  }

  /**
   * Sign a transaction using the specified account.
   *
   * @param _address - The address of the account.
   * @param _tx - The transaction to sign.
   * @param _opts - The options for signing the transaction.
   * @returns The signed transaction.
   */
  async signTransaction(
    _address: Hex,
    _tx: TypedTransaction,
    _opts = {},
  ): Promise<TypedTransaction> {
    throw new Error('Not implemented');
  }

  /**
   * Sign a personal message using the specified account.
   *
   * @param _address - The address of the account.
   * @param _msgHex - The message to sign.
   * @param _opts - The options for signing the message.
   * @returns The signature of the message.
   */
  async signPersonalMessage(
    _address: Hex,
    _msgHex: string,
    _opts?: Record<string, unknown>,
  ): Promise<string> {
    throw new Error('Not implemented');
  }

  /**
   * Sign a typed message using the specified account.
   *
   * @param _address - The address of the account.
   * @param _data - The typed data to sign.
   * @param _options - The options for signing the message.
   * @returns The signature of the message.
   */
  async signTypedData<
    Version extends SignTypedDataVersion,
    Types extends MessageTypes,
    Options extends { version?: Version },
  >(
    _address: Hex,
    _data: Version extends 'V1' ? TypedDataV1 : TypedMessage<Types>,
    _options?: Options,
  ): Promise<string> {
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
    _authorization: EIP7702Authorization,
    _opts?: Record<string, unknown>,
  ): Promise<string> {
    throw new Error('Not implemented');
  }
}
