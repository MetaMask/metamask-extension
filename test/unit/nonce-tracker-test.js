const assert = require('assert')
const NonceTracker = require('../../app/scripts/lib/nonce-tracker')
const MockTxGen = require('../lib/mock-tx-gen')
let providerResultStub = {}

describe('Nonce Tracker', function () {
  let nonceTracker, provider
  let getPendingTransactions, pendingTxs
  let getConfirmedTransactions, confirmedTxs

  describe('#getNonceLock', function () {

    describe('with 3 confirmed and 1 pending', function () {
      beforeEach(function () {
        const txGen = new MockTxGen()
        confirmedTxs = txGen.generate({ status: 'confirmed' }, { count: 3 })
        pendingTxs = txGen.generate({ status: 'submitted' }, { count: 1 })
        nonceTracker = generateNonceTrackerWith(pendingTxs, confirmedTxs, '0x1')
      })

      it('should work', async function () {
        this.timeout(15000)
        const nonceLock = await nonceTracker.getNonceLock('0x7d3517b0d011698406d6e0aed8453f0be2697926')
        assert.equal(nonceLock.nextNonce, '4', 'nonce should be 4')
        await nonceLock.releaseLock()
      })

      it('should use localNonce if network returns a nonce lower then a confirmed tx in state', async function () {
        this.timeout(15000)
        const nonceLock = await nonceTracker.getNonceLock('0x7d3517b0d011698406d6e0aed8453f0be2697926')
        assert.equal(nonceLock.nextNonce, '4', 'nonce should be 4')
        await nonceLock.releaseLock()
      })
    })

    describe('with no previous txs', function () {
      beforeEach(function () {
        nonceTracker = generateNonceTrackerWith([], [])
      })

      it('should return 0', async function () {
        this.timeout(15000)
        const nonceLock = await nonceTracker.getNonceLock('0x7d3517b0d011698406d6e0aed8453f0be2697926')
        assert.equal(nonceLock.nextNonce, '0', 'nonce should be 0')
        await nonceLock.releaseLock()
      })
    })

    describe('with multiple previous txs with same nonce', function () {
      beforeEach(function () {
        const txGen = new MockTxGen()
        confirmedTxs = txGen.generate({ status: 'confirmed' }, { count: 1 })
        pendingTxs = txGen.generate({
          status: 'submitted',
          txParams: { nonce: '0x01' },
        }, { count: 5 })

        nonceTracker = generateNonceTrackerWith(pendingTxs, confirmedTxs)
      })

      it('should return nonce after those', async function () {
        this.timeout(15000)
        const nonceLock = await nonceTracker.getNonceLock('0x7d3517b0d011698406d6e0aed8453f0be2697926')
        assert.equal(nonceLock.nextNonce, '2', `nonce should be 2 got ${nonceLock.nextNonce}`)
        await nonceLock.releaseLock()
      })
    })

    describe('when local confirmed count is higher than network nonce', function () {
      beforeEach(function () {
        const txGen = new MockTxGen()
        confirmedTxs = txGen.generate({ status: 'confirmed' }, { count: 2 })
        nonceTracker = generateNonceTrackerWith([], confirmedTxs)
      })

      it('should return nonce after those', async function () {
        this.timeout(15000)
        const nonceLock = await nonceTracker.getNonceLock('0x7d3517b0d011698406d6e0aed8453f0be2697926')
        assert.equal(nonceLock.nextNonce, '2', `nonce should be 2 got ${nonceLock.nextNonce}`)
        await nonceLock.releaseLock()
      })
    })

    describe('when local pending count is higher than other metrics', function () {
      beforeEach(function () {
        const txGen = new MockTxGen()
        pendingTxs = txGen.generate({ status: 'submitted' }, { count: 2 })
        nonceTracker = generateNonceTrackerWith(pendingTxs, [])
      })

      it('should return nonce after those', async function () {
        this.timeout(15000)
        const nonceLock = await nonceTracker.getNonceLock('0x7d3517b0d011698406d6e0aed8453f0be2697926')
        assert.equal(nonceLock.nextNonce, '2', `nonce should be 2 got ${nonceLock.nextNonce}`)
        await nonceLock.releaseLock()
      })
    })

    describe('when provider nonce is higher than other metrics', function () {
      beforeEach(function () {
        const txGen = new MockTxGen()
        pendingTxs = txGen.generate({ status: 'submitted' }, { count: 2 })
        nonceTracker = generateNonceTrackerWith(pendingTxs, [], '0x05')
      })

      it('should return nonce after those', async function () {
        this.timeout(15000)
        const nonceLock = await nonceTracker.getNonceLock('0x7d3517b0d011698406d6e0aed8453f0be2697926')
        assert.equal(nonceLock.nextNonce, '5', `nonce should be 5 got ${nonceLock.nextNonce}`)
        await nonceLock.releaseLock()
      })
    })
  })
})

function generateNonceTrackerWith (pending, confirmed, providerStub = '0x0') {
  const getPendingTransactions = () => pending
  const getConfirmedTransactions = () => confirmed
  providerResultStub.result = providerStub
  const provider = {
    sendAsync: (_, cb) => { cb(undefined, providerResultStub) },
    _blockTracker: {
      getCurrentBlock: () => '0x11b568',
    },
  }
  return new NonceTracker({
    provider,
    getPendingTransactions,
    getConfirmedTransactions,
  })
}

