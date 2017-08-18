const assert = require('assert')
const NonceTracker = require('../../app/scripts/lib/nonce-tracker')

describe('Nonce Tracker', function () {
  let nonceTracker, provider
  let getPendingTransactions, pendingTxs
  let getConfirmedTransactions, confirmedTxs
  let providerResultStub = {}

  beforeEach(function () {
    pendingTxs = [{
      'status': 'submitted',
      'txParams': {
        'from': '0x7d3517b0d011698406d6e0aed8453f0be2697926',
        'gas': '0x30d40',
        'value': '0x0',
        'nonce': '0x3',
      },
    }]
    confirmedTxs = [{
      'status': 'confirmed',
      'txParams': {
        'from': '0x7d3517b0d011698406d6e0aed8453f0be2697926',
        'gas': '0x30d40',
        'value': '0x0',
        'nonce': '0x0',
      },
    }, {
      'status': 'confirmed',
      'txParams': {
        'from': '0x7d3517b0d011698406d6e0aed8453f0be2697926',
        'gas': '0x30d40',
        'value': '0x0',
        'nonce': '0x1',
      },
    }, {
      'status': 'confirmed',
      'txParams': {
        'from': '0x7d3517b0d011698406d6e0aed8453f0be2697926',
        'gas': '0x30d40',
        'value': '0x0',
        'nonce': '0x2',
      },
    }]


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

  describe('#getNonceLock', function () {
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
})
