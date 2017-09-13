const extend = require('xtend')
const EventEmitter = require('events')
const ObservableStore = require('obs-store')
const ethUtil = require('ethereumjs-util')
const txStateHistoryHelper = require('./tx-state-history-helper')

module.exports = class TransactionStateManger extends EventEmitter {
  constructor ({initState, txHistoryLimit, getNetwork}) {
    super()

    this.store = new ObservableStore(
      extend({
        transactions: [],
    }, initState))
    this.txHistoryLimit = txHistoryLimit
    this.getNetwork = getNetwork
  }
    // Returns the number of txs for the current network.
  getTxCount () {
    return this.getTxList().length
  }

  getTxList () {
    const network = this.getNetwork()
    const fullTxList = this.getFullTxList()
    return fullTxList.filter((txMeta) => txMeta.metamaskNetworkId === network)
  }

  getFullTxList () {
    return this.store.getState().transactions
  }

  // Returns the tx list

  getUnapprovedTxList () {
    const txList = this.getTxsByMetaData('status', 'unapproved')
    return txList.reduce((result, tx) => {
      result[tx.id] = tx
      return result
    }, {})
  }

  getPendingTransactions (address) {
    const opts = { status: 'submitted' }
    if (address) opts.from = address
    return this.getFilteredTxList(opts)
  }

  addTx (txMeta) {
    this.once(`${txMeta.id}:signed`, function (txId) {
      this.removeAllListeners(`${txMeta.id}:rejected`)
    })
    this.once(`${txMeta.id}:rejected`, function (txId) {
      this.removeAllListeners(`${txMeta.id}:signed`)
    })
    // initialize history
    txMeta.history = []
    // capture initial snapshot of txMeta for history
    const snapshot = txStateHistoryHelper.snapshotFromTxMeta(txMeta)
    txMeta.history.push(snapshot)

    const transactions = this.getFullTxList()
    const txCount = this.getTxCount()
    const txHistoryLimit = this.txHistoryLimit

    // checks if the length of the tx history is
    // longer then desired persistence limit
    // and then if it is removes only confirmed
    // or rejected tx's.
    // not tx's that are pending or unapproved
    if (txCount > txHistoryLimit - 1) {
      const index = transactions.findIndex((metaTx) => ((metaTx.status === 'confirmed' || metaTx.status === 'rejected')))
      transactions.splice(index, 1)
    }
    transactions.push(txMeta)
    this._saveTxList(transactions)
    return txMeta
  }
  // gets tx by Id and returns it
  getTx (txId) {
    const txMeta = this.getTxsByMetaData('id', txId)[0]
    return txMeta
  }

  updateTx (txMeta) {
    if (txMeta.txParams) {
      Object.keys(txMeta.txParams).forEach((key) => {
        let value = txMeta.txParams[key]
        if (typeof value !== 'string') console.error(`${key}: ${value} in txParams is not a string`)
        if (!ethUtil.isHexPrefixed(value)) console.error('is not hex prefixed, anything on txParams must be hex prefixed')
      })
    }

    // create txMeta snapshot for history
    const currentState = txStateHistoryHelper.snapshotFromTxMeta(txMeta)
    // recover previous tx state obj
    const previousState = txStateHistoryHelper.replayHistory(txMeta.history)
    // generate history entry and add to history
    const entry = txStateHistoryHelper.generateHistoryEntry(previousState, currentState)
   txMeta.history.push(entry)

    // commit txMeta to state
    const txId = txMeta.id
    const txList = this.getFullTxList()
    const index = txList.findIndex(txData => txData.id === txId)
    txList[index] = txMeta
    this._saveTxList(txList)
  }


  // merges txParams obj onto txData.txParams
  // use extend to ensure that all fields are filled
  updateTxParams (txId, txParams) {
    const txMeta = this.getTx(txId)
    txMeta.txParams = extend(txMeta.txParams, txParams)
    this.updateTx(txMeta)
  }

/*
  Takes an object of fields to search for eg:
  let thingsToLookFor = {
    to: '0x0..',
    from: '0x0..',
    status: 'signed',
    err: undefined,
  }
  and returns a list of tx with all
  options matching

  ****************HINT****************
  | `err: undefined` is like looking |
  | for a tx with no err             |
  | so you can also search txs that  |
  | dont have something as well by   |
  | setting the value as undefined   |
  ************************************

  this is for things like filtering a the tx list
  for only tx's from 1 account
  or for filltering for all txs from one account
  and that have been 'confirmed'
  */
  getFilteredTxList (opts, initialList) {
    let filteredTxList = initialList
    Object.keys(opts).forEach((key) => {
      filteredTxList = this.getTxsByMetaData(key, opts[key], filteredTxList)
    })
    return filteredTxList
  }

  getTxsByMetaData (key, value, txList = this.getTxList()) {
    return txList.filter((txMeta) => {
      if (txMeta.txParams[key]) {
        return txMeta.txParams[key] === value
      } else {
        return txMeta[key] === value
      }
    })
  }

  // STATUS METHODS
  // statuses:
  //    - `'unapproved'` the user has not responded
  //    - `'rejected'` the user has responded no!
  //    - `'approved'` the user has approved the tx
  //    - `'signed'` the tx is signed
  //    - `'submitted'` the tx is sent to a server
  //    - `'confirmed'` the tx has been included in a block.
  //    - `'failed'` the tx failed for some reason, included on tx data.

  // get::set status

  // should return the status of the tx.
  getTxStatus (txId) {
    const txMeta = this.getTx(txId)
    return txMeta.status
  }

  // should update the status of the tx to 'rejected'.
  setTxStatusRejected (txId) {
    this._setTxStatus(txId, 'rejected')
  }

  // should update the status of the tx to 'approved'.
  setTxStatusApproved (txId) {
    this._setTxStatus(txId, 'approved')
  }

  // should update the status of the tx to 'signed'.
  setTxStatusSigned (txId) {
    this._setTxStatus(txId, 'signed')
  }

  // should update the status of the tx to 'submitted'.
  setTxStatusSubmitted (txId) {
    this._setTxStatus(txId, 'submitted')
  }

  // should update the status of the tx to 'confirmed'.
  setTxStatusConfirmed (txId) {
    this._setTxStatus(txId, 'confirmed')
  }

  setTxStatusFailed (txId, err) {
    const txMeta = this.getTx(txId)
    txMeta.err = {
      message: err.toString(),
      stack: err.stack,
    }
    this.updateTx(txMeta)
    this._setTxStatus(txId, 'failed')
  }

//
//           PRIVATE METHODS
//

  //  Should find the tx in the tx list and
  //  update it.
  //  should set the status in txData
  //    - `'unapproved'` the user has not responded
  //    - `'rejected'` the user has responded no!
  //    - `'approved'` the user has approved the tx
  //    - `'signed'` the tx is signed
  //    - `'submitted'` the tx is sent to a server
  //    - `'confirmed'` the tx has been included in a block.
  //    - `'failed'` the tx failed for some reason, included on tx data.
  _setTxStatus (txId, status) {
    const txMeta = this.getTx(txId)
    txMeta.status = status
    this.emit(`${txMeta.id}:${status}`, txId)
    if (status === 'submitted' || status === 'rejected') {
      this.emit(`${txMeta.id}:finished`, txMeta)
    }
    this.updateTx(txMeta)
    this.emit('updateBadge')
  }

  // Saves the new/updated txList.
  // Function is intended only for internal use
  _saveTxList (transactions) {
    this.store.updateState({ transactions })
  }
}