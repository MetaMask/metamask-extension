/* Account Tracker
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
const EventEmitter = require('events').EventEmitter
function noop () {}


class AccountTracker extends EventEmitter {

  constructor (opts = {}) {
    super()

    const initState = {
      accounts: {},
      currentBlockGasLimit: '',
    }
    this.store = new ObservableStore(initState)

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
    const accounts = this.store.getState().accounts
    accounts[address] = {}
    this.store.updateState({ accounts })
    if (!this._currentBlockNumber) return
    this._updateAccount(address)
  }

  removeAccount (address) {
    const accounts = this.store.getState().accounts
    delete accounts[address]
    this.store.updateState({ accounts })
  }

  //
  // private
  //

  _updateForBlock (block) {
    this._currentBlockNumber = block.number
    this.store.updateState({ currentBlockGasLimit: block.gasLimit })

    async.parallel([
      this._updateAccounts.bind(this),
    ], (err) => {
      if (err) return console.error(err)
      this.emit('block', this.store.getState())
    })
  }

  _updateAccounts (cb = noop) {
    const accounts = this.store.getState().accounts
    const addresses = Object.keys(accounts)
    async.each(addresses, this._updateAccount.bind(this), cb)
  }

  _updateAccount (address, cb = noop) {
    this._getAccount(address, (err, result) => {
      if (err) return cb(err)
      result.address = address
      const accounts = this.store.getState().accounts
      // only populate if the entry is still present
      if (accounts[address]) {
        accounts[address] = result
        this.store.updateState({ accounts })
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

module.exports = AccountTracker
