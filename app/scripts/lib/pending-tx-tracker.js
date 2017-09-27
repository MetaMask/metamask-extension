const EventEmitter = require('events')
const EthQuery = require('ethjs-query')
const sufficientBalance = require('./util').sufficientBalance
/*

  Utility class for tracking the transactions as they
  go from a pending state to a confirmed (mined in a block) state

  As well as continues broadcast while in the pending state

                ~config is not optional~
  requires a: {
    provider: //,
    nonceTracker: //see nonce tracker,
    getBalnce: //(address) a function for getting balances,
    getPendingTransactions: //() a function for getting an array of transactions,
    publishTransaction: //(rawTx) a async function for publishing raw transactions,
  }

*/

module.exports = class PendingTransactionTracker extends EventEmitter {
  constructor (config) {
    super()
    this.query = new EthQuery(config.provider)
    this.nonceTracker = config.nonceTracker
    this.retryLimit = config.retryLimit || Infinity
    this.getBalance = config.getBalance
    this.getPendingTransactions = config.getPendingTransactions
    this.publishTransaction = config.publishTransaction
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


  resubmitPendingTxs () {
    const pending = this.getPendingTransactions()
    // only try resubmitting if their are transactions to resubmit
    if (!pending.length) return
    pending.forEach((txMeta) => this._resubmitTx(txMeta).catch((err) => {
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
        errorMessage.includes('replacement transaction underpriced')
        || errorMessage.includes('known transaction')
        // parity
        || errorMessage.includes('gas price too low to replace')
        || errorMessage.includes('transaction with the same hash was already imported')
        // other
        || errorMessage.includes('gateway timeout')
        || errorMessage.includes('nonce too low')
        || txMeta.retryCount > 1
      )
      // ignore resubmit warnings, return early
      if (isKnownTx) return
      // encountered real error - transition to error state
      this.emit('tx:failed', txMeta.id, err)
    }))
  }

  async _resubmitTx (txMeta) {
    const address = txMeta.txParams.from
    const balance = this.getBalance(address)
    if (balance === undefined) return

    if (txMeta.retryCount > this.retryLimit) {
      const err = new Error(`Gave up submitting after ${this.retryLimit} blocks un-mined.`)
      return this.emit('tx:failed', txMeta.id, err)
    }

    // if the value of the transaction is greater then the balance, fail.
    if (!sufficientBalance(txMeta.txParams, balance)) {
      const insufficientFundsError = new Error('Insufficient balance during rebroadcast.')
      this.emit('tx:failed', txMeta.id, insufficientFundsError)
      log.error(insufficientFundsError)
      return
    }

    // Only auto-submit already-signed txs:
    if (!('rawTx' in txMeta)) return

    const rawTx = txMeta.rawTx
    const txHash = await this.publishTransaction(rawTx)

    // Increment successful tries:
    this.emit('tx:retry', txMeta)
    return txHash
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
        error: err,
        message: 'There was a problem loading this transaction.',
      }
      this.emit('tx:warning', txMeta)
      throw err
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
      console.error('PendingTransactionWatcher - Error updating pending transactions')
      console.error(err)
    }
    nonceGlobalLock.releaseLock()
  }
}
