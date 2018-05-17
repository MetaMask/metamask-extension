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

  /**
   * This module is responsible for tracking any number of accounts and caching their current balances & transaction
   * counts.
   *
   * It also tracks transaction hashes, and checks their inclusion status on each new block.
   *
   * @typedef {Object} AccountTracker
   * @param {Object} opts Initialize various properties of the class.
   * @property {Object} store The stored object containing all accounts to track, as well as the current block's gas limit.
   * @property {Object} store.accounts The accounts currently stored in this AccountTracker
   * @property {string} store.currentBlockGasLimit A hex string indicating the gas limit of the current block
   * @property {Object} _provider A provider needed to create the EthQuery instance used within this AccountTracker.
   * @property {EthQuery} _query An EthQuery instance used to access account information from the blockchain
   * @property {BlockTracker} _blockTracker A BlockTracker instance. Needed to ensure that accounts and their info updates
   * when a new block is created.
   * @property {Object} _currentBlockNumber Reference to a property on the _blockTracker: the number (i.e. an id) of the the current block
   *
   */
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

  /**
   * Ensures that the locally stored accounts are in sync with a set of accounts stored externally to this
   * AccountTracker.
   *
   * Once this AccountTracker's accounts are up to date with those referenced by the passed addresses, each
   * of these accounts are given an updated balance via EthQuery.
   *
   * @param {array} address The array of hex addresses for accounts with which this AccountTracker's accounts should be
   * in sync
   *
   */
  syncWithAddresses (addresses) {
    const accounts = this.store.getState().accounts
    const locals = Object.keys(accounts)

    const toAdd = []
    addresses.forEach((upstream) => {
      if (!locals.includes(upstream)) {
        toAdd.push(upstream)
      }
    })

    const toRemove = []
    locals.forEach((local) => {
      if (!addresses.includes(local)) {
        toRemove.push(local)
      }
    })

    toAdd.forEach(upstream => this.addAccount(upstream))
    toRemove.forEach(local => this.removeAccount(local))
    this._updateAccounts()
  }

  /**
   * Adds a new address to this AccountTracker's accounts object, which points to an empty object. This object will be
   * given a balance as long this._currentBlockNumber is defined.
   *
   * @param {string} address A hex address of a new account to store in this AccountTracker's accounts object
   *
   */
  addAccount (address) {
    const accounts = this.store.getState().accounts
    accounts[address] = {}
    this.store.updateState({ accounts })
    if (!this._currentBlockNumber) return
    this._updateAccount(address)
  }

  /**
   * Removes an account from this AccountTracker's accounts object
   *
   * @param {string} address A hex address of a the account to remove
   *
   */
  removeAccount (address) {
    const accounts = this.store.getState().accounts
    delete accounts[address]
    this.store.updateState({ accounts })
  }

  /**
   * Given a block, updates this AccountTracker's currentBlockGasLimit, and then updates each local account's balance
   * via EthQuery
   *
   * @private
   * @param {object} block Data about the block that contains the data to update to.
   * @fires 'block' The updated state, if all account updates are successful
   *
   */
  _updateForBlock (block) {
    this._currentBlockNumber = block.number
    const currentBlockGasLimit = block.gasLimit

    this.store.updateState({ currentBlockGasLimit })

    async.parallel([
      this._updateAccounts.bind(this),
    ], (err) => {
      if (err) return console.error(err)
      this.emit('block', this.store.getState())
    })
  }

  /**
   * Calls this._updateAccount for each account in this.store
   *
   * @param {Function} cb A callback to pass to this._updateAccount, called after each account is successfully updated
   *
   */
  _updateAccounts (cb = noop) {
    const accounts = this.store.getState().accounts
    const addresses = Object.keys(accounts)
    async.each(addresses, this._updateAccount.bind(this), cb)
  }

  /**
   * Updates the current balance of an account. Gets an updated balance via this._getAccount.
   *
   * @private
   * @param {string} address A hex address of a the account to be updated
   * @param {Function} cb A callback to call once the account at address is successfully update
   *
   */
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

  /**
   * Gets the current balance of an account via EthQuery.
   *
   * @private
   * @param {string} address A hex address of a the account to query
   * @param {Function} cb A callback to call once the account at address is successfully update
   *
   */
  _getAccount (address, cb = noop) {
    const query = this._query
    async.parallel({
      balance: query.getBalance.bind(query, address),
    }, cb)
  }

}

module.exports = AccountTracker
