const BN = require('ethereumjs-util').BN
const EthQuery = require('ethjs-query')
const normalize = require('eth-sig-util').normalize

class PendingBalanceCalculator {

  constructor ({ getBalance, getPendingTransactions }) {
    this.getPendingTransactions = getPendingTransactions
    this.getNetworkBalance = getBalance
  }

  async getBalance() {
    console.log('getting balance')
    const results = await Promise.all([
      this.getNetworkBalance(),
      this.getPendingTransactions(),
    ])
    console.dir(results)

    const balance = results[0]
    const pending = results[1]

    console.dir({ balance, pending })
    console.dir(pending)

    const pendingValue = pending.reduce(function (total, tx) {
      return total.add(this.valueFor(tx))
    }, new BN(0))

    const balanceBn = new BN(normalize(balance))
    console.log(`subtracting ${pendingValue.toString()} from ${balanceBn.toString()}`)

    return `0x${ balanceBn.sub(pendingValue).toString(16) }`
  }

  valueFor (tx) {
    const txValue = tx.txParams.value
    const normalized = normalize(txValue).substring(2)
    console.log({ txValue, normalized })
    const value = new BN(normalize(txValue).substring(2), 16)
    return value
  }

}

module.exports = PendingBalanceCalculator
