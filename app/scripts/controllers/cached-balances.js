import ObservableStore from 'obs-store'

/**
 * @typedef {Object} CachedBalancesOptions
 * @property {Object} accountTracker An {@code AccountTracker} reference
 * @property {Function} getNetwork A function to get the current network
 * @property {Object} initState The initial controller state
 */

/**
 * Background controller responsible for maintaining
 * a cache of account balances in local storage
 */
export default class CachedBalancesController {
  /**
   * Creates a new controller instance
   *
   * @param {CachedBalancesOptions} [opts] Controller configuration parameters
   */
  constructor(opts = {}) {
    const { accountTracker, getNetwork } = opts

    this.accountTracker = accountTracker
    this.getNetwork = getNetwork

    const initState = { cachedBalances: {}, ...opts.initState }
    this.store = new ObservableStore(initState)

    this._registerUpdates()
  }

  /**
   * Updates the cachedBalances property for the current network. Cached balances will be updated to those in the passed accounts
   * if balances in the passed accounts are truthy.
   *
   * @param {Object} obj - The the recently updated accounts object for the current network
   * @returns {Promise<void>}
   */
  async updateCachedBalances({ accounts }) {
    const network = await this.getNetwork()
    const balancesToCache = await this._generateBalancesToCache(
      accounts,
      network,
    )
    this.store.updateState({
      cachedBalances: balancesToCache,
    })
  }

  _generateBalancesToCache(newAccounts, currentNetwork) {
    const { cachedBalances } = this.store.getState()
    const currentNetworkBalancesToCache = { ...cachedBalances[currentNetwork] }

    Object.keys(newAccounts).forEach((accountID) => {
      const account = newAccounts[accountID]

      if (account.balance) {
        currentNetworkBalancesToCache[accountID] = account.balance
      }
    })
    const balancesToCache = {
      ...cachedBalances,
      [currentNetwork]: currentNetworkBalancesToCache,
    }

    return balancesToCache
  }

  /**
   * Removes cachedBalances
   */

  clearCachedBalances() {
    this.store.updateState({ cachedBalances: {} })
  }

  /**
   * Sets up listeners and subscriptions which should trigger an update of cached balances. These updates will
   * happen when the current account changes. Which happens on block updates, as well as on network and account
   * selections.
   *
   * @private
   *
   */
  _registerUpdates() {
    const update = this.updateCachedBalances.bind(this)
    this.accountTracker.store.subscribe(update)
  }
}
