import { BaseProvider } from '@metamask/providers';
import { isObject } from '@metamask/utils';

/**
 * @typedef {import('json-rpc-engine').JsonRpcMiddleware<unknown, unknown>} JsonRpcMiddleware
 */

/**
 * @typedef InternalProviderOptions
 * @property {string} chainId - The current chain ID.
 * @property {boolean} isUnlocked - Whether the extension is currently unlocked.
 * @property {JsonRpcMiddleware[]} rpcMiddleware - The middleware functions that
 * will be injected into the provider's internal `json-rpc-engine`. Must be a
 * complete middleware stack, meaning that it should be able to handle every
 * request.
 */

/**
 * The names of account-related methods.
 */
const AccountMethods = Object.freeze(['eth_accounts', 'eth_requestAccounts']);

/**
 * Stubs a method by setting it to `() => undefined`.
 *
 * @param {Record<string, unknown>} object - The object whose method to stub.
 * @param {string} methodName - The name of the method to stub.
 */
const stubMethod = (object, methodName) => {
  Object.defineProperty(object, methodName, {
    value: () => undefined,
    writable: false,
  });
};

/**
 * An internal background provider that hands off JSON-RPC requests to whatever
 * the current RPC endpoint is.
 *
 * Does not handle any notifications because there are no notifications for this
 * provider to emit.
 */
export class InternalProvider extends BaseProvider {
  /**
   * @param {InternalProviderOptions} options - Options bag.
   */
  constructor({ chainId, rpcMiddleware }) {
    super({ chainId, rpcMiddleware });

    // We should keep this around for compatibility with legacy code.
    this.sendAsync = this.sendAsync.bind(this);

    // Stub this before initializing state, because this provider does not
    // manage accounts.
    stubMethod(this, '_handleAccountsChanged');

    this._initializeState({
      accounts: [],
      chainId,
      isUnlocked: true,
    });

    // Stub all remaining event handlers other than `_handleChainChanged`,
    // because they are not relevant for the internal provider.
    stubMethod(this, '_handleConnect');
    stubMethod(this, '_handleDisconnect');
    stubMethod(this, '_handleUnlockStateChanged');
  }

  //====================
  // Public Methods
  //====================

  // TODO: See if we can get away with not adding `send`.
  // Otherwise, add with same signature as in `providerFromEngine` and tag as
  // deprecated.

  /**
   * Submits an RPC request per the given JSON-RPC request object.
   *
   * @deprecated For legacy code and backwards compatibility only. Use
   * {@link BaseProvider.request} instead.
   * @param payload - The RPC request object.
   * @param callback - The callback function.
   */
  sendAsync(payload, callback) {
    this._rpcRequest(payload, callback);
  }

  //====================
  // Private Methods
  //====================

  /**
   * We override this method to reject requests for account-related methods
   * because the internal provider does not manage accounts.
   *
   * @param payload - The RPC request.
   * @param callback - The callback function.
   */
  _rpcRequest(payload, callback) {
    if (isObject(payload) && AccountMethods.includes(payload.method)) {
      return callback(
        new Error('The internal provider does not manage accounts.'),
      );
    }
    return super._rpcRequest(payload, callback);
  }
}
