const BN = require('ethereumjs-util').BN
const EthQuery = require('ethjs-query')
const normalize = require('eth-sig-util').normalize

class PendingBalanceCalculator {

  constructor ({ getBalance, getPendingTransactions }) {
    this.getPendingTransactions = getPendingTransactions
    this.getBalance = getBalance
  }

  async getBalance() {
    console.log('getting balance')
    const results = await Promise.all([
      this.getBalance(),
      this.getPendingTransactions(),
    ])
    console.dir(results)

    const balance = results[0]
    const pending = results[1]

    console.dir({ balance, pending })

    const pendingValue = pending.reduce(function (total, tx) {
      return total.sub(this.valueFor(tx))
    }, new BN(0))

    const balanceBn = new BN(normalize(balance))

    return `0x${ balanceBn.sub(pendingValue).toString(16) }`
  }

  valueFor (tx) {
    const value = new BN(normalize(tx.txParams.value))
    return value
  }

}

module.exports = PendingBalanceCalculator
