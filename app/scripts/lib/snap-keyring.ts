/**
 * Keyring that stores arbitrary JSON private data isolated by snap origin.
 *
 * Each account requires a public key (64 byte or 33 byte SEC-1 encoded)
 * and some arbitrary private data that must be serializable to JSON.
 *
 * Some functions defined on this keyring are designed for compatibility
 * with existing keyrings and should be called by UI controller code. For
 * example: `getAccounts()`, `removeAccount()` and `exportAccount()`; these
 * functions accept the public address to identify an account.
 *
 * UI controllers may not have enough information to successfully export and
 * restore so `exportAccount()` is defined for compatibility but care should
 * be taken exposing this in the UI.
 *
 * Other functions represent basic CRUD operations that snap controllers
 * may perform and must specify the `origin` for the snap; `createAccount()`,
 * `readAccount()`, `updateAccount()` and `deleteAccount()` for example.
 */
import { Buffer } from 'buffer';
import { HandlerType } from '@metamask/snaps-utils';
import { Json } from '@metamask/utils';
import { v4 as uuidv4 } from 'uuid';

import { ethErrors } from 'eth-rpc-errors';
import { deferredPromise, DeferredPromise } from './util';

export const type = 'Snap Keyring';

export type Origin = string; // Origin of the snap
export type Address = string; // String public address
export type PublicKey = Buffer; // 33 or 64 byte public key
export type JsonWallet = [PublicKey, Json];
export type SnapWallet = Map<Address, Origin>;

// Type for serialized format.
export type SerializedWallets = {
  [key: string]: string;
};

class SnapKeyring {
  static type: string;

  type: string;

  _addressToOrigin: SnapWallet;

  _provider: any;

  _snapController: any;

  _pendingRequests: Map<string, DeferredPromise>;

  constructor() {
    this.type = type;
    this._addressToOrigin = new Map();
    this._pendingRequests = new Map();

    globalThis.__snapKeyring = this;
  }

  // keyrings cant take constructor arguments so we
  // late-set the provider
  setProvider(provider: any, snapController: any) {
    console.log('setProvider', provider, snapController);
    this._provider = provider;
    this._snapController = snapController;
  }

  async sendRequestToSnap(origin: Origin, request: any): Promise<any> {
    console.log('setProvider', this._provider, this._snapController);
    // return this._provider.request({
    //   method: 'wallet_invokeSnap',
    //   params: {
    //     snapId: origin,
    //     request,
    //   },
    // });
    return this._snapController.handleRequest({
      snapId: origin,
      origin: 'metamask',
      handler: HandlerType.OnRpcRequest,
      request,
    });
  }

  async sendSignatureRequestToSnap(origin: Origin, request: any): Promise<any> {
    console.log('sendSignatureRequest', origin, request);
    const resP = this.sendRequestToSnap(origin, {
      method: 'snap_keyring_sign_request',
      params: request,
    });
    console.log('sendSignatureRequest returned');
    try {
      const result = await resP;
      console.log('sendSignatureRequest resolved', result);
      return result;
    } catch (err) {
      console.log('sendSignatureRequest error', err);
      throw err;
    }
  }

  async handleKeyringSnapMessage(
    origin: Origin,
    message: any,
    saveSnapKeyring: Function,
  ): Promise<any> {
    const [methodName, params] = message;

    switch (methodName) {
      case 'create': {
        const address = params as Address;
        const added = this.createAccount(origin, address);
        if (added) {
          await saveSnapKeyring();
        }
        return added;
      }
      case 'read': {
        const accounts = this.listAccounts(origin);
        return accounts;
      }
      // case 'update': {

      // }
      case 'delete': {
        const address = params as Address;
        if (address) {
          const deleted = this.deleteAccount(address);
          if (deleted) {
            // include deleted address
            await saveSnapKeyring(address);
          }
          return deleted;
        }
        return;
      }

      case 'submit': {
        const { id, result } = params;
        console.log('submit', id, result);
        this.submitSignatureRequestResult(id, result);
        return true;
      }

      default:
        throw ethErrors.rpc.invalidParams({
          message: 'Must specify a valid snap_manageAccounts "methodName".',
        });
    }
  }

  /**
   * Convert the wallets in this keyring to a serialized form
   * suitable for persistence.
   *
   * This function is synchronous but uses an async signature
   * for consistency with other keyring implementations.
   */
  async serialize(): Promise<SerializedWallets> {
    const output: SerializedWallets = {};
    for (const [address, origin] of this._addressToOrigin.entries()) {
      output[address] = origin;
    }
    return output;
  }

  /**
   * Deserialize the given wallets into this keyring.
   *
   * This function is synchronous but uses an async signature
   * for consistency with other keyring implementations.
   *
   * @param wallets
   */
  async deserialize(wallets: SerializedWallets | undefined): Promise<void> {
    if (!wallets) {
      return;
    }
    for (const [address, origin] of Object.entries(wallets)) {
      this._addressToOrigin.set(address, origin);
    }
  }

  /**
   * Get an array of public addresses.
   */
  async getAccounts(): Promise<Address[]> {
    return Array.from(this._addressToOrigin.keys());
  }

  /**
   * Sign a transaction.
   *
   * @param address
   * @param tx
   * @param opts
   */
  async signTransaction(address: Address, tx: any, opts = {}) {
    const origin = this._addressToOrigin.get(address);
    if (origin === undefined) {
      throw new Error(`No origin found for address "${address}"`);
    }
    const id = uuidv4();
    const txParams = tx.toJSON();
    // forward to snap
    await this.sendSignatureRequestToSnap(origin, {
      id,
      method: 'eth_sendTransaction',
      params: [txParams],
    });
    const signingPromise = deferredPromise();
    console.log('new pending request', id);
    this._pendingRequests.set(id, signingPromise);
    // wait for signing to complete
    const sigHexString = (await signingPromise.promise) as unknown as string;
    const { v, r, s } = signatureHexStringToRsv(sigHexString);
    console.log('signTransaction', sigHexString);
    return tx._processSignature(v, r, s);
  }

  /**
   * Sign a message.
   *
   * @param address
   * @param data
   * @param opts
   */
  async signMessage(address: Address, data: any, opts = {}) {
    throw new Error('death to eth_sign!');
  }

  /**
   * Sign a message.
   *
   * @param address
   * @param data
   * @param opts
   */
  // KeyringController says this should return a Buffer but it actually expects a string.
  async signPersonalMessage(
    address: Address,
    data: any,
    opts = {},
  ): Promise<string> {
    const origin = this._addressToOrigin.get(address);
    if (origin === undefined) {
      throw new Error(`No origin found for address "${address}"`);
    }
    const id = uuidv4();
    // forward to snap
    await this.sendSignatureRequestToSnap(origin, {
      id,
      method: 'personal_sign',
      params: [data, address],
    });
    const signingPromise = deferredPromise();
    console.log('new pending request', id);
    this._pendingRequests.set(id, signingPromise);
    // wait for signing to complete
    const sigHexString = (await signingPromise.promise) as unknown as string;
    console.log('signPersonalMessage', sigHexString);
    return sigHexString;
  }

  /**
   * Gets the private data associated with the given address so
   * that it may be exported.
   *
   * If this keyring contains duplicate public keys the first
   * matching address is exported.
   *
   * Used by the UI to export an account.
   *
   * @param address
   */
  exportAccount(address: Address): [PublicKey, Json] | undefined {
    throw new Error('snap-keyring: "exportAccount" not supported');
  }

  /**
   * Removes the first account matching the given public address.
   *
   * @param address
   */
  removeAccount(address: Address): boolean {
    throw new Error('snap-keyring: "removeAccount" not supported');
  }

  /* SNAP RPC METHODS */

  /**
   * List the accounts for a snap origin.
   *
   * @param targetOrigin
   */
  listAccounts(targetOrigin: Origin): Address[] {
    return Array.from(this._addressToOrigin.entries())
      .filter(([address, origin]) => {
        return origin === targetOrigin;
      })
      .map(([address, origin]) => {
        return address;
      });
  }

  /**
   * Create an account for a snap origin.
   *
   * The account is only created if the public address does not
   * already exist.
   *
   * This checks for duplicates in the context of the snap origin but
   * not across all snaps. The keyring controller is responsible for checking
   * for duplicates across all addresses.
   *
   * @param origin
   * @param address
   */
  createAccount(origin: Origin, address: string): boolean {
    const exists = this._addressToOrigin.has(address);
    if (!exists) {
      this._addressToOrigin.set(address, origin);
      return true;
    }
    return false;
  }

  // /**
  //  *  Read the private data for an account belonging to a snap origin.
  //  */
  // readAccount(origin: Origin, address: string): Json {
  //   const accounts = this._addressToOrigin.get(address);
  //   const value = accounts.find((v) => arrayEquals(v[0], address));
  //   if (value) {
  //     const [, privateData] = value;
  //     return privateData;
  //   }
  //   return null;
  // }

  // /**
  //  *  Update the private data for the account belonging to the snap origin.
  //  *
  //  *  The account must already exist.
  //  */
  // updateAccount(origin: Origin, _address: string, value: Json): boolean {
  //   const address = Buffer.from(_address, "hex");
  //   const accounts = this._addressToOrigin.get(origin) || [];
  //   const exists = accounts.find((v) => arrayEquals(v[0], address));
  //   if (exists) {
  //     exists[1] = value;
  //     return true;
  //   }
  //   return false;
  // }

  /**
   * Delete the private data for an account belonging to a snap origin.
   *
   * @param address
   */
  deleteAccount(address: string): boolean {
    return this._addressToOrigin.delete(address);
  }

  deleteAccountsByOrigin(origin: Origin): void {
    for (const address of this.listAccounts(origin)) {
      this._addressToOrigin.delete(address);
    }
  }

  submitSignatureRequestResult(id: string, result: any): void {
    const signingPromise = this._pendingRequests.get(id);
    if (signingPromise === undefined) {
      console.warn(
        'submitSignatureRequestResult missing requested id',
        id,
        result,
      );
      return;
    }
    this._pendingRequests.delete(id);
    signingPromise.resolve(result);
  }
}

SnapKeyring.type = type;

export default SnapKeyring;

function signatureHexStringToRsv(signatureHexString: string) {
  const r = signatureHexString.slice(0, 66);
  const s = `0x${signatureHexString.slice(66, 130)}`;
  const v = parseInt(signatureHexString.slice(130, 132), 16);
  return { r, s, v };
}
