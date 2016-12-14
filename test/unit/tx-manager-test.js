const assert = require('assert')
const extend = require('xtend')
const STORAGE_KEY = 'metamask-persistance-key'
const TransactionManager = require('../../app/scripts/transaction-manager')

describe('Transaction Manager', function() {
  let txManager

  const onTxDoneCb = () => true
  beforeEach(function() {
    txManager = new TransactionManager ({
      TxListFromStore: [],
      setTxList: () => {},
      provider: "testnet",
      txLimit: 40,
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
      var target = [{ foo: 'bar' }]
      txManager._saveTxList(target)
      var result = txManager.getTxList()
      assert.equal(result[0].foo, 'bar')
    })
  })

  describe('#addTx', function() {
    it('adds a tx returned in getTxList', function() {
      var tx = { id: 1 }
      txManager.addTx(tx, onTxDoneCb)
      var result = txManager.getTxList()
      assert.ok(Array.isArray(result))
      assert.equal(result.length, 1)
      assert.equal(result[0].id, 1)
    })

    it('cuts off early txs beyond a limit', function() {
      const limit = txManager.txLimit
      for (let i = 0; i < limit + 1; i++) {
        let tx = { id: i, time: new Date()}
        txManager.addTx(tx, onTxDoneCb)
      }
      var result = txManager.getTxList()
      assert.equal(result.length, limit, `limit of ${limit} txs enforced`)
      assert.equal(result[0].id, 1, 'early txs truncted')
    })
  })

  describe('#setTxStatusSigned', function() {
    it('sets the tx status to signed', function() {
      var tx = { id: 1, status: 'unapproved' }
      txManager.addTx(tx, onTxDoneCb)
      txManager.setTxStatusSigned(1)
      var result = txManager.getTxList()
      assert.ok(Array.isArray(result))
      assert.equal(result.length, 1)
      assert.equal(result[0].status, 'signed')
    })

    it('should emit a signed event to signal the exciton of callback', (done) => {
      this.timeout(10000)
      var tx = { id: 1, status: 'unapproved' }
      txManager.on('signed', function (txId) {
        var approvalCb = this._unconfTxCbs[txId]
        assert(approvalCb(), 'txCb was retrieved')
        assert.equal(txId, 1)
        assert(true, 'event listener has been triggered')
        done()
      })
      txManager.addTx(tx, onTxDoneCb)
      txManager.setTxStatusSigned(1)
    })
  })

  describe('#setTxStatusRejected', function() {
    it('sets the tx status to rejected', function() {
      var tx = { id: 1, status: 'unapproved' }
      txManager.addTx(tx)
      txManager.setTxStatusRejected(1)
      var result = txManager.getTxList()
      assert.ok(Array.isArray(result))
      assert.equal(result.length, 1)
      assert.equal(result[0].status, 'rejected')
    })

    it('should emit a rejected event to signal the exciton of callback', (done) => {
      this.timeout(10000)
      var tx = { id: 1, status: 'unapproved' }
      txManager.on('rejected', function (txId) {
        var approvalCb = this._unconfTxCbs[txId]
        assert(approvalCb(), 'txCb was retrieved')
        assert.equal(txId, 1)
        assert(true, 'event listener has been triggered')
        done()
      })
      txManager.addTx(tx, onTxDoneCb)
      txManager.setTxStatusRejected(1)
    })

  })

  describe('#updateTx', function() {
    it('replaces the tx with the same id', function() {
      txManager.addTx({ id: '1', status: 'unapproved' }, onTxDoneCb)
      txManager.addTx({ id: '2', status: 'confirmed' }, onTxDoneCb)
      txManager.updateTx({ id: '1', status: 'blah', hash: 'foo' })
      var result = txManager.getTx('1')
      assert.equal(result.hash, 'foo')
    })
  })

  describe('#getUnapprovedTxList', function() {
    it('returns unapproved txs in a hash', function() {
      txManager.addTx({ id: '1', status: 'unapproved' }, onTxDoneCb)
      txManager.addTx({ id: '2', status: 'confirmed' }, onTxDoneCb)
      let result = txManager.getUnapprovedTxList()
      assert.equal(typeof result, 'object')
      assert.equal(result['1'].status, 'unapproved')
      assert.equal(result['0'], undefined)
      assert.equal(result['2'], undefined)
    })
  })

  describe('#getTx', function() {
    it('returns a tx with the requested id', function() {
      txManager.addTx({ id: '1', status: 'unapproved' }, onTxDoneCb)
      txManager.addTx({ id: '2', status: 'confirmed' }, onTxDoneCb)
      assert.equal(txManager.getTx('1').status, 'unapproved')
      assert.equal(txManager.getTx('2').status, 'confirmed')
    })
  })

  describe('#getFilterdTxList', function() {
    it('returns a tx with the requested data', function() {
      var foop = 0
      var zoop = 0
      for (let i = 0; i < 10; ++i ){
        let evryOther = i % 2
        txManager.addTx({ id: i,
          status: evryOther ? 'unapproved' : 'confirmed',
          txParams: {
            from: evryOther ? 'foop' : 'zoop',
            to: evryOther ? 'zoop' : 'foop',
          }
        }, onTxDoneCb)
        evryOther ? ++foop : ++zoop
      }
      assert.equal(txManager.getFilterdTxList({status: 'confirmed', from: 'zoop'}).length, zoop)
      assert.equal(txManager.getFilterdTxList({status: 'confirmed', to: 'foop'}).length, zoop)
      assert.equal(txManager.getFilterdTxList({status: 'confirmed', from: 'foop'}).length, 0)
      assert.equal(txManager.getFilterdTxList({status: 'confirmed'}).length, zoop)
      assert.equal(txManager.getFilterdTxList({from: 'foop'}).length, foop)
      assert.equal(txManager.getFilterdTxList({from: 'zoop'}).length, zoop)
    })
  })

})
