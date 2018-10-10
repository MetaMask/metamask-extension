const assert = require('assert')
const PendingBalanceCalculator = require('../../../app/scripts/lib/pending-balance-calculator')
const MockTxGen = require('../../lib/mock-tx-gen')
const BN = require('ethereumjs-util').BN

const zeroBn = new BN(0)
const etherBn = new BN(String(1e18))
const ether = '0x' + etherBn.toString(16)

describe('PendingBalanceCalculator', function () {
  let balanceCalculator, pendingTxs

  describe('#calculateMaxCost(tx)', function () {
    it('returns a BN for a given tx value', function () {
      const txGen = new MockTxGen()
      pendingTxs = txGen.generate({
        status: 'submitted',
        txParams: {
          value: ether,
          gasPrice: '0x0',
          gas: '0x0',
        },
      }, { count: 1 })

      const balanceCalculator = generateBalanceCalcWith([], zeroBn)
      const result = balanceCalculator.calculateMaxCost(pendingTxs[0])
      assert.equal(result.toString(), etherBn.toString(), 'computes one ether')
    })

    it('calculates gas costs as well', function () {
      const txGen = new MockTxGen()
      pendingTxs = txGen.generate({
        status: 'submitted',
        txParams: {
          value: '0x0',
          gasPrice: '0x2',
          gas: '0x3',
        },
      }, { count: 1 })

      const balanceCalculator = generateBalanceCalcWith([], zeroBn)
      const result = balanceCalculator.calculateMaxCost(pendingTxs[0])
      assert.equal(result.toString(), '6', 'computes 6 wei of gas')
    })
  })

  describe('if you have no pending txs and one ether', function () {

    beforeEach(function () {
      balanceCalculator = generateBalanceCalcWith([], etherBn)
    })

    it('returns the network balance', async function () {
      const result = await balanceCalculator.getBalance()
      assert.equal(result, ether, `gave ${result} needed ${ether}`)
    })
  })

  describe('if you have a one ether pending tx and one ether', function () {
    beforeEach(function () {
      const txGen = new MockTxGen()
      pendingTxs = txGen.generate({
        status: 'submitted',
        txParams: {
          value: ether,
          gasPrice: '0x0',
          gas: '0x0',
        },
      }, { count: 1 })

      balanceCalculator = generateBalanceCalcWith(pendingTxs, etherBn)
    })

    it('returns the subtracted result', async function () {
      const result = await balanceCalculator.getBalance()
      assert.equal(result, '0x0', `gave ${result} needed '0x0'`)
      return true
    })

  })
})

function generateBalanceCalcWith (transactions, providerStub = zeroBn) {
  const getPendingTransactions = async () => transactions
  const getBalance = async () => providerStub

  return new PendingBalanceCalculator({
    getBalance,
    getPendingTransactions,
  })
}

