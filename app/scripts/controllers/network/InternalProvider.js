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

class InternalProvider extends BaseProvider {
  /**
   * @param {InternalProviderOptions} options - Options bag.
   */
  constructor({ chainId, isUnlocked, rpcMiddleware }) {
    super({ rpcMiddleware });

    this.handleChainChanged = this.handleChainChanged.bind(this);
    this.handleConnect = this.handleConnect.bind(this);
    this.handleDisconnect = this.handleDisconnect.bind(this);
    this.handleUnlockStateChanged = this.handleUnlockStateChanged.bind(this);
    this.sendAsync = this.sendAsync.bind(this);

    // TODO
    // This is meant to replace the following lines: https://github.com/MetaMask/eth-json-rpc-middleware/blob/main/src/providerFromEngine.ts#L27-L29
    // However, it's not clear to me that the legacy provider actually emitted
    // any notifications of this nature, and I don't think that anything had a
    // reference to the legacy provider's engine in order to emit notifications.
    // Forward notifications
    this._rpcEngine.on('notification', (payload) => {
      // Legacy / backwards compatibility event.
      this.emit('data', null, payload);

      // EIP-1193 'message' even notifications.
      if (isObject(payload)) {
        // This is the only notification we emit from the inpage provider.
        if (payload.method === 'eth_subscription') {
          this.emit('message', {
            type: payload.method,
            data: payload.params,
          });
        }
      }
    });

    this._initializeState({
      accounts: [],
      chainId,
      isUnlocked,
    });
  }

  //====================
  // Public Methods
  //====================

  /**
   * See {@link BaseProvider._handleChainChanged}.
   *
   * @param {string} chainId - The new chain ID.
   */
  handleChainChanged(chainId) {
    this._handleChainChanged({ chainId });
  }

  /**
   * See {@link BaseProvider._handleConnect}.
   *
   * @param {string} chainId - The connected chain ID.
   */
  handleConnect(chainId) {
    this._handleConnect(chainId);
  }

  /**
   * See {@link BaseProvider._handleDisconnect}.
   */
  handleDisconnect() {
    // `true` indicating that the disconnection is recoverable, which should
    // always be the case for our internal provider.
    // `false` would cause the provider instance to be torn down.
    this._handleDisconnect(true);
  }

  /**
   * See {@link BaseProvider._handleUnlockStateChanged}.
   *
   * @param {boolean} isUnlocked - Whether the extension is unlocked.
   */
  handleUnlockStateChanged(isUnlocked) {
    // Since this provider doesn't handle accounts, we just pass the isUnlocked
    // state.
    this._handleUnlockStateChanged({ accounts: [], isUnlocked });
  }

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
   * We override this method with a no-op because the internal provider does not
   * manage accounts.
   */
  _handleAccountsChanged() {
    return undefined;
  }

  /**
   * We override this method to reject requests for account-related methods
   * because the internal provider does not manage accounts.
   *
   * @param payload
   * @param callback
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

export function createInternalProvider({
  /* controllers etc. go here */
  chainId,
  isUnlocked,
  rpcMiddleware,
}) {
  const provider = new InternalProvider({
    chainId,
    isUnlocked,
    rpcMiddleware,
  });

  // Add these as event listeners where appropriate.
  // provider.handleChainChanged
  // provider.handleConnect
  // provider.handleDisconnect
  // provider.handleUnlockStateChanged
  return provider;
}
