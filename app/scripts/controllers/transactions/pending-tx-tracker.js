import EventEmitter from 'safe-event-emitter'
import log from 'loglevel'
import EthQuery from 'ethjs-query'

/**

  Event emitter utility class for tracking the transactions as they<br>
  go from a pending state to a confirmed (mined in a block) state<br>
<br>
  As well as continues broadcast while in the pending state
<br>
@param {Object} config - non optional configuration object consists of:
    @param {Object} config.provider - A network provider.
    @param {Object} config.nonceTracker see nonce tracker
    @param {function} config.getPendingTransactions a function for getting an array of transactions,
    @param {function} config.publishTransaction a async function for publishing raw transactions,


@class
*/

export default class PendingTransactionTracker extends EventEmitter {
  constructor (config) {
    super()
    this.droppedBuffer = {}
    this.query = config.query || (new EthQuery(config.provider))
    this.nonceTracker = config.nonceTracker
    this.getPendingTransactions = config.getPendingTransactions
    this.getCompletedTransactions = config.getCompletedTransactions
    this.publishTransaction = config.publishTransaction
    this.approveTransaction = config.approveTransaction
    this.confirmTransaction = config.confirmTransaction
  }

  /**
    checks the network for signed txs and releases the nonce global lock if it is
  */
  async updatePendingTxs () {
    // in order to keep the nonceTracker accurate we block it while updating pending transactions
    const nonceGlobalLock = await this.nonceTracker.getGlobalLock()
    try {
      const pendingTxs = this.getPendingTransactions()
      await Promise.all(pendingTxs.map((txMeta) => this._checkPendingTx(txMeta)))
    } catch (err) {
      log.error('PendingTransactionTracker - Error updating pending transactions')
      log.error(err)
    }
    nonceGlobalLock.releaseLock()
  }

  /**
   * Resubmits each pending transaction
   * @param {string} blockNumber - the latest block number in hex
   * @emits tx:warning
   * @returns {Promise<void>}
   */
  async resubmitPendingTxs (blockNumber) {
    const pending = this.getPendingTransactions()
    if (!pending.length) {
      return
    }
    for (const txMeta of pending) {
      try {
        await this._resubmitTx(txMeta, blockNumber)
      } catch (err) {
        const errorMessage = err.message.toLowerCase()
        const isKnownTx = (
          // geth
          errorMessage.includes('replacement transaction underpriced') ||
          errorMessage.includes('known transaction') ||
          // parity
          errorMessage.includes('gas price too low to replace') ||
          errorMessage.includes('transaction with the same hash was already imported') ||
          // other
          errorMessage.includes('gateway timeout') ||
          errorMessage.includes('nonce too low')
        )
        // ignore resubmit warnings, return early
        if (isKnownTx) {
          return
        }
        // encountered real error - transition to error state
        txMeta.warning = {
          error: errorMessage,
          message: 'There was an error when resubmitting this transaction.',
        }
        this.emit('tx:warning', txMeta, err)
      }
    }
  }

  /**
   * Attempts to resubmit the given transaction with exponential backoff
   *
   * Will only attempt to retry the given tx every {@code 2**(txMeta.retryCount)} blocks.
   *
   * @param {Object} txMeta - the transaction metadata
   * @param {string} latestBlockNumber - the latest block number in hex
   * @returns {Promise<string|undefined>} the tx hash if retried
   * @emits tx:block-update
   * @emits tx:retry
   * @private
   */
  async _resubmitTx (txMeta, latestBlockNumber) {
    if (!txMeta.firstRetryBlockNumber) {
      this.emit('tx:block-update', txMeta, latestBlockNumber)
    }

    const firstRetryBlockNumber = txMeta.firstRetryBlockNumber || latestBlockNumber
    const txBlockDistance = Number.parseInt(latestBlockNumber, 16) - Number.parseInt(firstRetryBlockNumber, 16)

    const retryCount = txMeta.retryCount || 0

    // Exponential backoff to limit retries at publishing
    if (txBlockDistance <= Math.pow(2, retryCount) - 1) {
      return
    }

    // Only auto-submit already-signed txs:
    if (!('rawTx' in txMeta)) {
      return this.approveTransaction(txMeta.id)
    }

    const rawTx = txMeta.rawTx
    const txHash = await this.publishTransaction(rawTx)

    // Increment successful tries:
    this.emit('tx:retry', txMeta)
    return txHash
  }

  /**
   * Query the network to see if the given {@code txMeta} has been included in a block
   * @param {Object} txMeta - the transaction metadata
   * @returns {Promise<void>}
   * @emits tx:confirmed
   * @emits tx:dropped
   * @emits tx:failed
   * @emits tx:warning
   * @private
   */
  async _checkPendingTx (txMeta) {
    const txHash = txMeta.hash
    const txId = txMeta.id

    // Only check submitted txs
    if (txMeta.status !== 'submitted') {
      return
    }

    // extra check in case there was an uncaught error during the
    // signature and submission process
    if (!txHash) {
      const noTxHashErr = new Error('We had an error while submitting this transaction, please try again.')
      noTxHashErr.name = 'NoTxHashError'
      this.emit('tx:failed', txId, noTxHashErr)

      return
    }
    // *note to self* hard failure point
    const transactionReceipt = await this.query.getTransactionReceipt(txHash)


    // If another tx with the same nonce is mined, set as dropped.
    const taken = await this._checkIfNonceIsTaken(txMeta)
    let dropped
    try {
      // check the network if the nonce is ahead the tx
      // and the tx has not been mined into a block
      dropped = await this._checkIfTxWasDropped(txMeta, transactionReceipt)

      // the dropped buffer is in case we ask a node for the tx
      // that is behind the node we asked for tx count
      // IS A SECURITY FOR HITTING NODES IN INFURA THAT COULD GO OUT
      // OF SYNC.
      // on the next block event it will return fire as dropped
      if (typeof this.droppedBuffer[txHash] !== 'number') {
        this.droppedBuffer[txHash] = 0
      }

      // 3 block count buffer
      if (dropped && this.droppedBuffer[txHash] < 3) {
        dropped = false
        ++this.droppedBuffer[txHash]
      }

      if (dropped && this.droppedBuffer[txHash] === 3) {
        // clean up
        delete this.droppedBuffer[txHash]
      }
    } catch (e) {
      log.error(e)
    }

    if (taken || dropped) {
      this.emit('tx:dropped', txId)
      return
    }

    // get latest transaction status
    if (transactionReceipt?.blockNumber) {
      this.emit('tx:confirmed', txId, transactionReceipt)
    } else {
      const err = new Error('Missing transaction receipt or block number.')
      txMeta.warning = {
        error: err.message,
        message: 'There was a problem loading this transaction.',
      }
      this.emit('tx:warning', txMeta, err)
    }
  }

  /**
   * Checks whether the nonce in the given {@code txMeta} is correct against the network
   * @param {Object} txMeta - the transaction metadata
   * @param {Object} [transactionReceipt] - the transaction receipt
   * @returns {Promise<boolean>}
   * @private
   */
  async _checkIfTxWasDropped (txMeta, transactionReceipt) {
    const { txParams: { nonce, from } } = txMeta
    const nextNonce = await this.query.getTransactionCount(from)
    return !transactionReceipt?.blockNumber && parseInt(nextNonce) > parseInt(nonce)
  }

  /**
   * Checks whether the nonce in the given {@code txMeta} is correct against the local set of transactions
   * @param {Object} txMeta - the transaction metadata
   * @returns {Promise<boolean>}
   * @private
   */
  async _checkIfNonceIsTaken (txMeta) {
    const address = txMeta.txParams.from
    const completed = this.getCompletedTransactions(address)
    return completed.some((other) =>
      // This is called while the transaction is in-flight, so it is possible that the
      // list of completed transactions now includes the transaction we were looking at
      // and if that is the case, don't consider the transaction to have taken its own nonce
      !(other.id === txMeta.id) && other.txParams.nonce === txMeta.txParams.nonce
    )
  }
}
