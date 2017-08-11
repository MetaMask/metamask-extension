const EventEmitter = require('events')
const extend = require('xtend')
const clone = require('clone')
const ObservableStore = require('obs-store')
const ethUtil = require('ethereumjs-util')
const EthQuery = require('ethjs-query')
const TransactionStateManger = require('../lib/tx-state-manager')
const TxProviderUtil = require('../lib/tx-utils')
const PendingTransactionTracker = require('../lib/pending-tx-tracker')
const createId = require('../lib/random-id')
const NonceTracker = require('../lib/nonce-tracker')

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
    this.txProviderUtil = new TxProviderUtil(this.provider)

    this.txStateManager = new TransactionStateManger(extend({
      transactions: [],
      txHistoryLimit: opts.txHistoryLimit,
      getNetwork: this.getNetwork.bind(this),
    }, opts.initState))

    this.nonceTracker = new NonceTracker({
      provider: this.provider,
      getPendingTransactions: (address) => {
        return this.getFilteredTxList({
          from: address,
          status: 'submitted',
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
    return Object.keys(this.getUnapprovedTxList()).length
  }

  getPendingTxCount () {
    return this.txStateManager.getTxsByMetaData('status', 'signed').length
  }

  // Returns the tx list

  getUnapprovedTxList () {
    const txList = this.txStateManager.getTxsByMetaData('status', 'unapproved')
    return txList.reduce((result, tx) => {
      result[tx.id] = tx
      return result
    }, {})
  }

  // Adds a tx to the txlist
  addTx (txMeta) {
    this.txStateManager.addTx(txMeta)
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
      history: [],
    }
    // add default tx params
    await this.addTxDefaults(txMeta)
    // save txMeta
    this.txStateManager.addTx(txMeta)
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

/* _____________________________________
|                                      |
|           PRIVATE METHODS            |
|______________________________________*/

  _updateMemstore () {
    const unapprovedTxs = this.getUnapprovedTxList()
    const selectedAddressTxList = this.getFilteredTxList({
      from: this.getSelectedAddress(),
      metamaskNetworkId: this.getNetwork(),
    })
    this.memStore.updateState({ unapprovedTxs, selectedAddressTxList })
  }
}