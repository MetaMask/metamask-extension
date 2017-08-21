const assert = require('assert')
const clone = require('clone')
const ObservableStore = require('obs-store')
const TxStateManager = require('../../app/scripts/lib/tx-state-manager')
const noop = () => true

describe('TransactionStateManger', function () {
  let txStateManager
  const currentNetworkId = 42
  const otherNetworkId = 2

  beforeEach(function () {
    txStateManager = new TxStateManager({
      initState: {
        transactions: [],
      },
      txHistoryLimit: 10,
      getNetwork: () => currentNetworkId
    })
  })

  describe('#setTxStatusSigned', function () {
    it('sets the tx status to signed', function () {
      let tx = { id: 1, status: 'unapproved', metamaskNetworkId: currentNetworkId, txParams: {} }
      txStateManager.addTx(tx, noop)
      txStateManager.setTxStatusSigned(1)
      let result = txStateManager.getTxList()
      assert.ok(Array.isArray(result))
      assert.equal(result.length, 1)
      assert.equal(result[0].status, 'signed')
    })

    it('should emit a signed event to signal the exciton of callback', (done) => {
      let tx = { id: 1, status: 'unapproved', metamaskNetworkId: currentNetworkId, txParams: {} }
      const noop = function () {
        assert(true, 'event listener has been triggered and noop executed')
        done()
      }
      txStateManager.addTx(tx)
      txStateManager.on('1:signed', noop)
      txStateManager.setTxStatusSigned(1)

    })
  })

  describe('#setTxStatusRejected', function () {
    it('sets the tx status to rejected', function () {
      let tx = { id: 1, status: 'unapproved', metamaskNetworkId: currentNetworkId, txParams: {} }
      txStateManager.addTx(tx)
      txStateManager.setTxStatusRejected(1)
      let result = txStateManager.getTxList()
      assert.ok(Array.isArray(result))
      assert.equal(result.length, 1)
      assert.equal(result[0].status, 'rejected')
    })

    it('should emit a rejected event to signal the exciton of callback', (done) => {
      let tx = { id: 1, status: 'unapproved', metamaskNetworkId: currentNetworkId, txParams: {} }
      txStateManager.addTx(tx)
      const noop = function (err, txId) {
        assert(true, 'event listener has been triggered and noop executed')
        done()
      }
      txStateManager.on('1:rejected', noop)
      txStateManager.setTxStatusRejected(1)
    })
  })

  describe('#getFullTxList', function () {
    it('when new should return empty array', function () {
      let result = txStateManager.getTxList()
      assert.ok(Array.isArray(result))
      assert.equal(result.length, 0)
    })
  })

  describe('#getTxList', function () {
    it('when new should return empty array', function () {
      let result = txStateManager.getTxList()
      assert.ok(Array.isArray(result))
      assert.equal(result.length, 0)
    })
  })

  describe('#addTx', function () {
    it('adds a tx returned in getTxList', function () {
      let tx = { id: 1, status: 'confirmed', metamaskNetworkId: currentNetworkId, txParams: {} }
      txStateManager.addTx(tx, noop)
      let result = txStateManager.getTxList()
      assert.ok(Array.isArray(result))
      assert.equal(result.length, 1)
      assert.equal(result[0].id, 1)
    })

    it('does not override txs from other networks', function () {
      let tx = { id: 1, status: 'confirmed', metamaskNetworkId: currentNetworkId, txParams: {} }
      let tx2 = { id: 2, status: 'confirmed', metamaskNetworkId: otherNetworkId, txParams: {} }
      txStateManager.addTx(tx, noop)
      txStateManager.addTx(tx2, noop)
      let result = txStateManager.getFullTxList()
      let result2 = txStateManager.getTxList()
      assert.equal(result.length, 2, 'txs were deleted')
      assert.equal(result2.length, 1, 'incorrect number of txs on network.')
    })

    it('cuts off early txs beyond a limit', function () {
      const limit = txStateManager.txHistoryLimit
      for (let i = 0; i < limit + 1; i++) {
        const tx = { id: i, time: new Date(), status: 'confirmed', metamaskNetworkId: currentNetworkId, txParams: {} }
        txStateManager.addTx(tx, noop)
      }
      let result = txStateManager.getTxList()
      assert.equal(result.length, limit, `limit of ${limit} txs enforced`)
      assert.equal(result[0].id, 1, 'early txs truncted')
    })

    it('cuts off early txs beyond a limit whether or not it is confirmed or rejected', function () {
      const limit = txStateManager.txHistoryLimit
      for (let i = 0; i < limit + 1; i++) {
        const tx = { id: i, time: new Date(), status: 'rejected', metamaskNetworkId: currentNetworkId, txParams: {} }
        txStateManager.addTx(tx, noop)
      }
      let result = txStateManager.getTxList()
      assert.equal(result.length, limit, `limit of ${limit} txs enforced`)
      assert.equal(result[0].id, 1, 'early txs truncted')
    })

    it('cuts off early txs beyond a limit but does not cut unapproved txs', function () {
      let unconfirmedTx = { id: 0, time: new Date(), status: 'unapproved', metamaskNetworkId: currentNetworkId, txParams: {} }
      txStateManager.addTx(unconfirmedTx, noop)
      const limit = txStateManager.txHistoryLimit
      for (let i = 1; i < limit + 1; i++) {
        const tx = { id: i, time: new Date(), status: 'confirmed', metamaskNetworkId: currentNetworkId, txParams: {} }
        txStateManager.addTx(tx, noop)
      }
      let result = txStateManager.getTxList()
      assert.equal(result.length, limit, `limit of ${limit} txs enforced`)
      assert.equal(result[0].id, 0, 'first tx should still be there')
      assert.equal(result[0].status, 'unapproved', 'first tx should be unapproved')
      assert.equal(result[1].id, 2, 'early txs truncted')
    })
  })

  describe('#updateTx', function () {
    it('replaces the tx with the same id', function () {
      txStateManager.addTx({ id: '1', status: 'unapproved', metamaskNetworkId: currentNetworkId, txParams: {} }, noop)
      txStateManager.addTx({ id: '2', status: 'confirmed', metamaskNetworkId: currentNetworkId, txParams: {} }, noop)
      txStateManager.updateTx({ id: '1', status: 'blah', hash: 'foo', metamaskNetworkId: currentNetworkId, txParams: {} })
      let result = txStateManager.getTx('1')
      assert.equal(result.hash, 'foo')
    })

    it('updates gas price and adds history items', function () {
      const originalGasPrice = '0x01'
      const desiredGasPrice = '0x02'

      const txMeta = {
        id: '1',
        status: 'unapproved',
        metamaskNetworkId: currentNetworkId,
        txParams: {
          gasPrice: originalGasPrice,
        },
      }

      const updatedMeta = clone(txMeta)

      txStateManager.addTx(txMeta)
      const updatedTx = txController.getTx('1')
      // verify tx was initialized correctly
      assert.equal(updatedTx.history.length, 1, 'one history item (initial)')
      assert.equal(Array.isArray(updatedTx.history[0]), false, 'first history item is initial state')
      assert.deepEqual(updatedTx.history[0], txStateHistoryHelper.snapshotFromTxMeta(updatedTx), 'first history item is initial state')
      // modify value and updateTx
      updatedTx.txParams.gasPrice = desiredGasPrice
      txController.updateTx(updatedTx)
      // check updated value
      const result = txController.getTx('1')
      assert.equal(result.txParams.gasPrice, desiredGasPrice, 'gas price updated')
      // validate history was updated
      assert.equal(result.history.length, 2, 'two history items (initial + diff)')
      const expectedEntry = { op: 'replace', path: '/txParams/gasPrice', value: desiredGasPrice }
      assert.deepEqual(result.history[1], [expectedEntry], 'two history items (initial + diff)')
    })
  })

  describe('#getUnapprovedTxList', function () {
    it('returns unapproved txs in a hash', function () {
      txStateManager.addTx({ id: '1', status: 'unapproved', metamaskNetworkId: currentNetworkId, txParams: {} }, noop)
      txStateManager.addTx({ id: '2', status: 'confirmed', metamaskNetworkId: currentNetworkId, txParams: {} }, noop)
      const result = txStateManager.getUnapprovedTxList()
      assert.equal(typeof result, 'object')
      assert.equal(result['1'].status, 'unapproved')
      assert.equal(result['2'], undefined)
    })
  })

  describe('#getTx', function () {
    it('returns a tx with the requested id', function () {
      txStateManager.addTx({ id: '1', status: 'unapproved', metamaskNetworkId: currentNetworkId, txParams: {} }, noop)
      txStateManager.addTx({ id: '2', status: 'confirmed', metamaskNetworkId: currentNetworkId, txParams: {} }, noop)
      assert.equal(txStateManager.getTx('1').status, 'unapproved')
      assert.equal(txStateManager.getTx('2').status, 'confirmed')
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
      txMetas.forEach((txMeta) => txStateManager.addTx(txMeta, noop))
      let filterParams

      filterParams = { status: 'unapproved', from: '0xaa' }
      assert.equal(txStateManager.getFilteredTxList(filterParams).length, 3, `getFilteredTxList - ${JSON.stringify(filterParams)}`)
      filterParams = { status: 'unapproved', to: '0xaa' }
      assert.equal(txStateManager.getFilteredTxList(filterParams).length, 2, `getFilteredTxList - ${JSON.stringify(filterParams)}`)
      filterParams = { status: 'confirmed', from: '0xbb' }
      assert.equal(txStateManager.getFilteredTxList(filterParams).length, 3, `getFilteredTxList - ${JSON.stringify(filterParams)}`)
      filterParams = { status: 'confirmed' }
      assert.equal(txStateManager.getFilteredTxList(filterParams).length, 5, `getFilteredTxList - ${JSON.stringify(filterParams)}`)
      filterParams = { from: '0xaa' }
      assert.equal(txStateManager.getFilteredTxList(filterParams).length, 5, `getFilteredTxList - ${JSON.stringify(filterParams)}`)
      filterParams = { to: '0xaa' }
      assert.equal(txStateManager.getFilteredTxList(filterParams).length, 5, `getFilteredTxList - ${JSON.stringify(filterParams)}`)
    })
  })
})