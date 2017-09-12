const ObservableStore = require('obs-store')
const normalizeAddress = require('eth-sig-util').normalize
const extend = require('xtend')
const PendingBalanceCalculator = require('../lib/pending-balance-calculator')

class BalanceController {

  constructor (opts = {}) {
    const { address, ethQuery, txController } = opts
    this.ethQuery = ethQuery
    this.txController = txController

    const initState = extend({
      ethBalance: undefined,
    }, opts.initState)
    this.store = new ObservableStore(initState)

    const { getBalance, getPendingTransactions } = opts
    this.balanceCalc = new PendingBalanceCalculator({
      getBalance,
      getPendingTransactions,
    })
    this.updateBalance()
  }

}

module.exports = BalanceController
