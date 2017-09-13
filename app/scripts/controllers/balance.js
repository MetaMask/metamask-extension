const ObservableStore = require('obs-store')
const normalizeAddress = require('eth-sig-util').normalize
const extend = require('xtend')
const PendingBalanceCalculator = require('../lib/pending-balance-calculator')
const BN = require('ethereumjs-util').BN

class BalanceController {

  constructor (opts = {}) {
    const { address, ethStore, txController } = opts
    this.address = address
    this.ethStore = ethStore
    this.txController = txController

    const initState = extend({
      ethBalance: undefined,
    }, opts.initState)
    this.store = new ObservableStore(initState)

    const { getBalance, getPendingTransactions } = opts
    this.balanceCalc = new PendingBalanceCalculator({
      getBalance: () => Promise.resolve(this._getBalance()),
      getPendingTransactions: this._getPendingTransactions.bind(this),
    })

    this.registerUpdates()
  }

  async updateBalance () {
    const balance = await this.balanceCalc.getBalance()
    this.store.updateState({
      ethBalance: balance,
    })
  }

  registerUpdates () {
    const update = this.updateBalance.bind(this)
    this.txController.on('submitted', update)
    this.txController.on('confirmed', update)
    this.txController.on('failed', update)
    this.txController.blockTracker.on('block', update)
  }

  _getBalance () {
    const store = this.ethStore.getState()
    const balances = store.accounts
    const entry = balances[this.address]
    const balance = entry.balance
    return balance ? new BN(balance.substring(2), 16) : new BN(0)
  }

  _getPendingTransactions () {
    const pending = this.txController.getFilteredTxList({
      from: this.address,
      status: 'submitted',
      err: undefined,
    })
    return Promise.resolve(pending)
  }

}

module.exports = BalanceController
