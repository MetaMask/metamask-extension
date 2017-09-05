const EthQuery = require('ethjs-query')
const assert = require('assert')
const Mutex = require('await-semaphore').Mutex

class NonceTracker {

  constructor ({
    provider,
    getPendingTransactions,
    getConfirmedTransactions,
    getNetwork,
  }) {
    this.provider = provider
    this.ethQuery = new EthQuery(provider)
    this.getPendingTransactions = getPendingTransactions
    this.getConfirmedTransactions = getConfirmedTransactions
    this.getNetwork = getNetwork
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
    // evaluate multiple nextNonce strategies
    const nonceDetails = {}
    const networkNonceResult = await this._getNetworkNextNonce(address)
    const highestLocallyConfirmed = this._getHighestLocallyConfirmed(address)
    const nextNetworkNonce = networkNonceResult.nonce
    const highestLocalNonce = highestLocallyConfirmed
    const highestSuggested = Math.max(nextNetworkNonce, highestLocalNonce)

    const pendingTxs = this.getPendingTransactions(address)
    const localNonceResult = this._getHighestContinuousFrom(pendingTxs, highestSuggested) || 0

    nonceDetails.params = {
      highestLocalNonce,
      highestSuggested,
      nextNetworkNonce,
    }
    nonceDetails.local = localNonceResult
    nonceDetails.network = networkNonceResult

    const nextNonce = Math.max(networkNonceResult.nonce, localNonceResult.nonce)
    assert(Number.isInteger(nextNonce), `nonce-tracker - nextNonce is not an integer - got: (${typeof nextNonce}) "${nextNonce}"`)

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
    const network = this.getNetwork()
    const confirmedTransactions = this.getConfirmedTransactions(address)
    .filter((tx) => {
      return tx.metamaskNetworkId === network
    })
    const highest = this._getHighestNonce(confirmedTransactions)
    return Number.isInteger(highest) ? highest + 1 : 0
  }

  _reduceTxListToUniqueNonces (txList) {
    const reducedTxList = txList.reduce((reducedList, txMeta, index) => {
      if (!index) return [txMeta]
      const nonceMatches = txList.filter((txData) => {
        return txMeta.txParams.nonce === txData.txParams.nonce
      })
      if (nonceMatches.length > 1) return reducedList
      reducedList.push(txMeta)
      return reducedList
    }, [])
    return reducedTxList
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
  _getBlockTracker () {
    return this.provider._blockTracker
  }
}

module.exports = NonceTracker
