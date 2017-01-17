/* Ethereum Store
 *
 * This module is responsible for tracking any number of accounts
 * and caching their current balances & transaction counts.
 *
 * It also tracks transaction hashes, and checks their inclusion status
 * on each new block.
 */

const EventEmitter = require('events').EventEmitter
const inherits = require('util').inherits
const async = require('async')
const clone = require('clone')
const EthQuery = require('eth-query')

module.exports = EthereumStore


inherits(EthereumStore, EventEmitter)
function EthereumStore(engine) {
  const self = this
  EventEmitter.call(self)
  self._currentState = {
    accounts: {},
    transactions: {},
  }
  self._query = new EthQuery(engine)

  engine.on('block', self._updateForBlock.bind(self))
}

//
// public
//

EthereumStore.prototype.getState = function () {
  const self = this
  return clone(self._currentState)
}

EthereumStore.prototype.addAccount = function (address) {
  const self = this
  self._currentState.accounts[address] = {}
  self._didUpdate()
  if (!self.currentBlockNumber) return
  self._updateAccount(address, () => {
    self._didUpdate()
  })
}

EthereumStore.prototype.removeAccount = function (address) {
  const self = this
  delete self._currentState.accounts[address]
  self._didUpdate()
}

EthereumStore.prototype.addTransaction = function (txHash) {
  const self = this
  self._currentState.transactions[txHash] = {}
  self._didUpdate()
  if (!self.currentBlockNumber) return
  self._updateTransaction(self.currentBlockNumber, txHash, noop)
}

EthereumStore.prototype.removeTransaction = function (address) {
  const self = this
  delete self._currentState.transactions[address]
  self._didUpdate()
}


//
// private
//

EthereumStore.prototype._didUpdate = function () {
  const self = this
  var state = self.getState()
  self.emit('update', state)
}

EthereumStore.prototype._updateForBlock = function (block) {
  const self = this
  var blockNumber = '0x' + block.number.toString('hex')
  self.currentBlockNumber = blockNumber
  async.parallel([
    self._updateAccounts.bind(self),
    self._updateTransactions.bind(self, blockNumber),
  ], function (err) {
    if (err) return console.error(err)
    self.emit('block', self.getState())
    self._didUpdate()
  })
}

EthereumStore.prototype._updateAccounts = function (cb) {
  var accountsState = this._currentState.accounts
  var addresses = Object.keys(accountsState)
  async.each(addresses, this._updateAccount.bind(this), cb)
}

EthereumStore.prototype._updateAccount = function (address, cb) {
  var accountsState = this._currentState.accounts
  this.getAccount(address, function (err, result) {
    if (err) return cb(err)
    result.address = address
    // only populate if the entry is still present
    if (accountsState[address]) {
      accountsState[address] = result
    }
    cb(null, result)
  })
}

EthereumStore.prototype.getAccount = function (address, cb) {
  const query = this._query
  async.parallel({
    balance: query.getBalance.bind(query, address),
    nonce: query.getTransactionCount.bind(query, address),
    code: query.getCode.bind(query, address),
  }, cb)
}

EthereumStore.prototype._updateTransactions = function (block, cb) {
  const self = this
  var transactionsState = self._currentState.transactions
  var txHashes = Object.keys(transactionsState)
  async.each(txHashes, self._updateTransaction.bind(self, block), cb)
}

EthereumStore.prototype._updateTransaction = function (block, txHash, cb) {
  const self = this
  // would use the block here to determine how many confirmations the tx has
  var transactionsState = self._currentState.transactions
  self._query.getTransaction(txHash, function (err, result) {
    if (err) return cb(err)
    // only populate if the entry is still present
    if (transactionsState[txHash]) {
      transactionsState[txHash] = result
      self._didUpdate()
    }
    cb(null, result)
  })
}

function noop() {}
