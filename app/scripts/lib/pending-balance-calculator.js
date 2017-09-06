const BN = require('ethereumjs-util').BN
const EthQuery = require('ethjs-query')

class PendingBalanceCalculator {

  constructor ({ getBalance, getPendingTransactions }) {
    this.getPendingTransactions = getPendingTransactions
    this.getBalance = getBalance
  }

  async getBalance() {
    const results = await Promise.all([
      this.getBalance(),
      this.getPendingTransactions(),
    ])

    const balance = results[0]
    const pending = results[1]

    return balance
  }

}

module.exports = PendingBalanceCalculator
