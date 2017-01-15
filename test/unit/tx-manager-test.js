const assert = require('assert')
const extend = require('xtend')
const EventEmitter = require('events')
const STORAGE_KEY = 'metamask-persistance-key'
const TransactionManager = require('../../app/scripts/transaction-manager')

describe('Transaction Manager', function() {
  let txManager

  const onTxDoneCb = () => true
  beforeEach(function() {
    txManager = new TransactionManager ({
      txList: [],
      setTxList: () => {},
      provider: "testnet",
      txHistoryLimit: 10,
      blockTracker: new EventEmitter(),
      getNetwork: function(){ return 'unit test' }
    })
  })

  describe('#validateTxParams', function () {
    it('returns null for positive values', function() {
      var sample = {
        value: '0x01'
      }
      var res = txManager.txProviderUtils.validateTxParams(sample, (err) => {
        assert.equal(err, null, 'no error')
      })
    })


    it('returns error for negative values', function() {
      var sample = {
        value: '-0x01'
      }
      var res = txManager.txProviderUtils.validateTxParams(sample, (err) => {
        assert.ok(err, 'error')
      })
    })
  })

  describe('#getTxList', function() {
    it('when new should return empty array', function() {
      var result = txManager.getTxList()
      assert.ok(Array.isArray(result))
      assert.equal(result.length, 0)
    })
    it('should also return transactions from local storage if any', function() {

    })
  })

  describe('#_saveTxList', function() {
    it('saves the submitted data to the tx list', function() {
      var target = [{ foo: 'bar', metamaskNetworkId: 'unit test' }]
      txManager._saveTxList(target)
      var result = txManager.getTxList()
      assert.equal(result[0].foo, 'bar')
    })
  })

  describe('#addTx', function() {
    it('adds a tx returned in getTxList', function() {
      var tx = { id: 1, status: 'confirmed', metamaskNetworkId: 'unit test' }
      txManager.addTx(tx, onTxDoneCb)
      var result = txManager.getTxList()
      assert.ok(Array.isArray(result))
      assert.equal(result.length, 1)
      assert.equal(result[0].id, 1)
    })

    it('cuts off early txs beyond a limit', function() {
      const limit = txManager.txHistoryLimit
      for (let i = 0; i < limit + 1; i++) {
        let tx = { id: i, time: new Date(), status: 'confirmed', metamaskNetworkId: 'unit test' }
        txManager.addTx(tx, onTxDoneCb)
      }
      var result = txManager.getTxList()
      assert.equal(result.length, limit, `limit of ${limit} txs enforced`)
      assert.equal(result[0].id, 1, 'early txs truncted')
    })

    it('cuts off early txs beyond a limit whether or not it is confirmed or rejected', function() {
      const limit = txManager.txHistoryLimit
      for (let i = 0; i < limit + 1; i++) {
        let tx = { id: i, time: new Date(), status: 'rejected', metamaskNetworkId: 'unit test' }
        txManager.addTx(tx, onTxDoneCb)
      }
      var result = txManager.getTxList()
      assert.equal(result.length, limit, `limit of ${limit} txs enforced`)
      assert.equal(result[0].id, 1, 'early txs truncted')
    })

    it('cuts off early txs beyond a limit but does not cut unapproved txs', function() {
      var unconfirmedTx = { id: 0, time: new Date(), status: 'unapproved', metamaskNetworkId: 'unit test' }
      txManager.addTx(unconfirmedTx, onTxDoneCb)
      const limit = txManager.txHistoryLimit
      for (let i = 1; i < limit + 1; i++) {
        let tx = { id: i, time: new Date(), status: 'confirmed', metamaskNetworkId: 'unit test' }
        txManager.addTx(tx, onTxDoneCb)
      }
      var result = txManager.getTxList()
      assert.equal(result.length, limit, `limit of ${limit} txs enforced`)
      assert.equal(result[0].id, 0, 'first tx should still be there')
      assert.equal(result[0].status, 'unapproved', 'first tx should be unapproved')
      assert.equal(result[1].id, 2, 'early txs truncted')
    })
  })

  describe('#setTxStatusSigned', function() {
    it('sets the tx status to signed', function() {
      var tx = { id: 1, status: 'unapproved', metamaskNetworkId: 'unit test' }
      txManager.addTx(tx, onTxDoneCb)
      txManager.setTxStatusSigned(1)
      var result = txManager.getTxList()
      assert.ok(Array.isArray(result))
      assert.equal(result.length, 1)
      assert.equal(result[0].status, 'signed')
    })

    it('should emit a signed event to signal the exciton of callback', (done) => {
      this.timeout(10000)
      var tx = { id: 1, status: 'unapproved', metamaskNetworkId: 'unit test' }
      let onTxDoneCb = function () {
        assert(true, 'event listener has been triggered and onTxDoneCb executed')
        done()
      }
      txManager.addTx(tx)
      txManager.on('1:signed', onTxDoneCb)
      txManager.setTxStatusSigned(1)
    })
  })

  describe('#setTxStatusRejected', function() {
    it('sets the tx status to rejected', function() {
      var tx = { id: 1, status: 'unapproved', metamaskNetworkId: 'unit test' }
      txManager.addTx(tx)
      txManager.setTxStatusRejected(1)
      var result = txManager.getTxList()
      assert.ok(Array.isArray(result))
      assert.equal(result.length, 1)
      assert.equal(result[0].status, 'rejected')
    })

    it('should emit a rejected event to signal the exciton of callback', (done) => {
      this.timeout(10000)
      var tx = { id: 1, status: 'unapproved', metamaskNetworkId: 'unit test' }
      txManager.addTx(tx)
      let onTxDoneCb = function (err, txId) {
        assert(true, 'event listener has been triggered and onTxDoneCb executed')
        done()
      }
      txManager.on('1:rejected', onTxDoneCb)
      txManager.setTxStatusRejected(1)
    })

  })

  describe('#updateTx', function() {
    it('replaces the tx with the same id', function() {
      txManager.addTx({ id: '1', status: 'unapproved', metamaskNetworkId: 'unit test' }, onTxDoneCb)
      txManager.addTx({ id: '2', status: 'confirmed', metamaskNetworkId: 'unit test' }, onTxDoneCb)
      txManager.updateTx({ id: '1', status: 'blah', hash: 'foo', metamaskNetworkId: 'unit test' })
      var result = txManager.getTx('1')
      assert.equal(result.hash, 'foo')
    })
  })

  describe('#getUnapprovedTxList', function() {
    it('returns unapproved txs in a hash', function() {
      txManager.addTx({ id: '1', status: 'unapproved', metamaskNetworkId: 'unit test' }, onTxDoneCb)
      txManager.addTx({ id: '2', status: 'confirmed', metamaskNetworkId: 'unit test' }, onTxDoneCb)
      let result = txManager.getUnapprovedTxList()
      assert.equal(typeof result, 'object')
      assert.equal(result['1'].status, 'unapproved')
      assert.equal(result['2'], undefined)
    })
  })

  describe('#getTx', function() {
    it('returns a tx with the requested id', function() {
      txManager.addTx({ id: '1', status: 'unapproved', metamaskNetworkId: 'unit test' }, onTxDoneCb)
      txManager.addTx({ id: '2', status: 'confirmed', metamaskNetworkId: 'unit test' }, onTxDoneCb)
      assert.equal(txManager.getTx('1').status, 'unapproved')
      assert.equal(txManager.getTx('2').status, 'confirmed')
    })
  })

  describe('#getFilteredTxList', function() {
    it('returns a tx with the requested data', function() {
      var foop = 0
      var zoop = 0
      for (let i = 0; i < 10; ++i ){
        let everyOther = i % 2
        txManager.addTx({ id: i,
          status: everyOther ? 'unapproved' : 'confirmed',
          metamaskNetworkId: 'unit test',
          txParams: {
            from: everyOther ? 'foop' : 'zoop',
            to: everyOther ? 'zoop' : 'foop',
          }
        }, onTxDoneCb)
        everyOther ? ++foop : ++zoop
      }
      assert.equal(txManager.getFilteredTxList({status: 'confirmed', from: 'zoop'}).length, zoop)
      assert.equal(txManager.getFilteredTxList({status: 'confirmed', to: 'foop'}).length, zoop)
      assert.equal(txManager.getFilteredTxList({status: 'confirmed', from: 'foop'}).length, 0)
      assert.equal(txManager.getFilteredTxList({status: 'confirmed'}).length, zoop)
      assert.equal(txManager.getFilteredTxList({from: 'foop'}).length, foop)
      assert.equal(txManager.getFilteredTxList({from: 'zoop'}).length, zoop)
    })
  })

})
