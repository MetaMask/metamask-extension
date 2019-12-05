const BN = require('ethereumjs-util').BN
const normalize = require('eth-sig-util').normalize

class PendingBalanceCalculator {

  /**
   * Used for calculating a users "pending balance": their current balance minus the total possible cost of all their
   * pending transactions.
   *
   * @typedef {Object} PendingBalanceCalculator
   * @param {Function} getBalance Returns a promise of a BN of the current balance in Wei
   * @param {Function} getPendingTransactions Returns an array of TxMeta Objects, which have txParams properties,
   * which include value, gasPrice, and gas, all in a base=16 hex format.
   *
   */
  constructor ({ getBalance, getPendingTransactions }) {
    this.getPendingTransactions = getPendingTransactions
    this.getNetworkBalance = getBalance
  }

  /**
   * Returns the users "pending balance": their current balance minus the total possible cost of all their
   * pending transactions.
   *
   * @returns {Promise<string>} Promises a base 16 hex string that contains the user's "pending balance"
   *
   */
  async getBalance () {
    const results = await Promise.all([
      this.getNetworkBalance(),
      this.getPendingTransactions(),
    ])

    const [ balance, pending ] = results
    if (!balance) return undefined

    const pendingValue = pending.reduce((total, tx) => {
      return total.add(this.calculateMaxCost(tx))
    }, new BN(0))

    return `0x${balance.sub(pendingValue).toString(16)}`
  }

  /**
   * Calculates the maximum possible cost of a single transaction, based on the value, gas price and gas limit.
   *
   * @param {object} tx Contains all that data about a transaction.
   * @property {object} tx.txParams Contains data needed to calculate the maximum cost of the transaction: gas,
   * gasLimit and value.
   *
   * @returns {string} Returns a base 16 hex string that contains the maximum possible cost of the transaction.
   */
  calculateMaxCost (tx) {
    const txValue = tx.txParams.value
    const value = this.hexToBn(txValue)
    const gasPrice = this.hexToBn(tx.txParams.gasPrice)

    const gas = tx.txParams.gas
    const gasLimit = tx.txParams.gasLimit
    const gasLimitBn = this.hexToBn(gas || gasLimit)

    const gasCost = gasPrice.mul(gasLimitBn)
    return value.add(gasCost)
  }

  /**
   * Converts a hex string to a BN object
   *
   * @param {string} hex A number represented as a hex string
   * @returns {Object} A BN object
   *
   */
  hexToBn (hex) {
    return new BN(normalize(hex).substring(2), 16)
  }

}

module.exports = PendingBalanceCalculator
