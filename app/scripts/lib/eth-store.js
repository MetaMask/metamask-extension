/* Ethereum Store
 *
 * This module is responsible for tracking any number of accounts
 * and caching their current balances & transaction counts.
 *
 * It also tracks transaction hashes, and checks their inclusion status
 * on each new block.
 */

const async = require('async')
const EthQuery = require('eth-query')
const ObservableStore = require('obs-store')
function noop() {}


class EthereumStore extends ObservableStore {

  constructor (opts = {}) {
    super({
      accounts: {},
      transactions: {},
    })
    this._provider = opts.provider
    this._query = new EthQuery(this._provider)
    this._blockTracker = opts.blockTracker
    // subscribe to latest block
    this._blockTracker.on('block', this._updateForBlock.bind(this))
    // blockTracker.currentBlock may be null
    this._currentBlockNumber = this._blockTracker.currentBlock
  }

  //
  // public
  //

  addAccount (address) {
    const accounts = this.getState().accounts
    accounts[address] = {}
    this.updateState({ accounts })
    if (!this._currentBlockNumber) return
    this._updateAccount(address)
  }

  removeAccount (address) {
    const accounts = this.getState().accounts
    delete accounts[address]
    this.updateState({ accounts })
  }

  addTransaction (txHash) {
    const transactions = this.getState().transactions
    transactions[txHash] = {}
    this.updateState({ transactions })
    if (!this._currentBlockNumber) return
    this._updateTransaction(this._currentBlockNumber, txHash, noop)
  }

  removeTransaction (txHash) {
    const transactions = this.getState().transactions
    delete transactions[txHash]
    this.updateState({ transactions })
  }


  //
  // private
  //

  _updateForBlock (block) {
    const blockNumber = '0x' + block.number.toString('hex')
    this._currentBlockNumber = blockNumber
    async.parallel([
      this._updateAccounts.bind(this),
      this._updateTransactions.bind(this, blockNumber),
    ], (err) => {
      if (err) return console.error(err)
      this.emit('block', this.getState())
    })
  }

  _updateAccounts (cb = noop) {
    const accounts = this.getState().accounts
    const addresses = Object.keys(accounts)
    async.each(addresses, this._updateAccount.bind(this), cb)
  }

  _updateAccount (address, cb = noop) {
    const accounts = this.getState().accounts
    this._getAccount(address, (err, result) => {
      if (err) return cb(err)
      result.address = address
      // only populate if the entry is still present
      if (accounts[address]) {
        accounts[address] = result
        this.updateState({ accounts })
      }
      cb(null, result)
    })
  }

  _updateTransactions (block, cb = noop) {
    const transactions = this.getState().transactions
    const txHashes = Object.keys(transactions)
    async.each(txHashes, this._updateTransaction.bind(this, block), cb)
  }

  _updateTransaction (block, txHash, cb = noop) {
    // would use the block here to determine how many confirmations the tx has
    const transactions = this.getState().transactions
    this._query.getTransaction(txHash, (err, result) => {
      if (err) return cb(err)
      // only populate if the entry is still present
      if (transactions[txHash]) {
        transactions[txHash] = result
        this.updateState({ transactions })
      }
      cb(null, result)
    })
  }

  _getAccount (address, cb = noop) {
    const query = this._query
    async.parallel({
      balance: query.getBalance.bind(query, address),
      nonce: query.getTransactionCount.bind(query, address),
      code: query.getCode.bind(query, address),
    }, cb)
  }

}

module.exports = EthereumStore