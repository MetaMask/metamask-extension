const EventEmitter = require('events')
const EthQuery = require('ethjs-query')
/*

  Utility class for tracking the transactions as they
  go from a pending state to a confirmed (mined in a block) state

  As well as continues broadcast while in the pending state

                ~config is not optional~
  requires a: {
    provider: //,
    nonceTracker: //see nonce tracker,
    getPendingTransactions: //() a function for getting an array of transactions,
    publishTransaction: //(rawTx) a async function for publishing raw transactions,
  }

*/

module.exports = class PendingTransactionTracker extends EventEmitter {
  constructor (config) {
    super()
    this.query = new EthQuery(config.provider)
    this.nonceTracker = config.nonceTracker
    // default is one day
    this.getPendingTransactions = config.getPendingTransactions
    this.getCompletedTransactions = config.getCompletedTransactions
    this.publishTransaction = config.publishTransaction
    this._checkPendingTxs()
  }

  //  checks if a signed tx is in a block and
  // if included sets the tx status as 'confirmed'
  checkForTxInBlock (block) {
    const signedTxList = this.getPendingTransactions()
    if (!signedTxList.length) return
    signedTxList.forEach((txMeta) => {
      const txHash = txMeta.hash
      const txId = txMeta.id

      if (!txHash) {
        const noTxHashErr = new Error('We had an error while submitting this transaction, please try again.')
        noTxHashErr.name = 'NoTxHashError'
        this.emit('tx:failed', txId, noTxHashErr)
        return
      }


      block.transactions.forEach((tx) => {
        if (tx.hash === txHash) this.emit('tx:confirmed', txId)
      })
    })
  }

  queryPendingTxs ({ oldBlock, newBlock }) {
    // check pending transactions on start
    if (!oldBlock) {
      this._checkPendingTxs()
      return
    }
    // if we synced by more than one block, check for missed pending transactions
    const diff = Number.parseInt(newBlock.number, 16) - Number.parseInt(oldBlock.number, 16)
    if (diff > 1) this._checkPendingTxs()
  }

  resubmitPendingTxs (block) {
    const pending = this.getPendingTransactions() || []
    pending.forEach((txMeta) => this.submitTx(txMeta, block.number))
  }

  async submitTx (txMeta, latestBlockNumber) {
    try {
      if (!txMeta.firstRetryBlockNumber) {
        this.emit('tx:block-update', txMeta, latestBlockNumber)
      }

      // If we have a latest block, enforce exponential backoff to limit retries:
      if (latestBlockNumber) {
        const firstRetryBlockNumber = txMeta.firstRetryBlockNumber || latestBlockNumber
        const txBlockDistance = Number.parseInt(latestBlockNumber, 16) - Number.parseInt(firstRetryBlockNumber, 16)

        const retryCount = txMeta.retryCount || 0

        if (txBlockDistance <= Math.pow(2, retryCount) - 1) return
      }

      // Only auto-submit already-signed txs:
      if (!('rawTx' in txMeta)) return

      const rawTx = txMeta.rawTx
      const txHash = await this.publishTransaction(rawTx)

      // Increment successful tries:
      this.emit('tx:retry', txMeta)
      return txHash

    } catch (err) {
      /*
      Dont marked as failed if the error is a "known" transaction warning
      "there is already a transaction with the same sender-nonce
      but higher/same gas price"

      Also don't mark as failed if it has ever been broadcast successfully.
      A successful broadcast means it may still be mined.
      */
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
      if (isKnownTx) return
      // encountered real error - transition to error state
      txMeta.err = {
        error: errorMessage,
        message: 'There was an error when resubmitting this transaction.',
      }
      this.emit('tx:failed', txMeta, err)
      throw err
    }
  }

  async _checkPendingTx (txMeta) {
    const txHash = txMeta.hash
    const txId = txMeta.id

    // extra check in case there was an uncaught error during the
    // signature and submission process
    if (!txHash) {
      const noTxHashErr = new Error('We had an error while submitting this transaction, please try again.')
      noTxHashErr.name = 'NoTxHashError'
      this.emit('tx:failed', txId, noTxHashErr)
      return
    }

    // If another tx with the same nonce is mined, set as failed.
    const taken = await this._checkIfNonceIsTaken(txMeta)
    if (taken) {
      const nonceTakenErr = new Error('Another transaction with this nonce has been mined.')
      nonceTakenErr.name = 'NonceTakenErr'
      return this.emit('tx:failed', txId, nonceTakenErr)
    }

    // get latest transaction status
    let txParams
    try {
      txParams = await this.query.getTransactionByHash(txHash)
      if (!txParams) return
      if (txParams.blockNumber) {
        this.emit('tx:confirmed', txId)
      }
    } catch (err) {
      txMeta.warning = {
        error: err.message,
        message: 'There was a problem loading this transaction.',
      }
      this.emit('tx:warning', txMeta, err)
    }
  }

  // checks the network for signed txs and
  // if confirmed sets the tx status as 'confirmed'
  async _checkPendingTxs () {
    const signedTxList = this.getPendingTransactions()
    // in order to keep the nonceTracker accurate we block it while updating pending transactions
    const nonceGlobalLock = await this.nonceTracker.getGlobalLock()
    try {
      await Promise.all(signedTxList.map((txMeta) => this._checkPendingTx(txMeta)))
    } catch (err) {
      log.error('PendingTransactionWatcher - Error updating pending transactions')
      log.error(err)
    }
    nonceGlobalLock.releaseLock()
  }

  async _checkIfNonceIsTaken (txMeta) {
    const address = txMeta.txParams.from
    const completed = this.getCompletedTransactions(address)
    const sameNonce = completed.filter((otherMeta) => {
      return otherMeta.txParams.nonce === txMeta.txParams.nonce
    })
    return sameNonce.length > 0
  }

}
