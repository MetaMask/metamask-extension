const assert = require('assert')
const NonceTracker = require('../../app/scripts/lib/nonce-tracker')
const MockTxGen = require('../lib/mock-tx-gen')

describe('Nonce Tracker', function () {
  let nonceTracker, provider
  let getPendingTransactions, pendingTxs
  let getConfirmedTransactions, confirmedTxs
  let providerResultStub = {}

  describe('#getNonceLock', function () {

    describe('with 3 confirmed and 1 pending', function () {
      beforeEach(function () {
        const txGen = new MockTxGen()
        confirmedTxs = txGen.generate({ status: 'confirmed' }, { count: 3 })
        pendingTxs = txGen.generate({ status: 'pending' }, { count: 1 })

        getPendingTransactions = () => pendingTxs
        getConfirmedTransactions = () => confirmedTxs
        providerResultStub.result = '0x3'
        provider = {
          sendAsync: (_, cb) => { cb(undefined, providerResultStub) },
          _blockTracker: {
            getCurrentBlock: () => '0x11b568',
          },
        }
        nonceTracker = new NonceTracker({
          provider,
          getPendingTransactions,
          getConfirmedTransactions,
        })
      })

      it('should work', async function () {
        this.timeout(15000)
        const nonceLock = await nonceTracker.getNonceLock('0x7d3517b0d011698406d6e0aed8453f0be2697926')
        assert.equal(nonceLock.nextNonce, '4', 'nonce should be 4')
        await nonceLock.releaseLock()
      })

      it('should use localNonce if network returns a nonce lower then a confirmed tx in state', async function () {
        this.timeout(15000)
        providerResultStub.result = '0x1'
        const nonceLock = await nonceTracker.getNonceLock('0x7d3517b0d011698406d6e0aed8453f0be2697926')
        assert.equal(nonceLock.nextNonce, '4', 'nonce should be 4')
        await nonceLock.releaseLock()
      })
    })

    describe('with no previous txs', function () {
      beforeEach(function () {
        getPendingTransactions = () => []
        getConfirmedTransactions = () => []
        providerResultStub.result = '0x0'
        provider = {
          sendAsync: (_, cb) => { cb(undefined, providerResultStub) },
          _blockTracker: {
            getCurrentBlock: () => '0x11b568',
          },
        }
        nonceTracker = new NonceTracker({
          provider,
          getPendingTransactions,
          getConfirmedTransactions,
        })
      })

      it('should return 0', async function () {
        this.timeout(15000)
        const nonceLock = await nonceTracker.getNonceLock('0x7d3517b0d011698406d6e0aed8453f0be2697926')
        assert.equal(nonceLock.nextNonce, '0', 'nonce should be 0')
        await nonceLock.releaseLock()
      })
    })
  })
})
