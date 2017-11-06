const EventEmitter = require('events')
const ObservableStore = require('obs-store')
const ethUtil = require('ethereumjs-util')
const Transaction = require('ethereumjs-tx')
const EthQuery = require('ethjs-query')
const TransactionStateManger = require('../lib/tx-state-manager')
const TxGasUtil = require('../lib/tx-gas-utils')
const PendingTransactionTracker = require('../lib/pending-tx-tracker')
const createId = require('../lib/random-id')
const NonceTracker = require('../lib/nonce-tracker')

/*
  Transaction Controller is an aggregate of sub-controllers and trackers
  composing them in a way to be exposed to the metamask controller
    - txStateManager
      responsible for the state of a transaction and
      storing the transaction
    - pendingTxTracker
      watching blocks for transactions to be include
      and emitting confirmed events
    - txGasUtil
      gas calculations and safety buffering
    - nonceTracker
      calculating nonces
*/

module.exports = class TransactionController extends EventEmitter {
  constructor (opts) {
    super()
    this.networkStore = opts.networkStore || new ObservableStore({})
    this.preferencesStore = opts.preferencesStore || new ObservableStore({})
    this.provider = opts.provider
    this.blockTracker = opts.blockTracker
    this.signEthTx = opts.signTransaction

    this.memStore = new ObservableStore({})
    this.query = new EthQuery(this.provider)
    this.txGasUtil = new TxGasUtil(this.provider)

    this.txStateManager = new TransactionStateManger({
      initState: opts.initState,
      txHistoryLimit: opts.txHistoryLimit,
      getNetwork: this.getNetwork.bind(this),
    })
    this.store = this.txStateManager.store
    this.txStateManager.on('tx:status-update', this.emit.bind(this, 'tx:status-update'))
    this.nonceTracker = new NonceTracker({
      provider: this.provider,
      getPendingTransactions: this.txStateManager.getPendingTransactions.bind(this.txStateManager),
      getConfirmedTransactions: (address) => {
        return this.txStateManager.getFilteredTxList({
          from: address,
          status: 'confirmed',
          err: undefined,
        })
      },
    })

    this.pendingTxTracker = new PendingTransactionTracker({
      provider: this.provider,
      nonceTracker: this.nonceTracker,
      retryTimePeriod: 86400000, // Retry 3500 blocks, or about 1 day.
      publishTransaction: (rawTx) => this.query.sendRawTransaction(rawTx),
      getPendingTransactions: this.txStateManager.getPendingTransactions.bind(this.txStateManager),
      getCompletedTransactions: this.txStateManager.getConfirmedTransactions.bind(this.txStateManager),
    })

    this.txStateManager.store.subscribe(() => this.emit('update:badge'))

    this.pendingTxTracker.on('tx:warning', (txMeta) => {
      this.txStateManager.updateTx(txMeta, 'transactions/pending-tx-tracker#event: tx:warning')
    })
    this.pendingTxTracker.on('tx:failed', this.txStateManager.setTxStatusFailed.bind(this.txStateManager))
    this.pendingTxTracker.on('tx:confirmed', this.txStateManager.setTxStatusConfirmed.bind(this.txStateManager))
    this.pendingTxTracker.on('tx:retry', (txMeta) => {
      if (!('retryCount' in txMeta)) txMeta.retryCount = 0
      txMeta.retryCount++
      this.txStateManager.updateTx(txMeta, 'transactions/pending-tx-tracker#event: tx:retry')
    })

    this.blockTracker.on('block', this.pendingTxTracker.checkForTxInBlock.bind(this.pendingTxTracker))
    // this is a little messy but until ethstore has been either
    // removed or redone this is to guard against the race condition
    this.blockTracker.on('latest', this.pendingTxTracker.resubmitPendingTxs.bind(this.pendingTxTracker))
    this.blockTracker.on('sync', this.pendingTxTracker.queryPendingTxs.bind(this.pendingTxTracker))
    // memstore is computed from a few different stores
    this._updateMemstore()
    this.txStateManager.store.subscribe(() => this._updateMemstore())
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

  getUnapprovedTxCount () {
    return Object.keys(this.txStateManager.getUnapprovedTxList()).length
  }

  getPendingTxCount (account) {
    return this.txStateManager.getPendingTransactions(account).length
  }

  getFilteredTxList (opts) {
    return this.txStateManager.getFilteredTxList(opts)
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

  // Adds a tx to the txlist
  addTx (txMeta) {
    this.txStateManager.addTx(txMeta)
    this.emit(`${txMeta.id}:unapproved`, txMeta)
  }

  async newUnapprovedTransaction (txParams) {
    log.debug(`MetaMaskController newUnapprovedTransaction ${JSON.stringify(txParams)}`)
    const txMeta = await this.addUnapprovedTransaction(txParams)
    this.emit('newUnapprovedTx', txMeta)
    // listen for tx completion (success, fail)
    return new Promise((resolve, reject) => {
      this.txStateManager.once(`${txMeta.id}:finished`, (completedTx) => {
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
    await this.txGasUtil.validateTxParams(txParams)
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
    txMeta.gasPriceSpecified = Boolean(txParams.gasPrice)
    const gasPrice = txParams.gasPrice || await this.query.gasPrice()
    txParams.gasPrice = ethUtil.addHexPrefix(gasPrice.toString(16))
    txParams.value = txParams.value || '0x0'
    // set gasLimit
    return await this.txGasUtil.analyzeGasUsage(txMeta)
  }

  async updateAndApproveTransaction (txMeta) {
    this.txStateManager.updateTx(txMeta, 'confTx: user approved transaction')
    await this.approveTransaction(txMeta.id)
  }

  async approveTransaction (txId) {
    let nonceLock
    try {
      // approve
      this.txStateManager.setTxStatusApproved(txId)
      // get next nonce
      const txMeta = this.txStateManager.getTx(txId)
      const fromAddress = txMeta.txParams.from
      // wait for a nonce
      nonceLock = await this.nonceTracker.getNonceLock(fromAddress)
      // add nonce to txParams
      txMeta.txParams.nonce = ethUtil.addHexPrefix(nonceLock.nextNonce.toString(16))
      // add nonce debugging information to txMeta
      txMeta.nonceDetails = nonceLock.nonceDetails
      this.txStateManager.updateTx(txMeta, 'transactions#approveTransaction')
      // sign transaction
      const rawTx = await this.signTransaction(txId)
      await this.publishTransaction(txId, rawTx)
      // must set transaction to submitted/failed before releasing lock
      nonceLock.releaseLock()
    } catch (err) {
      this.txStateManager.setTxStatusFailed(txId, err)
      // must set transaction to submitted/failed before releasing lock
      if (nonceLock) nonceLock.releaseLock()
      // continue with error chain
      throw err
    }
  }

  async signTransaction (txId) {
    const txMeta = this.txStateManager.getTx(txId)
    const txParams = txMeta.txParams
    const fromAddress = txParams.from
    // add network/chain id
    txParams.chainId = ethUtil.addHexPrefix(this.getChainId().toString(16))
    const ethTx = new Transaction(txParams)
    await this.signEthTx(ethTx, fromAddress)
    this.txStateManager.setTxStatusSigned(txMeta.id)
    const rawTx = ethUtil.bufferToHex(ethTx.serialize())
    return rawTx
  }

  async publishTransaction (txId, rawTx) {
    const txMeta = this.txStateManager.getTx(txId)
    txMeta.rawTx = rawTx
    this.txStateManager.updateTx(txMeta, 'transactions#publishTransaction')
    const txHash = await this.query.sendRawTransaction(rawTx)
    this.setTxHash(txId, txHash)
    this.txStateManager.setTxStatusSubmitted(txId)
  }

  async cancelTransaction (txId) {
    this.txStateManager.setTxStatusRejected(txId)
  }

  // receives a txHash records the tx as signed
  setTxHash (txId, txHash) {
    // Add the tx hash to the persisted meta-tx object
    const txMeta = this.txStateManager.getTx(txId)
    txMeta.hash = txHash
    this.txStateManager.updateTx(txMeta, 'transactions#setTxHash')
  }

//
//           PRIVATE METHODS
//

  _updateMemstore () {
    const unapprovedTxs = this.txStateManager.getUnapprovedTxList()
    const selectedAddressTxList = this.txStateManager.getFilteredTxList({
      from: this.getSelectedAddress(),
      metamaskNetworkId: this.getNetwork(),
    })
    this.memStore.updateState({ unapprovedTxs, selectedAddressTxList })
  }
}
