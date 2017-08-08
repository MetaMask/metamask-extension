const assert = require('assert')
const NonceTracker = require('../../app/scripts/lib/nonce-tracker')

describe('Nonce Tracker', function () {
  let nonceTracker, provider, getPendingTransactions, pendingTxs


  beforeEach(function () {
    pendingTxs = [{
      'status': 'submitted',
      'txParams': {
        'from': '0x7d3517b0d011698406d6e0aed8453f0be2697926',
        'gas': '0x30d40',
        'value': '0x0',
        'nonce': '0x0',
      },
    }]


    getPendingTransactions = () => pendingTxs
    provider = {
      sendAsync: (_, cb) => { cb(undefined, {result: '0x0'}) },
      _blockTracker: {
        getCurrentBlock: () => '0x11b568',
      },
    }
    nonceTracker = new NonceTracker({
      provider,
      getPendingTransactions,
    })
  })

  describe('#getNonceLock', function () {
    it('should work', async function () {
      this.timeout(15000)
      const nonceLock = await nonceTracker.getNonceLock('0x7d3517b0d011698406d6e0aed8453f0be2697926')
      assert.equal(nonceLock.nextNonce, '1', 'nonce should be 1')
      await nonceLock.releaseLock()
    })
  })
})
