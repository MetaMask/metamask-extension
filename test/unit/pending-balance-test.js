const assert = require('assert')
const PendingBalanceCalculator = require('../../app/scripts/lib/pending-balance-calculator')
const MockTxGen = require('../lib/mock-tx-gen')
const BN = require('ethereumjs-util').BN
let providerResultStub = {}

describe('PendingBalanceCalculator', function () {
  let balanceCalculator

  describe('if you have no pending txs and one ether', function () {
    const ether = '0x' + (new BN(String(1e18))).toString(16)

    beforeEach(function () {
      balanceCalculator = generateBalaneCalcWith([], ether)
    })

    it('returns the network balance', async function () {
      const result = await balanceCalculator.getBalance()
      assert.equal(result, ether, `gave ${result} needed ${ether}`)
    })
  })

  describe('if you have a one ether pending tx and one ether', function () {
    const ether = '0x' + (new BN(String(1e18))).toString(16)

    beforeEach(function () {
      const txGen = new MockTxGen()
      pendingTxs = txGen.generate({
        status: 'submitted',
        txParams: {
          value: ether,
          gasPrice: '0x0',
          gas: '0x0',
        }
      }, { count: 1 })

      balanceCalculator = generateBalaneCalcWith(pendingTxs, ether)
    })

    it('returns the network balance', async function () {
      console.log('one')
      console.dir(balanceCalculator)
      const result = await balanceCalculator.getBalance()
      console.log('two')
      console.dir(result)
      assert.equal(result, '0x0', `gave ${result} needed '0x0'`)
      return true
    })

  })
})

function generateBalaneCalcWith (transactions, providerStub = '0x0') {
  const getPendingTransactions = () => Promise.resolve(transactions)
  const getBalance = () => Promise.resolve(providerStub)
  providerResultStub.result = providerStub
  const provider = {
    sendAsync: (_, cb) => { cb(undefined, providerResultStub) },
    _blockTracker: {
      getCurrentBlock: () => '0x11b568',
    },
  }
  return new PendingBalanceCalculator({
    getBalance,
    getPendingTransactions,
  })
}
