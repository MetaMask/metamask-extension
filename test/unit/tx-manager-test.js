const assert = require('assert')
// const extend = require('xtend')
const EventEmitter = require('events')
const ethUtil = require('ethereumjs-util')
const EthTx = require('ethereumjs-tx')
const ObservableStore = require('obs-store')
// const STORAGE_KEY = 'metamask-persistance-key'
const TransactionManager = require('../../app/scripts/transaction-manager')
const noop = () => true
const currentNetworkId = 42
const otherNetworkId = 36
const privKey = new Buffer('8718b9618a37d1fc78c436511fc6df3c8258d3250635bba617f33003270ec03e', 'hex')

describe('Transaction Manager', function () {
  let txManager

  beforeEach(function () {
    txManager = new TransactionManager({
      networkStore: new ObservableStore({ network: currentNetworkId }),
      txHistoryLimit: 10,
      blockTracker: new EventEmitter(),
      signTransaction: (ethTx) => new Promise((resolve) => {
        ethTx.sign(privKey)
        resolve()
      }),
    })
  })

  describe('#validateTxParams', function () {
    it('returns null for positive values', function () {
      var sample = {
        value: '0x01',
      }
      txManager.txProviderUtils.validateTxParams(sample, (err) => {
        assert.equal(err, null, 'no error')
      })
    })

    it('returns error for negative values', function () {
      var sample = {
        value: '-0x01',
      }
      txManager.txProviderUtils.validateTxParams(sample, (err) => {
        assert.ok(err, 'error')
      })
    })
  })

  describe('#getTxList', function () {
    it('when new should return empty array', function () {
      var result = txManager.getTxList()
      assert.ok(Array.isArray(result))
      assert.equal(result.length, 0)
    })
    it('should also return transactions from local storage if any', function () {

    })
  })

  describe('#addTx', function () {
    it('adds a tx returned in getTxList', function () {
      var tx = { id: 1, status: 'confirmed', metamaskNetworkId: currentNetworkId, txParams: {} }
      txManager.addTx(tx, noop)
      var result = txManager.getTxList()
      assert.ok(Array.isArray(result))
      assert.equal(result.length, 1)
      assert.equal(result[0].id, 1)
    })

    it('does not override txs from other networks', function () {
      var tx = { id: 1, status: 'confirmed', metamaskNetworkId: currentNetworkId, txParams: {} }
      var tx2 = { id: 2, status: 'confirmed', metamaskNetworkId: otherNetworkId, txParams: {} }
      txManager.addTx(tx, noop)
      txManager.addTx(tx2, noop)
      var result = txManager.getFullTxList()
      var result2 = txManager.getTxList()
      assert.equal(result.length, 2, 'txs were deleted')
      assert.equal(result2.length, 1, 'incorrect number of txs on network.')
    })

    it('cuts off early txs beyond a limit', function () {
      const limit = txManager.txHistoryLimit
      for (let i = 0; i < limit + 1; i++) {
        const tx = { id: i, time: new Date(), status: 'confirmed', metamaskNetworkId: currentNetworkId, txParams: {} }
        txManager.addTx(tx, noop)
      }
      var result = txManager.getTxList()
      assert.equal(result.length, limit, `limit of ${limit} txs enforced`)
      assert.equal(result[0].id, 1, 'early txs truncted')
    })

    it('cuts off early txs beyond a limit whether or not it is confirmed or rejected', function () {
      const limit = txManager.txHistoryLimit
      for (let i = 0; i < limit + 1; i++) {
        const tx = { id: i, time: new Date(), status: 'rejected', metamaskNetworkId: currentNetworkId, txParams: {} }
        txManager.addTx(tx, noop)
      }
      var result = txManager.getTxList()
      assert.equal(result.length, limit, `limit of ${limit} txs enforced`)
      assert.equal(result[0].id, 1, 'early txs truncted')
    })

    it('cuts off early txs beyond a limit but does not cut unapproved txs', function () {
      var unconfirmedTx = { id: 0, time: new Date(), status: 'unapproved', metamaskNetworkId: currentNetworkId, txParams: {} }
      txManager.addTx(unconfirmedTx, noop)
      const limit = txManager.txHistoryLimit
      for (let i = 1; i < limit + 1; i++) {
        const tx = { id: i, time: new Date(), status: 'confirmed', metamaskNetworkId: currentNetworkId, txParams: {} }
        txManager.addTx(tx, noop)
      }
      var result = txManager.getTxList()
      assert.equal(result.length, limit, `limit of ${limit} txs enforced`)
      assert.equal(result[0].id, 0, 'first tx should still be there')
      assert.equal(result[0].status, 'unapproved', 'first tx should be unapproved')
      assert.equal(result[1].id, 2, 'early txs truncted')
    })
  })

  describe('#setTxStatusSigned', function () {
    it('sets the tx status to signed', function () {
      var tx = { id: 1, status: 'unapproved', metamaskNetworkId: currentNetworkId, txParams: {} }
      txManager.addTx(tx, noop)
      txManager.setTxStatusSigned(1)
      var result = txManager.getTxList()
      assert.ok(Array.isArray(result))
      assert.equal(result.length, 1)
      assert.equal(result[0].status, 'signed')
    })

    it('should emit a signed event to signal the exciton of callback', (done) => {
      this.timeout(10000)
      var tx = { id: 1, status: 'unapproved', metamaskNetworkId: currentNetworkId, txParams: {} }
      const noop = function () {
        assert(true, 'event listener has been triggered and noop executed')
        done()
      }
      txManager.addTx(tx)
      txManager.on('1:signed', noop)
      txManager.setTxStatusSigned(1)
    })
  })

  describe('#setTxStatusRejected', function () {
    it('sets the tx status to rejected', function () {
      var tx = { id: 1, status: 'unapproved', metamaskNetworkId: currentNetworkId, txParams: {} }
      txManager.addTx(tx)
      txManager.setTxStatusRejected(1)
      var result = txManager.getTxList()
      assert.ok(Array.isArray(result))
      assert.equal(result.length, 1)
      assert.equal(result[0].status, 'rejected')
    })

    it('should emit a rejected event to signal the exciton of callback', (done) => {
      this.timeout(10000)
      var tx = { id: 1, status: 'unapproved', metamaskNetworkId: currentNetworkId, txParams: {} }
      txManager.addTx(tx)
      const noop = function (err, txId) {
        assert(true, 'event listener has been triggered and noop executed')
        done()
      }
      txManager.on('1:rejected', noop)
      txManager.setTxStatusRejected(1)
    })
  })

  describe('#updateTx', function () {
    it('replaces the tx with the same id', function () {
      txManager.addTx({ id: '1', status: 'unapproved', metamaskNetworkId: currentNetworkId, txParams: {} }, noop)
      txManager.addTx({ id: '2', status: 'confirmed', metamaskNetworkId: currentNetworkId, txParams: {} }, noop)
      txManager.updateTx({ id: '1', status: 'blah', hash: 'foo', metamaskNetworkId: currentNetworkId, txParams: {} })
      var result = txManager.getTx('1')
      assert.equal(result.hash, 'foo')
    })
  })

  describe('#getUnapprovedTxList', function () {
    it('returns unapproved txs in a hash', function () {
      txManager.addTx({ id: '1', status: 'unapproved', metamaskNetworkId: currentNetworkId, txParams: {} }, noop)
      txManager.addTx({ id: '2', status: 'confirmed', metamaskNetworkId: currentNetworkId, txParams: {} }, noop)
      const result = txManager.getUnapprovedTxList()
      assert.equal(typeof result, 'object')
      assert.equal(result['1'].status, 'unapproved')
      assert.equal(result['2'], undefined)
    })
  })

  describe('#getTx', function () {
    it('returns a tx with the requested id', function () {
      txManager.addTx({ id: '1', status: 'unapproved', metamaskNetworkId: currentNetworkId, txParams: {} }, noop)
      txManager.addTx({ id: '2', status: 'confirmed', metamaskNetworkId: currentNetworkId, txParams: {} }, noop)
      assert.equal(txManager.getTx('1').status, 'unapproved')
      assert.equal(txManager.getTx('2').status, 'confirmed')
    })
  })

  describe('#getFilteredTxList', function () {
    it('returns a tx with the requested data', function () {
      const txMetas = [
        { id: 0, status: 'unapproved', txParams: { from: '0xaa', to: '0xbb' }, metamaskNetworkId: currentNetworkId },
        { id: 1, status: 'unapproved', txParams: { from: '0xaa', to: '0xbb' }, metamaskNetworkId: currentNetworkId },
        { id: 2, status: 'unapproved', txParams: { from: '0xaa', to: '0xbb' }, metamaskNetworkId: currentNetworkId },
        { id: 3, status: 'unapproved', txParams: { from: '0xbb', to: '0xaa' }, metamaskNetworkId: currentNetworkId },
        { id: 4, status: 'unapproved', txParams: { from: '0xbb', to: '0xaa' }, metamaskNetworkId: currentNetworkId },
        { id: 5, status: 'confirmed', txParams: { from: '0xaa', to: '0xbb' }, metamaskNetworkId: currentNetworkId },
        { id: 6, status: 'confirmed', txParams: { from: '0xaa', to: '0xbb' }, metamaskNetworkId: currentNetworkId },
        { id: 7, status: 'confirmed', txParams: { from: '0xbb', to: '0xaa' }, metamaskNetworkId: currentNetworkId },
        { id: 8, status: 'confirmed', txParams: { from: '0xbb', to: '0xaa' }, metamaskNetworkId: currentNetworkId },
        { id: 9, status: 'confirmed', txParams: { from: '0xbb', to: '0xaa' }, metamaskNetworkId: currentNetworkId },
      ]
      txMetas.forEach((txMeta) => txManager.addTx(txMeta, noop))
      let filterParams

      filterParams = { status: 'unapproved', from: '0xaa' }
      assert.equal(txManager.getFilteredTxList(filterParams).length, 3, `getFilteredTxList - ${JSON.stringify(filterParams)}`)
      filterParams = { status: 'unapproved', to: '0xaa' }
      assert.equal(txManager.getFilteredTxList(filterParams).length, 2, `getFilteredTxList - ${JSON.stringify(filterParams)}`)
      filterParams = { status: 'confirmed', from: '0xbb' }
      assert.equal(txManager.getFilteredTxList(filterParams).length, 3, `getFilteredTxList - ${JSON.stringify(filterParams)}`)
      filterParams = { status: 'confirmed' }
      assert.equal(txManager.getFilteredTxList(filterParams).length, 5, `getFilteredTxList - ${JSON.stringify(filterParams)}`)
      filterParams = { from: '0xaa' }
      assert.equal(txManager.getFilteredTxList(filterParams).length, 5, `getFilteredTxList - ${JSON.stringify(filterParams)}`)
      filterParams = { to: '0xaa' }
      assert.equal(txManager.getFilteredTxList(filterParams).length, 5, `getFilteredTxList - ${JSON.stringify(filterParams)}`)
    })
  })

  describe('#sign replay-protected tx', function () {
    it('prepares a tx with the chainId set', function () {
      txManager.addTx({ id: '1', status: 'unapproved', metamaskNetworkId: currentNetworkId, txParams: {} }, noop)
      txManager.signTransaction('1', (err, rawTx) => {
        if (err) return assert.fail('it should not fail')
        const ethTx = new EthTx(ethUtil.toBuffer(rawTx))
        assert.equal(ethTx.getChainId(), currentNetworkId)
      })
    })
  })
})
