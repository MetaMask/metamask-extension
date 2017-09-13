const BN = require('ethereumjs-util').BN
const normalize = require('eth-sig-util').normalize

class PendingBalanceCalculator {

  // Must be initialized with two functions:
  // getBalance => Returns a promise of a BN of the current balance in Wei
  // getPendingTransactions => Returns an array of TxMeta Objects,
  // which have txParams properties, which include value, gasPrice, and gas,
  // all in a base=16 hex format.
  constructor ({ getBalance, getPendingTransactions }) {
    this.getPendingTransactions = getPendingTransactions
    this.getNetworkBalance = getBalance
  }

  async getBalance() {
    const results = await Promise.all([
      this.getNetworkBalance(),
      this.getPendingTransactions(),
    ])

    const balance = results[0]
    const pending = results[1]

    if (!balance) return undefined

    const pendingValue = pending.reduce((total, tx) => {
      return total.add(this.valueFor(tx))
    }, new BN(0))

    return `0x${balance.sub(pendingValue).toString(16)}`
  }

  valueFor (tx) {
    const txValue = tx.txParams.value
    const value = this.hexToBn(txValue)
    const gasPrice = this.hexToBn(tx.txParams.gasPrice)

    const gas = tx.txParams.gas
    const gasLimit = tx.txParams.gasLimit
    const gasLimitBn = this.hexToBn(gas || gasLimit)

    const gasCost = gasPrice.mul(gasLimitBn)
    return value.add(gasCost)
  }

  hexToBn (hex) {
    return new BN(normalize(hex).substring(2), 16)
  }

}

module.exports = PendingBalanceCalculator
