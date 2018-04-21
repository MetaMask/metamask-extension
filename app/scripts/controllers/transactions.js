const EventEmitter = require('events')
const ObservableStore = require('obs-store')
const ethUtil = require('ethereumjs-util')
const Transaction = require('ethereumjs-tx')
const EthQuery = require('ethjs-query')
const TransactionStateManager = require('../lib/tx-state-manager')
const TxGasUtil = require('../lib/tx-gas-utils')
const PendingTransactionTracker = require('../lib/pending-tx-tracker')
const NonceTracker = require('../lib/nonce-tracker')
const log = require('loglevel')

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
    this.getGasPrice = opts.getGasPrice

    this.memStore = new ObservableStore({})
    this.query = new EthQuery(this.provider)
    this.txGasUtil = new TxGasUtil(this.provider)

    this.txStateManager = new TransactionStateManager({
      initState: opts.initState,
      txHistoryLimit: opts.txHistoryLimit,
      getNetwork: this.getNetwork.bind(this),
    })

    this.txStateManager.getFilteredTxList({
      status: 'unapproved',
      loadingDefaults: true,
    }).forEach((tx) => {
      this.addTxDefaults(tx)
      .then((txMeta) => {
        txMeta.loadingDefaults = false
        this.txStateManager.updateTx(txMeta, 'transactions: gas estimation for tx on boot')
      }).catch((error) => {
        this.txStateManager.setTxStatusFailed(tx.id, error)
      })
    })

    this.txStateManager.getFilteredTxList({
      status: 'approved',
    }).forEach((txMeta) => {
      const txSignError = new Error('Transaction found as "approved" during boot - possibly stuck during signing')
      this.txStateManager.setTxStatusFailed(txMeta.id, txSignError)
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
      publishTransaction: (rawTx) => this.query.sendRawTransaction(rawTx),
      getPendingTransactions: this.txStateManager.getPendingTransactions.bind(this.txStateManager),
      getCompletedTransactions: this.txStateManager.getConfirmedTransactions.bind(this.txStateManager),
    })

    this.txStateManager.store.subscribe(() => this.emit('update:badge'))

    this.pendingTxTracker.on('tx:warning', (txMeta) => {
      this.txStateManager.updateTx(txMeta, 'transactions/pending-tx-tracker#event: tx:warning')
    })
    this.pendingTxTracker.on('tx:confirmed', (txId) => this._markNonceDuplicatesDropped(txId))
    this.pendingTxTracker.on('tx:failed', this.txStateManager.setTxStatusFailed.bind(this.txStateManager))
    this.pendingTxTracker.on('tx:block-update', (txMeta, latestBlockNumber) => {
      if (!txMeta.firstRetryBlockNumber) {
        txMeta.firstRetryBlockNumber = latestBlockNumber
        this.txStateManager.updateTx(txMeta, 'transactions/pending-tx-tracker#event: tx:block-update')
      }
    })
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

  wipeTransactions (address) {
    this.txStateManager.wipeTransactions(address)
  }

  // Adds a tx to the txlist
  addTx (txMeta) {
    this.txStateManager.addTx(txMeta)
    this.emit(`${txMeta.id}:unapproved`, txMeta)
  }

  async newUnapprovedTransaction (txParams, opts = {}) {
    log.debug(`MetaMaskController newUnapprovedTransaction ${JSON.stringify(txParams)}`)
    const initialTxMeta = await this.addUnapprovedTransaction(txParams)
    initialTxMeta.origin = opts.origin
    this.txStateManager.updateTx(initialTxMeta, '#newUnapprovedTransaction - adding the origin')
    // listen for tx completion (success, fail)
    return new Promise((resolve, reject) => {
      this.txStateManager.once(`${initialTxMeta.id}:finished`, (finishedTxMeta) => {
        switch (finishedTxMeta.status) {
          case 'submitted':
            return resolve(finishedTxMeta.hash)
          case 'rejected':
            return reject(new Error('MetaMask Tx Signature: User denied transaction signature.'))
          case 'failed':
            return reject(new Error(finishedTxMeta.err.message))
          default:
            return reject(new Error(`MetaMask Tx Signature: Unknown problem: ${JSON.stringify(finishedTxMeta.txParams)}`))
        }
      })
    })
  }

  async addUnapprovedTransaction (txParams) {
    // validate
    const normalizedTxParams = this._normalizeTxParams(txParams)
    this._validateTxParams(normalizedTxParams)
    // construct txMeta
    let txMeta = this.txStateManager.generateTxMeta({ txParams: normalizedTxParams })
    this.addTx(txMeta)
    this.emit('newUnapprovedTx', txMeta)
    // add default tx params
    try {
      txMeta = await this.addTxDefaults(txMeta)
    } catch (error) {
      console.log(error)
      this.txStateManager.setTxStatusFailed(txMeta.id, error)
      throw error
    }
    txMeta.loadingDefaults = false
    // save txMeta
    this.txStateManager.updateTx(txMeta)

    return txMeta
  }

  async addTxDefaults (txMeta) {
    const txParams = txMeta.txParams
    // ensure value
    txMeta.gasPriceSpecified = Boolean(txParams.gasPrice)
    let gasPrice = txParams.gasPrice
    if (!gasPrice) {
      gasPrice = this.getGasPrice ? this.getGasPrice() : await this.query.gasPrice()
    }
    txParams.gasPrice = ethUtil.addHexPrefix(gasPrice.toString(16))
    txParams.value = txParams.value || '0x0'
    // set gasLimit
    return await this.txGasUtil.analyzeGasUsage(txMeta)
  }

  async retryTransaction (originalTxId) {
    const originalTxMeta = this.txStateManager.getTx(originalTxId)
    const lastGasPrice = originalTxMeta.txParams.gasPrice
    const txMeta = this.txStateManager.generateTxMeta({
      txParams: originalTxMeta.txParams,
      lastGasPrice,
      loadingDefaults: false,
    })
    this.addTx(txMeta)
    this.emit('newUnapprovedTx', txMeta)
    return txMeta
  }

  async updateTransaction (txMeta) {
    this.txStateManager.updateTx(txMeta, 'confTx: user updated transaction')
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
      // if txMeta has lastGasPrice then it is a retry at same nonce with higher
      // gas price transaction and their for the nonce should not be calculated
      const nonce = txMeta.lastGasPrice ? txMeta.txParams.nonce : nonceLock.nextNonce
      txMeta.txParams.nonce = ethUtil.addHexPrefix(nonce.toString(16))
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
    // add network/chain id
    const chainId = this.getChainId()
    const txParams = Object.assign({}, txMeta.txParams, { chainId })
    // sign tx
    const fromAddress = txParams.from
    const ethTx = new Transaction(txParams)
    await this.signEthTx(ethTx, fromAddress)
    // set state to signed
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

  _normalizeTxParams (txParams) {
    // functions that handle normalizing of that key in txParams
    const whiteList = {
      from: from => ethUtil.addHexPrefix(from).toLowerCase(),
      to: to => ethUtil.addHexPrefix(txParams.to).toLowerCase(),
      nonce: nonce => ethUtil.addHexPrefix(nonce),
      value: value => ethUtil.addHexPrefix(value),
      data: data => ethUtil.addHexPrefix(data),
      gas: gas => ethUtil.addHexPrefix(gas),
      gasPrice: gasPrice => ethUtil.addHexPrefix(gasPrice),
    }

    // apply only keys in the whiteList
    const normalizedTxParams = {}
    Object.keys(whiteList).forEach((key) => {
      if (txParams[key]) normalizedTxParams[key] = whiteList[key](txParams[key])
    })

    return normalizedTxParams
  }

  _validateTxParams (txParams) {
    this._validateFrom(txParams)
    this._validateRecipient(txParams)
    if ('value' in txParams) {
      const value = txParams.value.toString()
      if (value.includes('-')) {
        throw new Error(`Invalid transaction value of ${txParams.value} not a positive number.`)
      }

      if (value.includes('.')) {
        throw new Error(`Invalid transaction value of ${txParams.value} number must be in wei`)
      }
    }
  }

  _validateFrom (txParams) {
    if ( !(typeof txParams.from === 'string') ) throw new Error(`Invalid from address ${txParams.from} not a string`)
    if (!ethUtil.isValidAddress(txParams.from)) throw new Error('Invalid from address')
  }

  _validateRecipient (txParams) {
    if (txParams.to === '0x' || txParams.to === null ) {
      if (txParams.data) {
        delete txParams.to
      } else {
        throw new Error('Invalid recipient address')
      }
    } else if ( txParams.to !== undefined && !ethUtil.isValidAddress(txParams.to) ) {
      throw new Error('Invalid recipient address')
    }
    return txParams
  }

  _markNonceDuplicatesDropped (txId) {
    this.txStateManager.setTxStatusConfirmed(txId)
    // get the confirmed transactions nonce and from address
    const txMeta = this.txStateManager.getTx(txId)
    const { nonce, from } = txMeta.txParams
    const sameNonceTxs = this.txStateManager.getFilteredTxList({nonce, from})
    if (!sameNonceTxs.length) return
    // mark all same nonce transactions as dropped and give i a replacedBy hash
    sameNonceTxs.forEach((otherTxMeta) => {
      if (otherTxMeta.id === txId) return
      otherTxMeta.replacedBy = txMeta.hash
      this.txStateManager.updateTx(txMeta, 'transactions/pending-tx-tracker#event: tx:confirmed reference to confirmed txHash with same nonce')
      this.txStateManager.setTxStatusDropped(otherTxMeta.id)
    })
  }

  _updateMemstore () {
    const unapprovedTxs = this.txStateManager.getUnapprovedTxList()
    const selectedAddressTxList = this.txStateManager.getFilteredTxList({
      from: this.getSelectedAddress(),
      metamaskNetworkId: this.getNetwork(),
    })
    this.memStore.updateState({ unapprovedTxs, selectedAddressTxList })
  }
}
