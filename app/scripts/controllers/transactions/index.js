const EventEmitter = require('safe-event-emitter')
const ObservableStore = require('obs-store')
const ethUtil = require('ethereumjs-util')
const Transaction = require('ethereumjs-tx')
const EthQuery = require('ethjs-query')
const abi = require('human-standard-token-abi')
const abiDecoder = require('abi-decoder')
abiDecoder.addABI(abi)
const {
  TOKEN_METHOD_APPROVE,
  TOKEN_METHOD_TRANSFER,
  TOKEN_METHOD_TRANSFER_FROM,
  SEND_ETHER_ACTION_KEY,
  DEPLOY_CONTRACT_ACTION_KEY,
  CONTRACT_INTERACTION_KEY,
} = require('../../../../ui/app/helpers/constants/transactions.js')
const TransactionStateManager = require('./tx-state-manager')
const TxGasUtil = require('./tx-gas-utils')
const PendingTransactionTracker = require('./pending-tx-tracker')
const NonceTracker = require('./nonce-tracker')
const txUtils = require('./lib/util')
const cleanErrorStack = require('../../lib/cleanErrorStack')
const log = require('loglevel')
const recipientBlacklistChecker = require('./lib/recipient-blacklist-checker')
const {
  TRANSACTION_TYPE_CANCEL,
  TRANSACTION_TYPE_RETRY,
  TRANSACTION_TYPE_STANDARD,
  TRANSACTION_STATUS_APPROVED,
} = require('./enums')

const { hexToBn, bnToHex, BnMultiplyByFraction } = require('../../lib/util')

/**
  Transaction Controller is an aggregate of sub-controllers and trackers
  composing them in a way to be exposed to the metamask controller
    <br>- txStateManager
      responsible for the state of a transaction and
      storing the transaction
    <br>- pendingTxTracker
      watching blocks for transactions to be include
      and emitting confirmed events
    <br>- txGasUtil
      gas calculations and safety buffering
    <br>- nonceTracker
      calculating nonces


  @class
  @param {object} - opts
  @param {object}  opts.initState - initial transaction list default is an empty array
  @param {Object}  opts.networkStore - an observable store for network number
  @param {Object}  opts.blockTracker - An instance of eth-blocktracker
  @param {Object}  opts.provider - A network provider.
  @param {Function}  opts.signTransaction - function the signs an ethereumjs-tx
  @param {Function}  [opts.getGasPrice] - optional gas price calculator
  @param {Function}  opts.signTransaction - ethTx signer that returns a rawTx
  @param {Number}  [opts.txHistoryLimit] - number *optional* for limiting how many transactions are in state
  @param {Object}  opts.preferencesStore
*/

class TransactionController extends EventEmitter {
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

    this._mapMethods()
    this.txStateManager = new TransactionStateManager({
      initState: opts.initState,
      txHistoryLimit: opts.txHistoryLimit,
      getNetwork: this.getNetwork.bind(this),
    })
    this._onBootCleanUp()

    this.store = this.txStateManager.store
    this.nonceTracker = new NonceTracker({
      provider: this.provider,
      blockTracker: this.blockTracker,
      getPendingTransactions: this.txStateManager.getPendingTransactions.bind(this.txStateManager),
      getConfirmedTransactions: this.txStateManager.getConfirmedTransactions.bind(this.txStateManager),
    })

    this.pendingTxTracker = new PendingTransactionTracker({
      provider: this.provider,
      nonceTracker: this.nonceTracker,
      publishTransaction: (rawTx) => this.query.sendRawTransaction(rawTx),
      getPendingTransactions: () => {
        const pending = this.txStateManager.getPendingTransactions()
        const approved = this.txStateManager.getApprovedTransactions()
        return [...pending, ...approved]
      },
      approveTransaction: this.approveTransaction.bind(this),
      getCompletedTransactions: this.txStateManager.getConfirmedTransactions.bind(this.txStateManager),
    })

    this.txStateManager.store.subscribe(() => this.emit('update:badge'))
    this._setupListeners()
    // memstore is computed from a few different stores
    this._updateMemstore()
    this.txStateManager.store.subscribe(() => this._updateMemstore())
    this.networkStore.subscribe(() => {
      this._onBootCleanUp()
      this._updateMemstore()
    })
    this.preferencesStore.subscribe(() => this._updateMemstore())

    // request state update to finalize initialization
    this._updatePendingTxsAfterFirstBlock()
  }

  /** @returns {number} the chainId*/
  getChainId () {
    const networkState = this.networkStore.getState()
    const getChainId = parseInt(networkState)
    if (Number.isNaN(getChainId)) {
      return 0
    } else {
      return getChainId
    }
  }

/**
  Adds a tx to the txlist
  @emits ${txMeta.id}:unapproved
*/
  addTx (txMeta) {
    this.txStateManager.addTx(txMeta)
    this.emit(`${txMeta.id}:unapproved`, txMeta)
  }

  /**
  Wipes the transactions for a given account
  @param {string} address - hex string of the from address for txs being removed
  */
  wipeTransactions (address) {
    this.txStateManager.wipeTransactions(address)
  }

  /**
  add a new unapproved transaction to the pipeline

  @returns {Promise<string>} the hash of the transaction after being submitted to the network
  @param txParams {object} - txParams for the transaction
  @param opts {object} - with the key origin to put the origin on the txMeta
  */

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
            return reject(cleanErrorStack(new Error('MetaMask Tx Signature: User denied transaction signature.')))
          case 'failed':
            return reject(cleanErrorStack(new Error(finishedTxMeta.err.message)))
          default:
            return reject(cleanErrorStack(new Error(`MetaMask Tx Signature: Unknown problem: ${JSON.stringify(finishedTxMeta.txParams)}`)))
        }
      })
    })
  }

  /**
  Validates and generates a txMeta with defaults and puts it in txStateManager
  store

  @returns {txMeta}
  */

  async addUnapprovedTransaction (txParams) {
    // validate
    const normalizedTxParams = txUtils.normalizeTxParams(txParams)
    // Assert the from address is the selected address
    if (normalizedTxParams.from !== this.getSelectedAddress()) {
      throw new Error(`Transaction from address isn't valid for this account`)
    }
    txUtils.validateTxParams(normalizedTxParams)
    // construct txMeta
    const { transactionCategory, code } = await this._determineTransactionCategory(txParams)
    let txMeta = this.txStateManager.generateTxMeta({
      txParams: normalizedTxParams,
      type: TRANSACTION_TYPE_STANDARD,
      transactionCategory,
    })
    this.addTx(txMeta)
    this.emit('newUnapprovedTx', txMeta)

    try {
      // check whether recipient account is blacklisted
      recipientBlacklistChecker.checkAccount(txMeta.metamaskNetworkId, normalizedTxParams.to)
      // add default tx params
      txMeta = await this.addTxGasDefaults(txMeta, code)
    } catch (error) {
      log.warn(error)
      txMeta.loadingDefaults = false
      this.txStateManager.updateTx(txMeta, 'Failed to calculate gas defaults.')
      throw error
    }

    txMeta.loadingDefaults = false

    // save txMeta
    this.txStateManager.updateTx(txMeta)

    return txMeta
  }
/**
  adds the tx gas defaults: gas && gasPrice
  @param txMeta {Object} - the txMeta object
  @returns {Promise<object>} resolves with txMeta
*/
  async addTxGasDefaults (txMeta, code) {
    const txParams = txMeta.txParams
    // ensure value
    txParams.value = txParams.value ? ethUtil.addHexPrefix(txParams.value) : '0x0'
    txMeta.gasPriceSpecified = Boolean(txParams.gasPrice)
    let gasPrice = txParams.gasPrice
    if (!gasPrice) {
      gasPrice = this.getGasPrice ? this.getGasPrice() : await this.query.gasPrice()
    }
    txParams.gasPrice = ethUtil.addHexPrefix(gasPrice.toString(16))
    // set gasLimit
    return await this.txGasUtil.analyzeGasUsage(txMeta, code)
  }

  /**
    Creates a new txMeta with the same txParams as the original
    to allow the user to resign the transaction with a higher gas values
    @param  originalTxId {number} - the id of the txMeta that
    you want to attempt to retry
    @param  gasPrice {string=} - Optional gas price to be increased to use as the retry
    transaction's gas price
    @return {txMeta}
  */

  async retryTransaction (originalTxId, gasPrice) {
    const originalTxMeta = this.txStateManager.getTx(originalTxId)
    const { txParams } = originalTxMeta
    const lastGasPrice = gasPrice || originalTxMeta.txParams.gasPrice
    const suggestedGasPriceBN = new ethUtil.BN(ethUtil.stripHexPrefix(this.getGasPrice()), 16)
    const lastGasPriceBN = new ethUtil.BN(ethUtil.stripHexPrefix(lastGasPrice), 16)
    // essentially lastGasPrice * 1.1 but
    // dont trust decimals so a round about way of doing that
    const lastGasPriceBNBumped = lastGasPriceBN.mul(new ethUtil.BN(110, 10)).div(new ethUtil.BN(100, 10))
    // transactions that are being retried require a >=%10 bump or the clients will throw an error
    txParams.gasPrice = suggestedGasPriceBN.gt(lastGasPriceBNBumped) ? `0x${suggestedGasPriceBN.toString(16)}` : `0x${lastGasPriceBNBumped.toString(16)}`

    const txMeta = this.txStateManager.generateTxMeta({
      txParams: originalTxMeta.txParams,
      lastGasPrice,
      loadingDefaults: false,
      type: TRANSACTION_TYPE_RETRY,
    })
    this.addTx(txMeta)
    this.emit('newUnapprovedTx', txMeta)
    return txMeta
  }

  /**
   * Creates a new approved transaction to attempt to cancel a previously submitted transaction. The
   * new transaction contains the same nonce as the previous, is a basic ETH transfer of 0x value to
   * the sender's address, and has a higher gasPrice than that of the previous transaction.
   * @param {number} originalTxId - the id of the txMeta that you want to attempt to cancel
   * @param {string=} customGasPrice - the hex value to use for the cancel transaction
   * @returns {txMeta}
   */
  async createCancelTransaction (originalTxId, customGasPrice) {
    const originalTxMeta = this.txStateManager.getTx(originalTxId)
    const { txParams } = originalTxMeta
    const { gasPrice: lastGasPrice, from, nonce } = txParams

    const newGasPrice = customGasPrice || bnToHex(BnMultiplyByFraction(hexToBn(lastGasPrice), 11, 10))
    const newTxMeta = this.txStateManager.generateTxMeta({
      txParams: {
        from,
        to: from,
        nonce,
        gas: '0x5208',
        value: '0x0',
        gasPrice: newGasPrice,
      },
      lastGasPrice,
      loadingDefaults: false,
      status: TRANSACTION_STATUS_APPROVED,
      type: TRANSACTION_TYPE_CANCEL,
    })

    this.addTx(newTxMeta)
    await this.approveTransaction(newTxMeta.id)
    return newTxMeta
  }

  async createSpeedUpTransaction (originalTxId, customGasPrice) {
    const originalTxMeta = this.txStateManager.getTx(originalTxId)
    const { txParams } = originalTxMeta
    const { gasPrice: lastGasPrice } = txParams

    const newGasPrice = customGasPrice || bnToHex(BnMultiplyByFraction(hexToBn(lastGasPrice), 11, 10))

    const newTxMeta = this.txStateManager.generateTxMeta({
      txParams: {
        ...txParams,
        gasPrice: newGasPrice,
      },
      lastGasPrice,
      loadingDefaults: false,
      status: TRANSACTION_STATUS_APPROVED,
      type: TRANSACTION_TYPE_RETRY,
    })

    this.addTx(newTxMeta)
    await this.approveTransaction(newTxMeta.id)
    return newTxMeta
  }

  /**
  updates the txMeta in the txStateManager
  @param txMeta {Object} - the updated txMeta
  */
  async updateTransaction (txMeta) {
    this.txStateManager.updateTx(txMeta, 'confTx: user updated transaction')
  }

  /**
  updates and approves the transaction
  @param txMeta {Object}
  */
  async updateAndApproveTransaction (txMeta) {
    this.txStateManager.updateTx(txMeta, 'confTx: user approved transaction')
    await this.approveTransaction(txMeta.id)
  }

  /**
  sets the tx status to approved
  auto fills the nonce
  signs the transaction
  publishes the transaction
  if any of these steps fails the tx status will be set to failed
    @param txId {number} - the tx's Id
  */
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
      // this is try-catch wrapped so that we can guarantee that the nonceLock is released
      try {
        this.txStateManager.setTxStatusFailed(txId, err)
      } catch (err) {
        log.error(err)
      }
      // must set transaction to submitted/failed before releasing lock
      if (nonceLock) nonceLock.releaseLock()
      // continue with error chain
      throw err
    }
  }
  /**
    adds the chain id and signs the transaction and set the status to signed
    @param txId {number} - the tx's Id
    @returns - rawTx {string}
  */
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

  /**
    publishes the raw tx and sets the txMeta to submitted
    @param txId {number} - the tx's Id
    @param rawTx {string} - the hex string of the serialized signed transaction
    @returns {Promise<void>}
  */
  async publishTransaction (txId, rawTx) {
    const txMeta = this.txStateManager.getTx(txId)
    txMeta.rawTx = rawTx
    this.txStateManager.updateTx(txMeta, 'transactions#publishTransaction')
    const txHash = await this.query.sendRawTransaction(rawTx)
    this.setTxHash(txId, txHash)
    this.txStateManager.setTxStatusSubmitted(txId)
  }

  /**
   * Sets the status of the transaction to confirmed and sets the status of nonce duplicates as
   * dropped if the txParams have data it will fetch the txReceipt
   * @param {number} txId - The tx's ID
   * @returns {Promise<void>}
   */
  async confirmTransaction (txId) {
    // get the txReceipt before marking the transaction confirmed
    // to ensure the receipt is gotten before the ui revives the tx
    const txMeta = this.txStateManager.getTx(txId)

    if (!txMeta) {
      return
    }

    try {
      const txReceipt = await this.query.getTransactionReceipt(txMeta.hash)

      // It seems that sometimes the numerical values being returned from
      // this.query.getTransactionReceipt are BN instances and not strings.
      const gasUsed = typeof txReceipt.gasUsed !== 'string'
        ? txReceipt.gasUsed.toString(16)
        : txReceipt.gasUsed

      txMeta.txReceipt = {
        ...txReceipt,
        gasUsed,
      }

      this.txStateManager.updateTx(txMeta, 'transactions#confirmTransaction - add txReceipt')
    } catch (err) {
      log.error(err)
    }

    this.txStateManager.setTxStatusConfirmed(txId)
    this._markNonceDuplicatesDropped(txId)
  }

  /**
    Convenience method for the ui thats sets the transaction to rejected
    @param txId {number} - the tx's Id
    @returns {Promise<void>}
  */
  async cancelTransaction (txId) {
    this.txStateManager.setTxStatusRejected(txId)
  }

  /**
    Sets the txHas on the txMeta
    @param txId {number} - the tx's Id
    @param txHash {string} - the hash for the txMeta
  */
  setTxHash (txId, txHash) {
    // Add the tx hash to the persisted meta-tx object
    const txMeta = this.txStateManager.getTx(txId)
    txMeta.hash = txHash
    this.txStateManager.updateTx(txMeta, 'transactions#setTxHash')
  }

//
//           PRIVATE METHODS
//
  /** maps methods for convenience*/
  _mapMethods () {
    /** @returns the state in transaction controller */
    this.getState = () => this.memStore.getState()
    /** @returns the network number stored in networkStore */
    this.getNetwork = () => this.networkStore.getState()
    /** @returns the user selected address */
    this.getSelectedAddress = () => this.preferencesStore.getState().selectedAddress
    /** Returns an array of transactions whos status is unapproved */
    this.getUnapprovedTxCount = () => Object.keys(this.txStateManager.getUnapprovedTxList()).length
    /**
      @returns a number that represents how many transactions have the status submitted
      @param account {String} - hex prefixed account
    */
    this.getPendingTxCount = (account) => this.txStateManager.getPendingTransactions(account).length
    /** see txStateManager */
    this.getFilteredTxList = (opts) => this.txStateManager.getFilteredTxList(opts)
  }

  // called once on startup
  async _updatePendingTxsAfterFirstBlock () {
    // wait for first block so we know we're ready
    await this.blockTracker.getLatestBlock()
    // get status update for all pending transactions (for the current network)
    await this.pendingTxTracker.updatePendingTxs()
  }

  /**
    If transaction controller was rebooted with transactions that are uncompleted
    in steps of the transaction signing or user confirmation process it will either
    transition txMetas to a failed state or try to redo those tasks.
  */

  _onBootCleanUp () {
    this.txStateManager.getFilteredTxList({
      status: 'unapproved',
      loadingDefaults: true,
    }).forEach((tx) => {
      this.addTxGasDefaults(tx)
      .then((txMeta) => {
        txMeta.loadingDefaults = false
        this.txStateManager.updateTx(txMeta, 'transactions: gas estimation for tx on boot')
      }).catch((error) => {
        tx.loadingDefaults = false
        this.txStateManager.updateTx(tx, 'failed to estimate gas during boot cleanup.')
        this.txStateManager.setTxStatusFailed(tx.id, error)
      })
    })

    this.txStateManager.getFilteredTxList({
      status: TRANSACTION_STATUS_APPROVED,
    }).forEach((txMeta) => {
      const txSignError = new Error('Transaction found as "approved" during boot - possibly stuck during signing')
      this.txStateManager.setTxStatusFailed(txMeta.id, txSignError)
    })
  }

  /**
    is called in constructor applies the listeners for pendingTxTracker txStateManager
    and blockTracker
  */
  _setupListeners () {
    this.txStateManager.on('tx:status-update', this.emit.bind(this, 'tx:status-update'))
    this._setupBlockTrackerListener()
    this.pendingTxTracker.on('tx:warning', (txMeta) => {
      this.txStateManager.updateTx(txMeta, 'transactions/pending-tx-tracker#event: tx:warning')
    })
    this.pendingTxTracker.on('tx:failed', this.txStateManager.setTxStatusFailed.bind(this.txStateManager))
    this.pendingTxTracker.on('tx:confirmed', (txId) => this.confirmTransaction(txId))
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
  }

  /**
    Returns a "type" for a transaction out of the following list: simpleSend, tokenTransfer, tokenApprove,
    contractDeployment, contractMethodCall
  */
  async _determineTransactionCategory (txParams) {
    const { data, to } = txParams
    const { name } = data && abiDecoder.decodeMethod(data) || {}
    const tokenMethodName = [
      TOKEN_METHOD_APPROVE,
      TOKEN_METHOD_TRANSFER,
      TOKEN_METHOD_TRANSFER_FROM,
    ].find(tokenMethodName => tokenMethodName === name && name.toLowerCase())

    let result
    let code
    if (!txParams.data) {
      result = SEND_ETHER_ACTION_KEY
    } else if (tokenMethodName) {
      result = tokenMethodName
    } else if (!to) {
      result = DEPLOY_CONTRACT_ACTION_KEY
    } else {
      try {
        code = await this.query.getCode(to)
      } catch (e) {
        log.warn(e)
      }
      // For an address with no code, geth will return '0x', and ganache-core v2.2.1 will return '0x0'
      const codeIsEmpty = !code || code === '0x' || code === '0x0'

      result = codeIsEmpty ? SEND_ETHER_ACTION_KEY : CONTRACT_INTERACTION_KEY
    }

    return { transactionCategory: result, code }
  }

  /**
    Sets other txMeta statuses to dropped if the txMeta that has been confirmed has other transactions
    in the list have the same nonce

    @param txId {Number} - the txId of the transaction that has been confirmed in a block
  */
  _markNonceDuplicatesDropped (txId) {
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

  _setupBlockTrackerListener () {
    let listenersAreActive = false
    const latestBlockHandler = this._onLatestBlock.bind(this)
    const blockTracker = this.blockTracker
    const txStateManager = this.txStateManager

    txStateManager.on('tx:status-update', updateSubscription)
    updateSubscription()

    function updateSubscription () {
      const pendingTxs = txStateManager.getPendingTransactions()
      if (!listenersAreActive && pendingTxs.length > 0) {
        blockTracker.on('latest', latestBlockHandler)
        listenersAreActive = true
      } else if (listenersAreActive && !pendingTxs.length) {
        blockTracker.removeListener('latest', latestBlockHandler)
        listenersAreActive = false
      }
    }
  }

  async _onLatestBlock (blockNumber) {
    try {
      await this.pendingTxTracker.updatePendingTxs()
    } catch (err) {
      log.error(err)
    }
    try {
      await this.pendingTxTracker.resubmitPendingTxs(blockNumber)
    } catch (err) {
      log.error(err)
    }
  }

  /**
    Updates the memStore in transaction controller
  */
  _updateMemstore () {
    this.pendingTxTracker.updatePendingTxs()
    const unapprovedTxs = this.txStateManager.getUnapprovedTxList()
    const selectedAddressTxList = this.txStateManager.getFilteredTxList({
      from: this.getSelectedAddress(),
      metamaskNetworkId: this.getNetwork(),
    })
    this.memStore.updateState({ unapprovedTxs, selectedAddressTxList })
  }
}

module.exports = TransactionController
