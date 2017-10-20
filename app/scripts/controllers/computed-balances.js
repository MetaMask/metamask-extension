const ObservableStore = require('obs-store')
const extend = require('xtend')
const BalanceController = require('./balance')

class ComputedbalancesController {

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

  updateAllBalances () {
    Object.keys(this.balances).forEach((balance) => {
      const address = balance.address
      this.balances[address].updateBalance()
    })
  }

  _initBalanceUpdating () {
    const store = this.accountTracker.store.getState()
    this.syncAllAccountsFromStore(store)
    this.accountTracker.store.subscribe(this.syncAllAccountsFromStore.bind(this))
  }

  syncAllAccountsFromStore(store) {
    const upstream = Object.keys(store.accounts)
    const balances = Object.keys(this.balances)
    .map(address => this.balances[address])

    // Follow new addresses
    for (let address in balances) {
      this.trackAddressIfNotAlready(address)
    }

    // Unfollow old ones
    balances.forEach(({ address }) => {
      if (!upstream.includes(address)) {
        delete this.balances[address]
      }
    })
  }

  trackAddressIfNotAlready (address) {
    const state = this.store.getState()
    if (!(address in state.computedBalances)) {
      this.trackAddress(address)
    }
  }

  trackAddress (address) {
    let updater = new BalanceController({
      address,
      accountTracker: this.accountTracker,
      txController: this.txController,
      blockTracker: this.blockTracker,
    })
    updater.store.subscribe((accountBalance) => {
      let newState = this.store.getState()
      newState.computedBalances[address] = accountBalance
      this.store.updateState(newState)
    })
    this.balances[address] = updater
    updater.updateBalance()
  }
}

module.exports = ComputedbalancesController
