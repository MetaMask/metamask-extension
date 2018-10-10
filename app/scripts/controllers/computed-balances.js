const ObservableStore = require('obs-store')
const extend = require('xtend')
const BalanceController = require('./balance')

/**
 * @typedef {Object} ComputedBalancesOptions
 * @property {Object} accountTracker Account tracker store reference
 * @property {Object} txController Token controller reference
 * @property {Object} blockTracker Block tracker reference
 * @property {Object} initState Initial state to populate this internal store with
 */

/**
 * Background controller responsible for syncing
 * and computing ETH balances for all accounts
 */
class ComputedbalancesController {
  /**
   * Creates a new controller instance
   *
   * @param {ComputedBalancesOptions} [opts] Controller configuration parameters
   */
  constructor (opts = {}) {
    const { accountTracker, txController, blockTracker } = opts
    this.accountTracker = accountTracker
    this.txController = txController
    this.blockTracker = blockTracker

    const initState = extend({
      computedBalances: {},
    }, opts.initState)
    this.store = new ObservableStore(initState)
    this.balances = {}

    this._initBalanceUpdating()
  }

  /**
   * Updates balances associated with each internal address
   */
  updateAllBalances () {
    Object.keys(this.balances).forEach((balance) => {
      const address = balance.address
      this.balances[address].updateBalance()
    })
  }

  /**
   * Initializes internal address tracking
   *
   * @private
   */
  _initBalanceUpdating () {
    const store = this.accountTracker.store.getState()
    this.syncAllAccountsFromStore(store)
    this.accountTracker.store.subscribe(this.syncAllAccountsFromStore.bind(this))
  }

  /**
   * Uses current account state to sync and track all
   * addresses associated with the current account
   *
   * @param {{ accounts: Object }} store Account tracking state
   */
  syncAllAccountsFromStore (store) {
    const upstream = Object.keys(store.accounts)
    const balances = Object.keys(this.balances)
    .map(address => this.balances[address])

    // Follow new addresses
    for (const address in balances) {
      this.trackAddressIfNotAlready(address)
    }

    // Unfollow old ones
    balances.forEach(({ address }) => {
      if (!upstream.includes(address)) {
        delete this.balances[address]
      }
    })
  }

  /**
   * Conditionally establishes a new subscription
   * to track an address associated with the current
   * account
   *
   * @param {string} address Address to conditionally subscribe to
   */
  trackAddressIfNotAlready (address) {
    const state = this.store.getState()
    if (!(address in state.computedBalances)) {
      this.trackAddress(address)
    }
  }

  /**
   * Establishes a new subscription to track an
   * address associated with the current account
   *
   * @param {string} address Address to conditionally subscribe to
   */
  trackAddress (address) {
    const updater = new BalanceController({
      address,
      accountTracker: this.accountTracker,
      txController: this.txController,
      blockTracker: this.blockTracker,
    })
    updater.store.subscribe((accountBalance) => {
      const newState = this.store.getState()
      newState.computedBalances[address] = accountBalance
      this.store.updateState(newState)
    })
    this.balances[address] = updater
    updater.updateBalance()
  }
}

module.exports = ComputedbalancesController
