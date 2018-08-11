const EthQuery = require('ethjs-query')
const assert = require('assert')
const Mutex = require('await-semaphore').Mutex
/**
  @param opts {Object}
    @param {Object} opts.provider a ethereum provider
    @param {Function} opts.getPendingTransactions a function that returns an array of txMeta
    whosee status is `submitted`
    @param {Function} opts.getConfirmedTransactions a function that returns an array of txMeta
    whose status is `confirmed`
  @class
*/
class NonceTracker {

  constructor ({ provider, getPendingTransactions, getConfirmedTransactions }) {
    this.provider = provider
    this.ethQuery = new EthQuery(provider)
    this.getPendingTransactions = getPendingTransactions
    this.getConfirmedTransactions = getConfirmedTransactions
    this.lockMap = {}
  }

  /**
    @returns {Promise<Object>} with the key releaseLock (the gloabl mutex)
  */
  async getGlobalLock () {
    const globalMutex = this._lookupMutex('global')
    // await global mutex free
    const releaseLock = await globalMutex.acquire()
    return { releaseLock }
  }

  /**
   * @typedef NonceDetails
   * @property {number} highestLocallyConfirmed - A hex string of the highest nonce on a confirmed transaction.
   * @property {number} nextNetworkNonce - The next nonce suggested by the eth_getTransactionCount method.
   * @property {number} highetSuggested - The maximum between the other two, the number returned.
   */

  /**
  this will return an object with the `nextNonce` `nonceDetails` of type NonceDetails, and the releaseLock
  Note: releaseLock must be called after adding a signed tx to pending transactions (or discarding).

  @param address {string} the hex string for the address whose nonce we are calculating
  @returns {Promise<NonceDetails>}
  */
  async getNonceLock (address) {
    // await global mutex free
    await this._globalMutexFree()
    // await lock free, then take lock
    const releaseLock = await this._takeMutex(address)
    try {
      // evaluate multiple nextNonce strategies
      const nonceDetails = {}
      const networkNonceResult = await this._getNetworkNextNonce(address)
      const highestLocallyConfirmed = this._getHighestLocallyConfirmed(address)
      const nextNetworkNonce = networkNonceResult.nonce
      const highestSuggested = Math.max(nextNetworkNonce, highestLocallyConfirmed)

      const pendingTxs = this.getPendingTransactions(address)
      const localNonceResult = this._getHighestContinuousFrom(pendingTxs, highestSuggested) || 0

      nonceDetails.params = {
        highestLocallyConfirmed,
        highestSuggested,
        nextNetworkNonce,
      }
      nonceDetails.local = localNonceResult
      nonceDetails.network = networkNonceResult

      const nextNonce = Math.max(networkNonceResult.nonce, localNonceResult.nonce)
      assert(Number.isInteger(nextNonce), `nonce-tracker - nextNonce is not an integer - got: (${typeof nextNonce}) "${nextNonce}"`)

      // return nonce and release cb
      return { nextNonce, nonceDetails, releaseLock }
    } catch (err) {
      // release lock if we encounter an error
      releaseLock()
      throw err
    }
  }

  async _getCurrentBlock () {
    const blockTracker = this._getBlockTracker()
    const currentBlock = blockTracker.getCurrentBlock()
    if (currentBlock) return currentBlock
    return await new Promise((reject, resolve) => {
      blockTracker.once('latest', resolve)
    })
  }

  async _globalMutexFree () {
    const globalMutex = this._lookupMutex('global')
    const releaseLock = await globalMutex.acquire()
    releaseLock()
  }

  async _takeMutex (lockId) {
    const mutex = this._lookupMutex(lockId)
    const releaseLock = await mutex.acquire()
    return releaseLock
  }

  _lookupMutex (lockId) {
    let mutex = this.lockMap[lockId]
    if (!mutex) {
      mutex = new Mutex()
      this.lockMap[lockId] = mutex
    }
    return mutex
  }

  async _getNetworkNextNonce (address) {
    // calculate next nonce
    // we need to make sure our base count
    // and pending count are from the same block
    const currentBlock = await this._getCurrentBlock()
    const blockNumber = currentBlock.blockNumber
    const baseCountBN = await this.ethQuery.getTransactionCount(address, blockNumber || 'latest')
    const baseCount = baseCountBN.toNumber()
    assert(Number.isInteger(baseCount), `nonce-tracker - baseCount is not an integer - got: (${typeof baseCount}) "${baseCount}"`)
    const nonceDetails = { blockNumber, baseCount }
    return { name: 'network', nonce: baseCount, details: nonceDetails }
  }

  _getHighestLocallyConfirmed (address) {
    const confirmedTransactions = this.getConfirmedTransactions(address)
    const highest = this._getHighestNonce(confirmedTransactions)
    return Number.isInteger(highest) ? highest + 1 : 0
  }

  _getHighestNonce (txList) {
    const nonces = txList.map((txMeta) => {
      const nonce = txMeta.txParams.nonce
      assert(typeof nonce, 'string', 'nonces should be hex strings')
      return parseInt(nonce, 16)
    })
    const highestNonce = Math.max.apply(null, nonces)
    return highestNonce
  }

  /**
    @typedef {object} highestContinuousFrom
    @property {string} - name the name for how the nonce was calculated based on the data used
    @property {number} - nonce the next suggested nonce
    @property {object} - details the provided starting nonce that was used (for debugging)
  */
  /**
    @param txList {array} - list of txMeta's
    @param startPoint {number} - the highest known locally confirmed nonce
    @returns {highestContinuousFrom}
  */
  _getHighestContinuousFrom (txList, startPoint) {
    const nonces = txList.map((txMeta) => {
      const nonce = txMeta.txParams.nonce
      assert(typeof nonce, 'string', 'nonces should be hex strings')
      return parseInt(nonce, 16)
    })

    let highest = startPoint
    while (nonces.includes(highest)) {
      highest++
    }

    return { name: 'local', nonce: highest, details: { startPoint, highest } }
  }

  // this is a hotfix for the fact that the blockTracker will
  // change when the network changes

  /**
    @returns {Object} the current blockTracker
  */
  _getBlockTracker () {
    return this.provider._blockTracker
  }
}

module.exports = NonceTracker
