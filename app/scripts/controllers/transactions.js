const EventEmitter = require('events')
const async = require('async')
const extend = require('xtend')
const ObservableStore = require('obs-store')
const ethUtil = require('ethereumjs-util')
const denodeify = require('denodeify')
const TxProviderUtil = require('../lib/tx-utils')
const createId = require('../lib/random-id')
const NonceTracker = require('../lib/nonce-tracker')

const RETRY_LIMIT = 200

module.exports = class TransactionController extends EventEmitter {
  constructor (opts) {
    super()
    this.store = new ObservableStore(extend({
      transactions: [],
      nonceDuplicates: {},
    }, opts.initState))
    this.memStore = new ObservableStore({})
    this.networkStore = opts.networkStore || new ObservableStore({})
    this.preferencesStore = opts.preferencesStore || new ObservableStore({})
    this.txHistoryLimit = opts.txHistoryLimit
    this.provider = opts.provider
    this.blockTracker = opts.blockTracker
    this.nonceTracker = new NonceTracker({
      provider: this.provider,
      blockTracker: this.provider._blockTracker,
      getPendingTransactions: (address) => {
        return this.getFilteredTxList({
          from: address,
          status: 'submitted',
          err: undefined,
          ignore: undefined,
        })
      },
    })
    this.query = opts.ethQuery
    this.txProviderUtils = new TxProviderUtil(this.query)
    this.blockTracker.on('rawBlock', this.checkForTxInBlock.bind(this))
    this.blockTracker.on('latest', this.resubmitPendingTxs.bind(this))
    this.blockTracker.on('sync', this.queryPendingTxs.bind(this))
    this.signEthTx = opts.signTransaction
    this.ethStore = opts.ethStore
    // memstore is computed from a few different stores
    this._updateMemstore()
    this.store.subscribe(() => this._updateMemstore())
    this.networkStore.subscribe(() => this._updateMemstore())
    this.preferencesStore.subscribe(() => this._updateMemstore())
    this._updateNonceDuplicates()
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

  // Returns the tx list
  getTxList () {
    const network = this.getNetwork()
    const fullTxList = this.getFullTxList()
    return fullTxList.filter(txMeta => txMeta.metamaskNetworkId === network)
  }

  // Returns the number of txs for the current network.
  getTxCount () {
    return this.getTxList().length
  }

  // Returns the full tx list across all networks
  getFullTxList () {
    return this.store.getState().transactions
  }

  // Adds a tx to the txlist
  addTx (txMeta) {
    const txCount = this.getTxCount()
    const network = this.getNetwork()
    const fullTxList = this.getFullTxList()
    const txHistoryLimit = this.txHistoryLimit

    // checks if the length of the tx history is
    // longer then desired persistence limit
    // and then if it is removes only confirmed
    // or rejected tx's.
    // not tx's that are pending or unapproved
    if (txCount > txHistoryLimit - 1) {
      var index = fullTxList.findIndex((metaTx) => ((metaTx.status === 'confirmed' || metaTx.status === 'rejected') && network === txMeta.metamaskNetworkId))
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

  // gets tx by Id and returns it
  getTx (txId, cb) {
    var txList = this.getTxList()
    var txMeta = txList.find(txData => txData.id === txId)
    return cb ? cb(txMeta) : txMeta
  }

  //
  updateTx (txMeta) {
    var txId = txMeta.id
    var txList = this.getFullTxList()
    var index = txList.findIndex(txData => txData.id === txId)
    txList[index] = txMeta
    this._saveTxList(txList)
    this.emit('update')
  }

  get unapprovedTxCount () {
    return Object.keys(this.getUnapprovedTxList()).length
  }

  get pendingTxCount () {
    return this.getTxsByMetaData('status', 'signed').length
  }

  addUnapprovedTransaction (txParams, done) {
    let txMeta
    async.waterfall([
      // validate
      (cb) => this.txProviderUtils.validateTxParams(txParams, cb),
      // construct txMeta
      (cb) => {
        txMeta = {
          id: createId(),
          time: (new Date()).getTime(),
          status: 'unapproved',
          metamaskNetworkId: this.getNetwork(),
          txParams: txParams,
        }
        cb()
      },
      // add default tx params
      (cb) => this.addTxDefaults(txMeta, cb),
      // save txMeta
      (cb) => {
        this.addTx(txMeta)
        cb(null, txMeta)
      },
    ], done)
  }

  addTxDefaults (txMeta, cb) {
    const txParams = txMeta.txParams
    // ensure value
    txParams.value = txParams.value || '0x0'
    this.query.gasPrice((err, gasPrice) => {
      if (err) return cb(err)
      // set gasPrice
      txParams.gasPrice = gasPrice
      // set gasLimit
      this.txProviderUtils.analyzeGasUsage(txMeta, cb)
    })
  }

  getUnapprovedTxList () {
    var txList = this.getTxList()
    return txList.filter((txMeta) => txMeta.status === 'unapproved')
    .reduce((result, tx) => {
      result[tx.id] = tx
      return result
    }, {})
  }

  async approveTransaction (txId, cb = warn) {
    let nonceLock
    try {
      // approve
      this.setTxStatusApproved(txId)
      // get next nonce
      const txMeta = this.getTx(txId)
      const fromAddress = txMeta.txParams.from
      if (!txMeta.txParams.nonce) {
        nonceLock = await this.nonceTracker.getNonceLock(fromAddress)
        txMeta.txParams.nonce = nonceLock.nextNonce
        this.updateTx(txMeta)
      }
      // sign transaction
      const rawTx = await denodeify(this.signTransaction.bind(this))(txId)
      await this.publishTransaction(txId, rawTx)
      // must set transaction to submitted/failed before releasing lock
      if (nonceLock) nonceLock.releaseLock()
      cb()
    } catch (err) {
      this.setTxStatusFailed(txId, {
        errCode: err.errCode || err,
        message: err.message || 'Transaction failed during approval',
      })
      // must set transaction to submitted/failed before releasing lock
      if (nonceLock) nonceLock.releaseLock()
      // continue with error chain
      cb(err)
    }
  }

  cancelTransaction (txId, cb = warn) {
    this.setTxStatusRejected(txId)
    cb()
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

  signTransaction (txId, cb) {
    const txMeta = this.getTx(txId)
    const txParams = txMeta.txParams
    const fromAddress = txParams.from
    // add network/chain id
    txParams.chainId = this.getChainId()
    const ethTx = this.txProviderUtils.buildEthTxFromParams(txParams)
    this.signEthTx(ethTx, fromAddress).then(() => {
      this.setTxStatusSigned(txMeta.id)
      cb(null, ethUtil.bufferToHex(ethTx.serialize()))
    }).catch((err) => {
      cb(err)
    })
  }

  publishTransaction (txId, rawTx) {
    const txMeta = this.getTx(txId)
    txMeta.rawTx = rawTx
    this.updateTx(txMeta)
    return new Promise((resolve, reject) => {
      this.txProviderUtils.publishTransaction(rawTx, (err, txHash) => {
        if (err) reject(err)
        this.setTxHash(txId, txHash)
        this.setTxStatusSubmitted(txId)
        resolve()
      })
    })
  }

  resendTransactionAsDuplicate (txMeta) {
    return new Promise((resolve, reject) => {
      this.query.sendTransaction(txMeta.txParams, (err, hash) => {
        const newTx = this.getFilteredTxList({hash})[0]
        if (err) reject(err)
        txMeta.ignore = true
        this.updateTx(txMeta)
        resolve(newTx)
      })
    })
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
  var thingsToLookFor = {
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
    var filteredTxList
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

  // sets the tx status to 'ignore'
  // so the tx will be ignored by block checking and nonceTracker
  ignoreTx (txMeta) {
    txMeta.ignore = true
    this.updateTx(txMeta)
  }

  // should update the status of the tx to 'confirmed'.
  setTxStatusConfirmed (txId) {
    this._setTxStatus(txId, 'confirmed')
  }

  setTxStatusFailed (txId, reason) {
    const txMeta = this.getTx(txId)
    txMeta.err = reason
    this.updateTx(txMeta)
    this._setTxStatus(txId, 'failed')
  }

  // merges txParams obj onto txData.txParams
  // use extend to ensure that all fields are filled
  updateTxParams (txId, txParams) {
    var txMeta = this.getTx(txId)
    txMeta.txParams = extend(txMeta.txParams, txParams)
    this.updateTx(txMeta)
  }

  ignorePendingTxs (address = this.getSelectedAddress()) {
    const pendingTxs = this.getFilteredTxList({
      from: address,
      status: 'submitted',
    })

    pendingTxs.forEach((txMeta) => this.ignoreTx(txMeta))
    return Promise.resolve()
  }

  //  checks if a signed tx is in a block and
  // if included sets the tx status as 'confirmed'
  checkForTxInBlock (block) {
    this._updateNonceDuplicates()
    var signedTxList = this.getFilteredTxList({status: 'submitted'})
    if (!signedTxList.length) return
    signedTxList.forEach((txMeta) => {
      var txHash = txMeta.hash
      var txId = txMeta.id

      if (!txHash) {
        const errReason = {
          errCode: 'No hash was provided',
          message: 'We had an error while submitting this transaction, please try again.',
        }
        return this.setTxStatusFailed(txId, errReason)
      }

      block.transactions.forEach((tx) => {
        if (tx.hash === txHash) this.setTxStatusConfirmed(txId)
      })
      this._updateNonceDuplicates()
    })
  }

  queryPendingTxs ({oldBlock, newBlock}) {
    // check pending transactions on start
    if (!oldBlock) {
      this._checkPendingTxs()
      return
    }
    // if we synced by more than one block, check for missed pending transactions
    const diff = Number.parseInt(newBlock.number) - Number.parseInt(oldBlock.number)
    if (diff > 1) this._checkPendingTxs()
  }

  // PRIVATE METHODS

  //  Should find the tx in the tx list and
  //  update it.
  //  should set the status in txData
  //    - `'unapproved'` the user has not responded
  //    - `'rejected'` the user has responded no!
  //    - `'approved'` the user has approved the tx
  //    - `'signed'` the tx is signed
  //    - `'submitted'` the tx is sent to a server
  //    - `'ignore'` the tx will be ignored by block checking and nonceTracker
  //    - `'confirmed'` the tx has been included in a block.
  //    - `'failed'` the tx failed for some reason, included on tx data.
  _setTxStatus (txId, status) {
    var txMeta = this.getTx(txId)
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

  resubmitPendingTxs () {
    const pending = this.getFilteredTxList({ status: 'submitted', ignore: undefined })
    // only try resubmitting if their are transactions to resubmit
    if (!pending.length) return
    const resubmit = denodeify(this._resubmitTx.bind(this))
    Promise.all(pending.map(txMeta => resubmit(txMeta)))
    .catch((reason) => {
      log.info('Problem resubmitting tx', reason)
    })
  }

  _resubmitTx (txMeta, cb) {
    const address = txMeta.txParams.from
    const balance = this.ethStore.getState().accounts[address].balance
    const nonce = Number.parseInt(this.ethStore.getState().accounts[address].nonce)
    const txNonce = Number.parseInt(txMeta.txParams.nonce)
    const gtBalance = Number.parseInt(txMeta.txParams.value) > Number.parseInt(balance)
    if (!('retryCount' in txMeta)) txMeta.retryCount = 0

    // if the value of the transaction is greater then the balance
    // or the nonce of the transaction is lower then the accounts nonce
    // dont resubmit the tx
    if (gtBalance || txNonce < nonce) return cb()
    // Only auto-submit already-signed txs:
    if (!('rawTx' in txMeta)) return cb()

    if (txMeta.retryCount > RETRY_LIMIT) return

    // Increment a try counter.
    txMeta.retryCount++
    const rawTx = txMeta.rawTx
    this.txProviderUtils.publishTransaction(rawTx, cb)
  }

  // checks the network for signed txs and
  // if confirmed sets the tx status as 'confirmed'
  _checkPendingTxs () {
    this._updateNonceDuplicates()
    var signedTxList = this.getFilteredTxList({status: 'submitted'})
    if (!signedTxList.length) return
    signedTxList.forEach((txMeta) => {
      var txHash = txMeta.hash
      var txId = txMeta.id
      if (!txHash) {
        const errReason = {
          errCode: 'No hash was provided',
          message: 'We had an error while submitting this transaction, please try again.',
        }
        return this.setTxStatusFailed(txId, errReason)
      }
      this.query.getTransactionByHash(txHash, (err, txParams) => {
        if (err || !txParams) {
          if (!txParams) return
          txMeta.err = {
            isWarning: true,
            errorCode: err,
            message: 'There was a problem loading this transaction.',
          }
          this.updateTx(txMeta)
          return log.error(err)
        }
        if (txParams.blockNumber) {
          this.setTxStatusConfirmed(txId)
          this._updateNonceDuplicates()
        }
      })
    })
  }

  _updateNonceDuplicates () {
    const ignoredTxList = this.getFilteredTxList({status: 'submitted', ignore: true})
    const submittedTxList = this.getFilteredTxList({status: 'submitted', ignore: undefined})
    var duplicateFilterList
    if (!ignoredTxList.length && !submittedTxList.length) return false
    const nonceDuplicates = this._getNonceDuplicates()
    ignoredTxList.concat(submittedTxList).forEach((txMeta) => {
      const from = txMeta.txParams.from
      const nonce = txMeta.txParams.nonce
      if (!nonceDuplicates[from]) nonceDuplicates[from] = {}
      duplicateFilterList = this.getFilteredTxList({
        from,
        nonce,
      })
      if (duplicateFilterList.length > 1) {
        nonceDuplicates[from][nonce] = duplicateFilterList
        const isOneConfirmed = nonceDuplicates[from][nonce].find((txMeta) => txMeta.status === 'confirmed')
        if (isOneConfirmed) {
          nonceDuplicates[from][nonce].forEach((txMeta) => {
            if (txMeta.status === 'submitted') this.setTxStatusRejected(txMeta.id)
          })
        }
      }
    })
    this.store.updateState({_nonceDuplicates: nonceDuplicates})
    return true
  }

  _getNonceDuplicates () {
    return this.store.getState().nonceDuplicates
  }
}


const warn = () => log.warn('warn was used no cb provided')
