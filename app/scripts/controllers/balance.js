const ObservableStore = require('obs-store')
const PendingBalanceCalculator = require('../lib/pending-balance-calculator')
const BN = require('ethereumjs-util').BN

class BalanceController {

  /**
   * Controller responsible for storing and updating an account's balance.
   *
   * @typedef {Object} BalanceController
   * @param {Object} opts Initialize various properties of the class.
   * @property {string} address A base 16 hex string. The account address which has the balance managed by this
   * BalanceController.
   * @property {AccountTracker} accountTracker Stores and updates the users accounts
   * for which this BalanceController manages balance.
   * @property {TransactionController} txController Stores, tracks and manages transactions. Here used to create a listener for
   * transaction updates.
   * @property {BlockTracker} blockTracker Tracks updates to blocks. On new blocks, this BalanceController updates its balance
   * @property {Object} store The store for the ethBalance
   * @property {string} store.ethBalance A base 16 hex string. The balance for the current account.
   * @property {PendingBalanceCalculator} balanceCalc Used to calculate the accounts balance with possible pending
   * transaction costs taken into account.
   *
   */
  constructor (opts = {}) {
    this._validateParams(opts)
    const { address, accountTracker, txController, blockTracker } = opts

    this.address = address
    this.accountTracker = accountTracker
    this.txController = txController
    this.blockTracker = blockTracker

    const initState = {
      ethBalance: undefined,
    }
    this.store = new ObservableStore(initState)

    this.balanceCalc = new PendingBalanceCalculator({
      getBalance: () => this._getBalance(),
      getPendingTransactions: this._getPendingTransactions.bind(this),
    })

    this._registerUpdates()
  }

  /**
   * Updates the ethBalance property to the current pending balance
   *
   * @returns {Promise<void>} Promises undefined
   */
  async updateBalance () {
    const balance = await this.balanceCalc.getBalance()
    this.store.updateState({
      ethBalance: balance,
    })
  }

  /**
   * Sets up listeners and subscriptions which should trigger an update of ethBalance. These updates include:
   * - when a transaction changes state to 'submitted', 'confirmed' or 'failed'
   * - when the current account changes (i.e. a new account is selected)
   * - when there is a block update
   *
   * @private
   *
   */
  _registerUpdates () {
    const update = this.updateBalance.bind(this)

    this.txController.on('tx:status-update', (_, status) => {
      switch (status) {
        case 'submitted':
        case 'confirmed':
        case 'failed':
          update()
          return
        default:
          return
      }
    })
    this.accountTracker.store.subscribe(update)
    this.blockTracker.on('latest', update)
  }

  /**
   * Gets the balance, as a base 16 hex string, of the account at this BalanceController's current address.
   * If the current account has no balance, returns undefined.
   *
   * @returns {Promise<BN|void>} Promises a BN with a value equal to the balance of the current account, or undefined
   * if the current account has no balance
   *
   */
  async _getBalance () {
    const { accounts } = this.accountTracker.store.getState()
    const entry = accounts[this.address]
    const balance = entry.balance
    return balance ? new BN(balance.substring(2), 16) : undefined
  }

  /**
   * Gets the pending transactions (i.e. those with a 'submitted' status). These are accessed from the
   * TransactionController passed to this BalanceController during construction.
   *
   * @private
   * @returns {Promise<array>} Promises an array of transaction objects.
   *
   */
  async _getPendingTransactions () {
    const pending = this.txController.getFilteredTxList({
      from: this.address,
      status: 'submitted',
      err: undefined,
    })
    return pending
  }

  /**
   * Validates that the passed options have all required properties.
   *
   * @param {Object} opts The options object to validate
   * @throws {string} Throw a custom error indicating that address, accountTracker, txController and blockTracker are
   * missing and at least one is required
   *
   */
  _validateParams (opts) {
    const { address, accountTracker, txController, blockTracker } = opts
    if (!address || !accountTracker || !txController || !blockTracker) {
      const error = 'Cannot construct a balance checker without address, accountTracker, txController, and blockTracker.'
      throw new Error(error)
    }
  }

}

module.exports = BalanceController
