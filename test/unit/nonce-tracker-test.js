const assert = require('assert')
const NonceTracker = require('../../app/scripts/lib/nonce-tracker')

describe('Nonce Tracker', function () {
  let nonceTracker, provider, getPendingTransactions, pendingTxs
  const noop = () => {}


  beforeEach(function () {
    pendingTxs =[{
      'status': 'submitted',
      'txParams': {
        'from': '0x7d3517b0d011698406d6e0aed8453f0be2697926',
        'gas': '0x30d40',
        'value': '0x0',
        'nonce': '0x1',
      },
    }]


    getPendingTransactions = () => pendingTxs
    provider = { sendAsync: (_, cb) => { cb(undefined , {result: '0x0'}) }, }
    nonceTracker = new NonceTracker({
      blockTracker: {
        getCurrentBlock: () =>  '0x11b568',
        once: (...args) => {
          setTimeout(() => {
            args.pop()()
          }, 5000)
        }
      },
      provider,
      getPendingTransactions,
    })
  })

  describe('#getNonceLock', function () {
    it('should work', async function (done) {
      this.timeout(15000)
      const nonceLock = await nonceTracker.getNonceLock('0x7d3517b0d011698406d6e0aed8453f0be2697926')
      assert.equal(nonceLock.nextNonce, '2', 'nonce should be 2')
      nonceLock.releaseLock()
      done()
    })
  })
})
