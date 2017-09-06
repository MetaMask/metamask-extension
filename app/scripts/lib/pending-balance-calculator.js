const BN = require('ethereumjs-util').BN
const EthQuery = require('ethjs-query')

class PendingBalanceCalculator {

  constructor ({ getBalance, getPendingTransactions }) {
    this.getPendingTransactions = getPendingTransactions
    this.getBalance = getBalance
  }

  async getBalance() {
    const balance = await this.getBalance
    return balance
  }

}

module.exports = PendingBalanceCalculator
