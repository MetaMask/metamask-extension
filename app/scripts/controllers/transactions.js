const EventEmitter = require('events')
const extend = require('xtend')
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
    this.ethStore = opts.ethStore

    this.memStore = new ObservableStore({})
    this.query = new EthQuery(this.provider)
    this.txGasUtil = new TxGasUtil(this.provider)

    this.txStateManager = new TransactionStateManger({
      initState: extend({
        transactions: [],
      }, opts.initState),
      txHistoryLimit: opts.txHistoryLimit,
      getNetwork: this.getNetwork.bind(this),
    })

    this.nonceTracker = new NonceTracker({
      provider: this.provider,
      getPendingTransactions: (address) => {
        return this.txStateManager.getFilteredTxList({
          from: address,
          status: 'submitted',
        })
      },
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
      getBalance: (address) => {
        const account = this.ethStore.getState().accounts[address]
        if (!account) return
        return account.balance
      },
      publishTransaction: this.query.sendRawTransaction,
      getPendingTransactions: () => {
        return this.txStateManager.getFilteredTxList({ status: 'submitted' })
      },
      giveUpOnTransaction: (txId) => {
        const msg = `Gave up submitting after 3500 blocks un-mined.`
        this.setTxStatusFailed(txId, msg)
      },
    })

    this.txStateManager.subscribe(() => {
      this.emit('update')
      this.emit('updateBadge')
    })

    this.pendingTxTracker.on('txWarning', this.txStateManager.updateTx.bind(this.txStateManager))
    this.pendingTxTracker.on('txFailed', this.txStateManager.setTxStatusFailed.bind(this.txStateManager))
    this.pendingTxTracker.on('txConfirmed', this.txStateManager.setTxStatusConfirmed.bind(this.txStateManager))

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
    this.txStateManager.subscribe(() => this._updateMemstore())
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

  getPendingTxCount () {
    return this.txStateManager.getTxsByMetaData('status', 'signed').length
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
    this.emit('newUnaprovedTx', txMeta)
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
    const gasPrice = txParams.gasPrice || await this.query.gasPrice()
    txParams.value = txParams.value || '0x0'
    txParams.gasPrice = ethUtil.addHexPrefix(gasPrice.toString(16))
    // set gasLimit
    return await this.txGasUtil.analyzeGasUsage(txMeta)
  }

  async updateAndApproveTransaction (txMeta) {
    this.txStateManager.updateTx(txMeta)
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
      txMeta.txParams.nonce = nonceLock.nextNonce
      // add nonce debugging information to txMeta
      txMeta.nonceDetails = nonceLock.nonceDetails
      this.txStateManager.updateTx(txMeta)
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
    txParams.chainId = this.getChainId()
    const ethTx = new Transaction(txParams)
    await this.signEthTx(ethTx, fromAddress)
    this.txStateManager.setTxStatusSigned(txMeta.id)
    const rawTx = ethUtil.bufferToHex(ethTx.serialize())
    return rawTx
  }

  async publishTransaction (txId, rawTx) {
    const txMeta = this.txStateManager.getTx(txId)
    txMeta.rawTx = rawTx
    this.txStateManager.updateTx(txMeta)
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
    this.txStateManager.updateTx(txMeta)
  }

/* _____________________________________
|                                      |
|           PRIVATE METHODS            |
|______________________________________*/

  _updateMemstore () {
    const unapprovedTxs = this.txStateManager.getUnapprovedTxList()
    const selectedAddressTxList = this.txStateManager.getFilteredTxList({
      from: this.getSelectedAddress(),
      metamaskNetworkId: this.getNetwork(),
    })
    this.memStore.updateState({ unapprovedTxs, selectedAddressTxList })
  }
}
