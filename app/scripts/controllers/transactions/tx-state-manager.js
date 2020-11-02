import EventEmitter from 'safe-event-emitter'
import ObservableStore from 'obs-store'
import log from 'loglevel'
import createId from '../../lib/random-id'
import {
  generateHistoryEntry,
  replayHistory,
  snapshotFromTxMeta,
} from './lib/tx-state-history-helpers'
import { getFinalStates, normalizeTxParams } from './lib/util'

/**
  TransactionStateManager is responsible for the state of a transaction and
  storing the transaction
  it also has some convenience methods for finding subsets of transactions
  *
  *STATUS METHODS
  <br>statuses:
  <br>   - `'unapproved'` the user has not responded
  <br>   - `'rejected'` the user has responded no!
  <br>   - `'approved'` the user has approved the tx
  <br>   - `'signed'` the tx is signed
  <br>   - `'submitted'` the tx is sent to a server
  <br>   - `'confirmed'` the tx has been included in a block.
  <br>   - `'failed'` the tx failed for some reason, included on tx data.
  <br>   - `'dropped'` the tx nonce was already used
  @param {Object} opts
  @param {Object} [opts.initState={ transactions: [] }] initial transactions list with the key transaction {array}
  @param {number} [opts.txHistoryLimit] limit for how many finished
  transactions can hang around in state
  @param {function} opts.getNetwork return network number
  @class
*/
export default class TransactionStateManager extends EventEmitter {
  constructor({ initState, txHistoryLimit, getNetwork }) {
    super()

    this.store = new ObservableStore({ transactions: [], ...initState })
    this.txHistoryLimit = txHistoryLimit
    this.getNetwork = getNetwork
  }

  /**
    @param {Object} opts - the object to use when overwriting defaults
    @returns {txMeta} - the default txMeta object
  */
  generateTxMeta(opts) {
    const netId = this.getNetwork()
    if (netId === 'loading') {
      throw new Error('MetaMask is having trouble connecting to the network')
    }
    return {
      id: createId(),
      time: new Date().getTime(),
      status: 'unapproved',
      metamaskNetworkId: netId,
      loadingDefaults: true,
      ...opts,
    }
  }

  /**
   * Returns the full tx list for the current network
   *
   * The list is iterated backwards as new transactions are pushed onto it.
   *
   * @param {number} [limit] a limit for the number of transactions to return
   * @returns {Object[]} The {@code txMeta}s, filtered to the current network
   */
  getTxList(limit) {
    const network = this.getNetwork()
    const fullTxList = this.getFullTxList()

    const nonces = new Set()
    const txs = []
    for (let i = fullTxList.length - 1; i > -1; i--) {
      const txMeta = fullTxList[i]
      if (txMeta.metamaskNetworkId !== network) {
        continue
      }

      if (limit !== undefined) {
        const { nonce } = txMeta.txParams
        if (!nonces.has(nonce)) {
          if (nonces.size < limit) {
            nonces.add(nonce)
          } else {
            continue
          }
        }
      }

      txs.unshift(txMeta)
    }
    return txs
  }

  /**
    @returns {array} - of all the txMetas in store
  */
  getFullTxList() {
    return this.store.getState().transactions
  }

  /**
    @returns {array} - the tx list whose status is unapproved
  */
  getUnapprovedTxList() {
    const txList = this.getTxsByMetaData('status', 'unapproved')
    return txList.reduce((result, tx) => {
      result[tx.id] = tx
      return result
    }, {})
  }

  /**
    @param [address] {string} - hex prefixed address to sort the txMetas for [optional]
    @returns {array} - the tx list whose status is approved if no address is provide
    returns all txMetas who's status is approved for the current network
  */
  getApprovedTransactions(address) {
    const opts = { status: 'approved' }
    if (address) {
      opts.from = address
    }
    return this.getFilteredTxList(opts)
  }

  /**
    @param [address] {string} - hex prefixed address to sort the txMetas for [optional]
    @returns {array} - the tx list whose status is submitted if no address is provide
    returns all txMetas who's status is submitted for the current network
  */
  getPendingTransactions(address) {
    const opts = { status: 'submitted' }
    if (address) {
      opts.from = address
    }
    return this.getFilteredTxList(opts)
  }

  /**
    @param [address] {string} - hex prefixed address to sort the txMetas for [optional]
    @returns {array} - the tx list whose status is confirmed if no address is provide
    returns all txMetas who's status is confirmed for the current network
  */
  getConfirmedTransactions(address) {
    const opts = { status: 'confirmed' }
    if (address) {
      opts.from = address
    }
    return this.getFilteredTxList(opts)
  }

  /**
    Adds the txMeta to the list of transactions in the store.
    if the list is over txHistoryLimit it will remove a transaction that
    is in its final state
    it will also add the key `history` to the txMeta with the snap shot of the original
    object
    @param {Object} txMeta
    @returns {Object} - the txMeta
  */
  addTx(txMeta) {
    // normalize and validate txParams if present
    if (txMeta.txParams) {
      txMeta.txParams = this.normalizeAndValidateTxParams(txMeta.txParams)
    }

    this.once(`${txMeta.id}:signed`, () => {
      this.removeAllListeners(`${txMeta.id}:rejected`)
    })
    this.once(`${txMeta.id}:rejected`, () => {
      this.removeAllListeners(`${txMeta.id}:signed`)
    })
    // initialize history
    txMeta.history = []
    // capture initial snapshot of txMeta for history
    const snapshot = snapshotFromTxMeta(txMeta)
    txMeta.history.push(snapshot)

    const transactions = this.getFullTxList()
    const txCount = transactions.length
    const { txHistoryLimit } = this

    // checks if the length of the tx history is
    // longer then desired persistence limit
    // and then if it is removes only confirmed
    // or rejected tx's.
    // not tx's that are pending or unapproved
    if (txCount > txHistoryLimit - 1) {
      const index = transactions.findIndex((metaTx) => {
        return getFinalStates().includes(metaTx.status)
      })
      if (index !== -1) {
        transactions.splice(index, 1)
      }
    }
    const newTxIndex = transactions.findIndex(
      (currentTxMeta) => currentTxMeta.time > txMeta.time,
    )

    newTxIndex === -1
      ? transactions.push(txMeta)
      : transactions.splice(newTxIndex, 0, txMeta)
    this._saveTxList(transactions)
    return txMeta
  }

  /**
    @param {number} txId
    @returns {Object} - the txMeta who matches the given id if none found
    for the network returns undefined
  */
  getTx(txId) {
    const txMeta = this.getTxsByMetaData('id', txId)[0]
    return txMeta
  }

  /**
    updates the txMeta in the list and adds a history entry
    @param {Object} txMeta - the txMeta to update
    @param {string} [note] - a note about the update for history
  */
  updateTx(txMeta, note) {
    // normalize and validate txParams if present
    if (txMeta.txParams) {
      txMeta.txParams = this.normalizeAndValidateTxParams(txMeta.txParams)
    }

    // create txMeta snapshot for history
    const currentState = snapshotFromTxMeta(txMeta)
    // recover previous tx state obj
    const previousState = replayHistory(txMeta.history)
    // generate history entry and add to history
    const entry = generateHistoryEntry(previousState, currentState, note)
    if (entry.length) {
      txMeta.history.push(entry)
    }

    // commit txMeta to state
    const txId = txMeta.id
    const txList = this.getFullTxList()
    const index = txList.findIndex((txData) => txData.id === txId)
    txList[index] = txMeta
    this._saveTxList(txList)
  }

  /**
    merges txParams obj onto txMeta.txParams
    use extend to ensure that all fields are filled
    @param {number} txId - the id of the txMeta
    @param {Object} txParams - the updated txParams
  */
  updateTxParams(txId, txParams) {
    const txMeta = this.getTx(txId)
    txMeta.txParams = { ...txMeta.txParams, ...txParams }
    this.updateTx(txMeta, `txStateManager#updateTxParams`)
  }

  /**
   * normalize and validate txParams members
   * @param {Object} txParams - txParams
   */
  normalizeAndValidateTxParams(txParams) {
    if (typeof txParams.data === 'undefined') {
      delete txParams.data
    }
    // eslint-disable-next-line no-param-reassign
    txParams = normalizeTxParams(txParams, false)
    this.validateTxParams(txParams)
    return txParams
  }

  /**
    validates txParams members by type
    @param {Object} txParams - txParams to validate
  */
  validateTxParams(txParams) {
    Object.keys(txParams).forEach((key) => {
      const value = txParams[key]
      // validate types
      switch (key) {
        case 'chainId':
          if (typeof value !== 'number' && typeof value !== 'string') {
            throw new Error(
              `${key} in txParams is not a Number or hex string. got: (${value})`,
            )
          }
          break
        default:
          if (typeof value !== 'string') {
            throw new Error(
              `${key} in txParams is not a string. got: (${value})`,
            )
          }
          break
      }
    })
  }

  /**
  @param {Object} opts -  an object of fields to search for eg:<br>
  let <code>thingsToLookFor = {<br>
    to: '0x0..',<br>
    from: '0x0..',<br>
    status: 'signed', \\ (status) => status !== 'rejected' give me all txs who's status is not rejected<br>
    err: undefined,<br>
  }<br></code>
  optionally the values of the keys can be functions for situations like where
  you want all but one status.
  @param [initialList=this.getTxList()]
  @returns {array} - array of txMeta with all
  options matching
  */
  /*
  ****************HINT****************
  | `err: undefined` is like looking |
  | for a tx with no err             |
  | so you can also search txs that  |
  | dont have something as well by   |
  | setting the value as undefined   |
  ************************************

  this is for things like filtering a the tx list
  for only tx's from 1 account
  or for filtering for all txs from one account
  and that have been 'confirmed'
  */
  getFilteredTxList(opts, initialList) {
    let filteredTxList = initialList
    Object.keys(opts).forEach((key) => {
      filteredTxList = this.getTxsByMetaData(key, opts[key], filteredTxList)
    })
    return filteredTxList
  }

  /**

    @param {string} key - the key to check
    @param value - the value your looking for can also be a function that returns a bool
    @param [txList=this.getTxList()] {array} - the list to search. default is the txList
    from txStateManager#getTxList
    @returns {array} - a list of txMetas who matches the search params
  */
  getTxsByMetaData(key, value, txList = this.getTxList()) {
    const filter = typeof value === 'function' ? value : (v) => v === value

    return txList.filter((txMeta) => {
      if (key in txMeta.txParams) {
        return filter(txMeta.txParams[key])
      }
      return filter(txMeta[key])
    })
  }

  // get::set status

  /**
    @param {number} txId - the txMeta Id
    @returns {string} - the status of the tx.
  */
  getTxStatus(txId) {
    const txMeta = this.getTx(txId)
    return txMeta.status
  }

  /**
    should update the status of the tx to 'rejected'.
    @param {number} txId - the txMeta Id
  */
  setTxStatusRejected(txId) {
    this._setTxStatus(txId, 'rejected')
    this._removeTx(txId)
  }

  /**
    should update the status of the tx to 'unapproved'.
    @param {number} txId - the txMeta Id
  */
  setTxStatusUnapproved(txId) {
    this._setTxStatus(txId, 'unapproved')
  }

  /**
    should update the status of the tx to 'approved'.
    @param {number} txId - the txMeta Id
  */
  setTxStatusApproved(txId) {
    this._setTxStatus(txId, 'approved')
  }

  /**
    should update the status of the tx to 'signed'.
    @param {number} txId - the txMeta Id
  */
  setTxStatusSigned(txId) {
    this._setTxStatus(txId, 'signed')
  }

  /**
    should update the status of the tx to 'submitted'.
    and add a time stamp for when it was called
    @param {number} txId - the txMeta Id
  */
  setTxStatusSubmitted(txId) {
    const txMeta = this.getTx(txId)
    txMeta.submittedTime = new Date().getTime()
    this.updateTx(txMeta, 'txStateManager - add submitted time stamp')
    this._setTxStatus(txId, 'submitted')
  }

  /**
    should update the status of the tx to 'confirmed'.
    @param {number} txId - the txMeta Id
  */
  setTxStatusConfirmed(txId) {
    this._setTxStatus(txId, 'confirmed')
  }

  /**
    should update the status of the tx to 'dropped'.
    @param {number} txId - the txMeta Id
  */
  setTxStatusDropped(txId) {
    this._setTxStatus(txId, 'dropped')
  }

  /**
    should update the status of the tx to 'failed'.
    and put the error on the txMeta
    @param {number} txId - the txMeta Id
    @param {erroObject} err - error object
  */
  setTxStatusFailed(txId, err) {
    const error = err || new Error('Internal metamask failure')

    const txMeta = this.getTx(txId)
    txMeta.err = {
      message: error.toString(),
      rpc: error.value,
      stack: error.stack,
    }
    this.updateTx(txMeta, 'transactions:tx-state-manager#fail - add error')
    this._setTxStatus(txId, 'failed')
  }

  /**
    Removes transaction from the given address for the current network
    from the txList
    @param {string} address - hex string of the from address on the txParams to remove
  */
  wipeTransactions(address) {
    // network only tx
    const txs = this.getFullTxList()
    const network = this.getNetwork()

    // Filter out the ones from the current account and network
    const otherAccountTxs = txs.filter(
      (txMeta) =>
        !(
          txMeta.txParams.from === address &&
          txMeta.metamaskNetworkId === network
        ),
    )

    // Update state
    this._saveTxList(otherAccountTxs)
  }
  //
  //           PRIVATE METHODS
  //

  // STATUS METHODS
  // statuses:
  //    - `'unapproved'` the user has not responded
  //    - `'rejected'` the user has responded no!
  //    - `'approved'` the user has approved the tx
  //    - `'signed'` the tx is signed
  //    - `'submitted'` the tx is sent to a server
  //    - `'confirmed'` the tx has been included in a block.
  //    - `'failed'` the tx failed for some reason, included on tx data.
  //    - `'dropped'` the tx nonce was already used

  /**
    @param {number} txId - the txMeta Id
    @param {string} status - the status to set on the txMeta
    @emits tx:status-update - passes txId and status
    @emits ${txMeta.id}:finished - if it is a finished state. Passes the txMeta
    @emits update:badge
  */
  _setTxStatus(txId, status) {
    const txMeta = this.getTx(txId)

    if (!txMeta) {
      return
    }

    txMeta.status = status
    try {
      this.updateTx(txMeta, `txStateManager: setting status to ${status}`)
      this.emit(`${txMeta.id}:${status}`, txId)
      this.emit(`tx:status-update`, txId, status)
      if (['submitted', 'rejected', 'failed'].includes(status)) {
        this.emit(`${txMeta.id}:finished`, txMeta)
      }
      this.emit('update:badge')
    } catch (error) {
      log.error(error)
    }
  }

  /**
    Saves the new/updated txList.
    @param {array} transactions - the list of transactions to save
  */
  // Function is intended only for internal use
  _saveTxList(transactions) {
    this.store.updateState({ transactions })
  }

  _removeTx(txId) {
    const transactionList = this.getFullTxList()
    this._saveTxList(transactionList.filter((txMeta) => txMeta.id !== txId))
  }

  /**
   * Filters out the unapproved transactions
   */

  clearUnapprovedTxs() {
    const transactions = this.getFullTxList()
    const nonUnapprovedTxs = transactions.filter(
      (tx) => tx.status !== 'unapproved',
    )
    this._saveTxList(nonUnapprovedTxs)
  }
}
