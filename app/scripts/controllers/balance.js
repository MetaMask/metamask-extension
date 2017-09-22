const ObservableStore = require('obs-store')
const PendingBalanceCalculator = require('../lib/pending-balance-calculator')
const BN = require('ethereumjs-util').BN

class BalanceController {

  constructor (opts = {}) {
    const { address, accountTracker, txController } = opts
    this.address = address
    this.accountTracker = accountTracker
    this.txController = txController

    const initState = {
      ethBalance: undefined,
    }
    this.store = new ObservableStore(initState)

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
    const store = this.accountTracker.getState()
    const balances = store.accounts
    const entry = balances[this.address]
    const balance = entry.balance
    return balance ? new BN(balance.substring(2), 16) : undefined
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
