const EthQuery = require('eth-query')
const assert = require('assert')
const Mutex = require('await-semaphore').Mutex

class NonceTracker {

  constructor ({ provider, getPendingTransactions, getConfirmedTransactions }) {
    this.provider = provider
    this.ethQuery = new EthQuery(provider)
    this.getPendingTransactions = getPendingTransactions
    this.getConfirmedTransactions = getConfirmedTransactions
    this.lockMap = {}
  }

  async getGlobalLock () {
    const globalMutex = this._lookupMutex('global')
    // await global mutex free
    const releaseLock = await globalMutex.acquire()
    return { releaseLock }
  }

  // releaseLock must be called
  // releaseLock must be called after adding signed tx to pending transactions (or discarding)
  async getNonceLock (address) {
    // await global mutex free
    await this._globalMutexFree()
    // await lock free, then take lock
    const releaseLock = await this._takeMutex(address)
    // calculate next nonce
    // we need to make sure our base count
    // and pending count are from the same block
    const localNextNonce = this._getLocalNextNonce(address)
    // throw out localNonce if not a number
    const currentBlock = await this._getCurrentBlock()
    const pendingTransactions = this.getPendingTransactions(address)
    const pendingCount = pendingTransactions.length
    assert(Number.isInteger(pendingCount), `nonce-tracker - pendingCount is not an integer - got: (${typeof pendingCount}) "${pendingCount}"`)
    const baseCountHex = await this._getTxCount(address, currentBlock)
    const baseCount = parseInt(baseCountHex, 16)
    assert(Number.isInteger(baseCount), `nonce-tracker - baseCount is not an integer - got: (${typeof baseCount}) "${baseCount}"`)
    const nextNonce = Math.max(baseCount + pendingCount, localNextNonce)
    assert(Number.isInteger(nextNonce), `nonce-tracker - nextNonce is not an integer - got: (${typeof nextNonce}) "${nextNonce}"`)
    // collect the numbers used to calculate the nonce for debugging
    const blockNumber = currentBlock.number
    const nonceDetails = { blockNumber, baseCount, baseCountHex, pendingCount, localNextNonce }
    // return nonce and release cb
    return { nextNonce, nonceDetails, releaseLock }
  }

  async _getCurrentBlock () {
    const blockTracker = this._getBlockTracker()
    const currentBlock = blockTracker.getCurrentBlock()
    if (currentBlock) return currentBlock
    return await Promise((reject, resolve) => {
      blockTracker.once('latest', resolve)
    })
  }

  async _getTxCount (address, currentBlock) {
    const blockNumber = currentBlock.number
    return new Promise((resolve, reject) => {
      this.ethQuery.getTransactionCount(address, blockNumber, (err, result) => {
        err ? reject(err) : resolve(result)
      })
    })
  }

  async _globalMutexFree () {
    const globalMutex = this._lookupMutex('global')
    const release = await globalMutex.acquire()
    release()
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

  // _getNetworkNonce (address) {

  // }

  _getLocalNextNonce (address) {
    const confirmedTransactions = this.getConfirmedTransactions(address)
    const pendingTransactions = this.getPendingTransactions(address)
    const transactions = confirmedTransactions.concat(pendingTransactions)
    const localNonces = transactions.map((txMeta) => txMeta.txParams.nonce)
    const localNonceHex = localNonces.reduce((nonce, highestNonce) => {
      return parseInt(nonce, 16) > parseInt(highestNonce, 16) ? nonce : highestNonce
    }, '0x0')
    let localNonce = parseInt(localNonceHex, 16)
    if (
      // the local nonce is not 0
      localNonce ||
      // or their are pending or confirmed transactions
      pendingTransactions.length ||
      confirmedTransactions.length
      ) ++localNonce
    return localNonce
  }

  // this is a hotfix for the fact that the blockTracker will
  // change when the network changes
  _getBlockTracker () {
    return this.provider._blockTracker
  }

}

module.exports = NonceTracker
