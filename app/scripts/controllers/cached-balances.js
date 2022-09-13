import { ObservableStore } from '@metamask/obs-store';

/**
 * @typedef {object} CachedBalancesOptions
 * @property {object} accountTracker An {@code AccountTracker} reference
 * @property {Function} getCurrentChainId A function to get the current chain id
 * @property {object} initState The initial controller state
 */

/**
 * Background controller responsible for maintaining
 * a cache of account balances in local storage
 */
export default class CachedBalancesController {
  /**
   * Creates a new controller instance
   *
   * @param {CachedBalancesOptions} [opts] - Controller configuration parameters
   */
  constructor(opts = {}) {
    const { accountTracker, getCurrentChainId } = opts;

    this.accountTracker = accountTracker;
    this.getCurrentChainId = getCurrentChainId;

    const initState = { cachedBalances: {}, ...opts.initState };
    this.store = new ObservableStore(initState);

    this._registerUpdates();
  }

  /**
   * Updates the cachedBalances property for the current chain. Cached balances will be updated to those in the passed accounts
   * if balances in the passed accounts are truthy.
   *
   * @param {object} obj - The the recently updated accounts object for the current chain
   * @param obj.accounts
   * @returns {Promise<void>}
   */
  async updateCachedBalances({ accounts }) {
    const chainId = this.getCurrentChainId();
    const balancesToCache = await this._generateBalancesToCache(
      accounts,
      chainId,
    );
    this.store.updateState({
      cachedBalances: balancesToCache,
    });
  }

  _generateBalancesToCache(newAccounts, chainId) {
    const { cachedBalances } = this.store.getState();
    const currentChainBalancesToCache = { ...cachedBalances[chainId] };

    Object.keys(newAccounts).forEach((accountID) => {
      const account = newAccounts[accountID];

      if (account.balance) {
        currentChainBalancesToCache[accountID] = account.balance;
      }
    });
    const balancesToCache = {
      ...cachedBalances,
      [chainId]: currentChainBalancesToCache,
    };

    return balancesToCache;
  }

  /**
   * Removes cachedBalances
   */

  clearCachedBalances() {
    this.store.updateState({ cachedBalances: {} });
  }

  /**
   * Sets up listeners and subscriptions which should trigger an update of cached balances. These updates will
   * happen when the current account changes. Which happens on block updates, as well as on network and account
   * selections.
   *
   * @private
   */
  _registerUpdates() {
    const update = this.updateCachedBalances.bind(this);
    this.accountTracker.store.subscribe(update);
  }
}
