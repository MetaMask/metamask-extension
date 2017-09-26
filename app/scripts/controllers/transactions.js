const EventEmitter = require('events')
const extend = require('xtend')
const ObservableStore = require('obs-store')
const ethUtil = require('ethereumjs-util')
const EthQuery = require('ethjs-query')
const TxProviderUtil = require('../lib/tx-utils')
const PendingTransactionTracker = require('../lib/pending-tx-tracker')
const createId = require('../lib/random-id')
const NonceTracker = require('../lib/nonce-tracker')
const txStateHistoryHelper = require('../lib/tx-state-history-helper')

module.exports = class TransactionController extends EventEmitter {
  constructor (opts) {
    super()
    this.store = new ObservableStore(extend({
      transactions: [],
    }, opts.initState))
    this.memStore = new ObservableStore({})
    this.networkStore = opts.networkStore || new ObservableStore({})
    this.preferencesStore = opts.preferencesStore || new ObservableStore({})
    this.txHistoryLimit = opts.txHistoryLimit
    this.provider = opts.provider
    this.blockTracker = opts.blockTracker
    this.signEthTx = opts.signTransaction
    this.ethStore = opts.ethStore

    this.nonceTracker = new NonceTracker({
      provider: this.provider,
      getPendingTransactions: (address) => {
        return this.getFilteredTxList({
          from: address,
          status: 'submitted',
          err: undefined,
        })
      },
      getConfirmedTransactions: (address) => {
        return this.getFilteredTxList({
          from: address,
          status: 'confirmed',
          err: undefined,
        })
      },
      giveUpOnTransaction: (txId) => {
        const msg = `Gave up submitting after 3500 blocks un-mined.`
        this.setTxStatusFailed(txId, msg)
      },
    })
    this.query = new EthQuery(this.provider)
    this.txProviderUtil = new TxProviderUtil(this.provider)

    this.pendingTxTracker = new PendingTransactionTracker({
      provider: this.provider,
      nonceTracker: this.nonceTracker,
      getBalance: (address) => {
        const account = this.ethStore.getState().accounts[address]
        if (!account) return
        return account.balance
      },
      publishTransaction: this.txProviderUtil.publishTransaction.bind(this.txProviderUtil),
      getPendingTransactions: () => {
        const network = this.getNetwork()
        return this.getFilteredTxList({
          status: 'submitted',
          metamaskNetworkId: network,
        })
      },
    })

    this.pendingTxTracker.on('txWarning', this.updateTx.bind(this))
    this.pendingTxTracker.on('txFailed', this.setTxStatusFailed.bind(this))
    this.pendingTxTracker.on('txConfirmed', this.setTxStatusConfirmed.bind(this))

    this.blockTracker.on('rawBlock', this.pendingTxTracker.checkForTxInBlock.bind(this.pendingTxTracker))
    // this is a little messy but until ethstore has been either
    // removed or redone this is to guard against the race condition
    // where ethStore hasent been populated by the results yet
    this.blockTracker.once('latest', () => {
      this.blockTracker.on('latest', this.pendingTxTracker.resubmitPendingTxs.bind(this.pendingTxTracker))
    })
    this.blockTracker.on('sync', this.pendingTxTracker.queryPendingTxs.bind(this.pendingTxTracker))
    // memstore is computed from a few different stores
    this._updateMemstore()
    this.store.subscribe(() => this._updateMemstore())
    this.networkStore.subscribe(() => this._updateMemstore())
    this.preferencesStore.subscribe(() => this._updateMemstore())
  }

  getState () {
    return this.memStore.getState()
  }

  getNetwork () {
    return this.networkStore.getState()
  }

  getSelectedAddress () {
    return this.preferencesStore.getState().selectedAddress
  }

  // Returns the number of txs for the current network.
  getTxCount () {
    return this.getTxList().length
  }

  // Returns the full tx list across all networks
  getFullTxList () {
    return this.store.getState().transactions
  }

  getUnapprovedTxCount () {
    return Object.keys(this.getUnapprovedTxList()).length
  }

  getPendingTxCount () {
    return this.getTxsByMetaData('status', 'signed').length
  }

  // Returns the tx list
  getTxList () {
    const network = this.getNetwork()
    const fullTxList = this.getFullTxList()
    return this.getTxsByMetaData('metamaskNetworkId', network, fullTxList)
  }

  // gets tx by Id and returns it
  getTx (txId) {
    const txList = this.getTxList()
    const txMeta = txList.find(txData => txData.id === txId)
    return txMeta
  }
  getUnapprovedTxList () {
    const txList = this.getTxList()
    return txList.filter((txMeta) => txMeta.status === 'unapproved')
    .reduce((result, tx) => {
      result[tx.id] = tx
      return result
    }, {})
  }

  updateTx (txMeta) {
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
    this.emit('update')
  }

  // Adds a tx to the txlist
  addTx (txMeta) {
    // initialize history
    txMeta.history = []
    // capture initial snapshot of txMeta for history
    const snapshot = txStateHistoryHelper.snapshotFromTxMeta(txMeta)
    txMeta.history.push(snapshot)

    // checks if the length of the tx history is
    // longer then desired persistence limit
    // and then if it is removes only confirmed
    // or rejected tx's.
    // not tx's that are pending or unapproved
    const txCount = this.getTxCount()
    const network = this.getNetwork()
    const fullTxList = this.getFullTxList()
    const txHistoryLimit = this.txHistoryLimit

    if (txCount > txHistoryLimit - 1) {
      const index = fullTxList.findIndex((metaTx) => ((metaTx.status === 'confirmed' || metaTx.status === 'rejected') && network === txMeta.metamaskNetworkId))
      fullTxList.splice(index, 1)
    }
    fullTxList.push(txMeta)
    this._saveTxList(fullTxList)
    this.emit('update')

    this.once(`${txMeta.id}:signed`, function (txId) {
      this.removeAllListeners(`${txMeta.id}:rejected`)
    })
    this.once(`${txMeta.id}:rejected`, function (txId) {
      this.removeAllListeners(`${txMeta.id}:signed`)
    })

    this.emit('updateBadge')
    this.emit(`${txMeta.id}:unapproved`, txMeta)
  }

  async newUnapprovedTransaction (txParams) {
    log.debug(`MetaMaskController newUnapprovedTransaction ${JSON.stringify(txParams)}`)
    const txMeta = await this.addUnapprovedTransaction(txParams)
    this.emit('newUnaprovedTx', txMeta)
    // listen for tx completion (success, fail)
    return new Promise((resolve, reject) => {
      this.once(`${txMeta.id}:finished`, (completedTx) => {
        switch (completedTx.status) {
          case 'submitted':
            return resolve(completedTx.hash)
          case 'rejected':
            return reject(new Error('MetaMask Tx Signature: User denied transaction signature.'))
          default:
            return reject(new Error(`MetaMask Tx Signature: Unknown problem: ${JSON.stringify(completedTx.txParams)}`))
        }
      })
    })
  }

  async addUnapprovedTransaction (txParams) {
    // validate
    await this.txProviderUtil.validateTxParams(txParams)
    // construct txMeta
    const txMeta = {
      id: createId(),
      time: (new Date()).getTime(),
      status: 'unapproved',
      metamaskNetworkId: this.getNetwork(),
      txParams: txParams,
    }
    // add default tx params
    await this.addTxDefaults(txMeta)
    // save txMeta
    this.addTx(txMeta)
    return txMeta
  }

  async addTxDefaults (txMeta) {
    const txParams = txMeta.txParams
    // ensure value
    txParams.value = txParams.value || '0x0'
    if (!txParams.gasPrice) {
      const gasPrice = await this.query.gasPrice()
      txParams.gasPrice = gasPrice
    }
    // set gasLimit
    return await this.txProviderUtil.analyzeGasUsage(txMeta)
  }

  async updateAndApproveTransaction (txMeta) {
    this.updateTx(txMeta)
    await this.approveTransaction(txMeta.id)
  }

  async approveTransaction (txId) {
    let nonceLock
    try {
      // approve
      this.setTxStatusApproved(txId)
      // get next nonce
      const txMeta = this.getTx(txId)
      const fromAddress = txMeta.txParams.from
      // wait for a nonce
      nonceLock = await this.nonceTracker.getNonceLock(fromAddress)
      // add nonce to txParams
      txMeta.txParams.nonce = nonceLock.nextNonce
      // add nonce debugging information to txMeta
      txMeta.nonceDetails = nonceLock.nonceDetails
      this.updateTx(txMeta)
      // sign transaction
      const rawTx = await this.signTransaction(txId)
      await this.publishTransaction(txId, rawTx)
      // must set transaction to submitted/failed before releasing lock
      nonceLock.releaseLock()
    } catch (err) {
      this.setTxStatusFailed(txId, err)
      // must set transaction to submitted/failed before releasing lock
      if (nonceLock) nonceLock.releaseLock()
      // continue with error chain
      throw err
    }
  }

  async signTransaction (txId) {
    const txMeta = this.getTx(txId)
    const txParams = txMeta.txParams
    const fromAddress = txParams.from
    // add network/chain id
    txParams.chainId = this.getChainId()
    const ethTx = this.txProviderUtil.buildEthTxFromParams(txParams)
    await this.signEthTx(ethTx, fromAddress)
    this.setTxStatusSigned(txMeta.id)
    const rawTx = ethUtil.bufferToHex(ethTx.serialize())
    return rawTx
  }

  async publishTransaction (txId, rawTx) {
    const txMeta = this.getTx(txId)
    txMeta.rawTx = rawTx
    this.updateTx(txMeta)
    const txHash = await this.txProviderUtil.publishTransaction(rawTx)
    this.setTxHash(txId, txHash)
    this.setTxStatusSubmitted(txId)
  }

  async cancelTransaction (txId) {
    this.setTxStatusRejected(txId)
  }


  getChainId () {
    const networkState = this.networkStore.getState()
    const getChainId = parseInt(networkState)
    if (Number.isNaN(getChainId)) {
      return 0
    } else {
      return getChainId
    }
  }

  // receives a txHash records the tx as signed
  setTxHash (txId, txHash) {
    // Add the tx hash to the persisted meta-tx object
    const txMeta = this.getTx(txId)
    txMeta.hash = txHash
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
  getFilteredTxList (opts) {
    let filteredTxList
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

  // merges txParams obj onto txData.txParams
  // use extend to ensure that all fields are filled
  updateTxParams (txId, txParams) {
    const txMeta = this.getTx(txId)
    txMeta.txParams = extend(txMeta.txParams, txParams)
    this.updateTx(txMeta)
  }

/* _____________________________________
|                                      |
|           PRIVATE METHODS            |
|______________________________________*/


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

  _updateMemstore () {
    const unapprovedTxs = this.getUnapprovedTxList()
    const selectedAddressTxList = this.getFilteredTxList({
      from: this.getSelectedAddress(),
      metamaskNetworkId: this.getNetwork(),
    })
    this.memStore.updateState({ unapprovedTxs, selectedAddressTxList })
  }
}
