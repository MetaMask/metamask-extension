const ObservableStore = require('obs-store')
const extend = require('xtend')
const log = require('loglevel')

// every three seconds when an incomplete tx is waiting
const POLLING_INTERVAL = 3000

class ShapeshiftController {

    /**
     * Controller responsible for managing the list of shapeshift transactions. On construction, it initiates a poll
     * that queries a shapeshift.io API for updates to any pending shapeshift transactions
     *
     * @typedef {Object} ShapeshiftController
     * @param {object} opts Overrides the defaults for the initial state of this.store
     * @property {array} opts.initState  initializes the the state of the ShapeshiftController. Can contain an
     * shapeShiftTxList array.
     * @property {array} shapeShiftTxList An array of ShapeShiftTx objects
     *
     */
  constructor (opts = {}) {
    const initState = extend({
      shapeShiftTxList: [],
    }, opts.initState)
    this.store = new ObservableStore(initState)
    this.pollForUpdates()
  }

  /**
   * Represents, and contains data about, a single shapeshift transaction.
   * @typedef {Object} ShapeShiftTx
   * @property {string} depositAddress - An address at which to send a crypto deposit, so that eth can be sent to the
   * user's Metamask account
   * @property {string} depositType - An abbreviation of the type of crypto currency to be deposited.
   * @property {string} key - The 'shapeshift' key differentiates this from other types of txs in Metamask
   * @property {number} time - The time at which the tx was created
   * @property {object} response - Initiated as an empty object, which will be replaced by a Response object. @see {@link
   * https://developer.mozilla.org/en-US/docs/Web/API/Response}
   */

  //
  // PUBLIC METHODS
  //

  /**
   * A getter for the shapeShiftTxList property
   *
   * @returns {array<ShapeShiftTx>}
   *
   */
  getShapeShiftTxList () {
    const shapeShiftTxList = this.store.getState().shapeShiftTxList
    return shapeShiftTxList
  }

  /**
   * A getter for all ShapeShiftTx in the shapeShiftTxList that have not successfully completed a deposit.
   *
   * @returns {array<ShapeShiftTx>} Only includes ShapeShiftTx which has a response property with a status !== complete
   *
   */
  getPendingTxs () {
    const txs = this.getShapeShiftTxList()
    const pending = txs.filter(tx => tx.response && tx.response.status !== 'complete')
    return pending
  }

  /**
   * A poll that exists as long as there are pending transactions. Each call attempts to update the data of any
   * pendingTxs, and then calls itself again. If there are no pending txs, the recursive call is not made and
   * the polling stops.
   *
   * this.updateTx is used to attempt the update to the pendingTxs in the ShapeShiftTxList, and that updated data
   * is saved with saveTx.
   *
   */
  pollForUpdates () {
    const pendingTxs = this.getPendingTxs()

    if (pendingTxs.length === 0) {
      return
    }

    Promise.all(pendingTxs.map((tx) => {
      return this.updateTx(tx)
    }))
    .then((results) => {
      results.forEach(tx => this.saveTx(tx))
      this.timeout = setTimeout(this.pollForUpdates.bind(this), POLLING_INTERVAL)
    })
  }

    /**
     * Attempts to update a ShapeShiftTx with data from a shapeshift.io API. Both the response and time properties
     * can be updated. The response property is updated with every call, but the time property is only updated when
     * the response status updates to 'complete'. This will occur once the user makes a deposit as the ShapeShiftTx
     * depositAddress
     *
     * @param {ShapeShiftTx} tx The tx to update
     *
     */
  async updateTx (tx) {
    try {
      const url = `https://shapeshift.io/txStat/${tx.depositAddress}`
      const response = await fetch(url)
      const json = await response.json()
      tx.response = json
      if (tx.response.status === 'complete') {
        tx.time = new Date().getTime()
      }
      return tx
    } catch (err) {
      log.warn(err)
    }
  }

  /**
   * Saves an updated to a ShapeShiftTx in the shapeShiftTxList. If the passed ShapeShiftTx is not in the
   * shapeShiftTxList, nothing happens.
   *
   * @param {ShapeShiftTx} tx The updated tx to save, if it exists in the current shapeShiftTxList
   *
   */
  saveTx (tx) {
    const { shapeShiftTxList } = this.store.getState()
    const index = shapeShiftTxList.indexOf(tx)
    if (index !== -1) {
      shapeShiftTxList[index] = tx
      this.store.updateState({ shapeShiftTxList })
    }
  }

  /**
   * Removes a ShapeShiftTx from the shapeShiftTxList
   *
   * @param {ShapeShiftTx} tx The tx to remove
   *
   */
  removeShapeShiftTx () {
    const { shapeShiftTxList } = this.store.getState()
    const index = shapeShiftTxList.indexOf(index)
    if (index !== -1) {
      shapeShiftTxList.splice(index, 1)
    }
    this.updateState({ shapeShiftTxList })
  }

  /**
   * Creates a new ShapeShiftTx, adds it to the shapeShiftTxList, and initiates a new poll for updates of pending txs
   *
   * @param {string} depositAddress - An address at which to send a crypto deposit, so that eth can be sent to the
   * user's Metamask account
   * @param {string} depositType - An abbreviation of the type of crypto currency to be deposited.
   *
   */
  createShapeShiftTx (depositAddress, depositType) {
    const state = this.store.getState()
    let { shapeShiftTxList } = state

    var shapeShiftTx = {
      depositAddress,
      depositType,
      key: 'shapeshift',
      time: new Date().getTime(),
      response: {},
    }

    if (!shapeShiftTxList) {
      shapeShiftTxList = [shapeShiftTx]
    } else {
      shapeShiftTxList.push(shapeShiftTx)
    }

    this.store.updateState({ shapeShiftTxList })
    this.pollForUpdates()
  }

}

module.exports = ShapeshiftController
