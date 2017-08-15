const assert = require('assert')
const ethUtil = require('ethereumjs-util')
const EthTx = require('ethereumjs-tx')
const ObservableStore = require('obs-store')
const clone = require('clone')
const sinon = require('sinon')
const TransactionController = require('../../app/scripts/controllers/transactions')
const TxProvideUtils = require('../../app/scripts/lib/tx-utils')
const txStateHistoryHelper = require('../../app/scripts/lib/tx-state-history-helper')

const noop = () => true
const currentNetworkId = 42
const otherNetworkId = 36
const privKey = new Buffer('8718b9618a37d1fc78c436511fc6df3c8258d3250635bba617f33003270ec03e', 'hex')
const { createStubedProvider } = require('../stub/provider')


describe('Transaction Controller', function () {
  let txController, engine, provider, providerResultStub

  beforeEach(function () {
    providerResultStub = {}
    provider = createStubedProvider(providerResultStub)

    txController = new TransactionController({
      provider,
      networkStore: new ObservableStore(currentNetworkId),
      txHistoryLimit: 10,
      blockTracker: { getCurrentBlock: noop, on: noop, once: noop },
      ethStore: { getState: noop },
      signTransaction: (ethTx) => new Promise((resolve) => {
        ethTx.sign(privKey)
        resolve()
      }),
    })
    txController.nonceTracker.getNonceLock = () => Promise.resolve({ nextNonce: 0, releaseLock: noop })
    txController.txProviderUtils = new TxProvideUtils(txController.provider)
  })

  describe('#newUnapprovedTransaction', function () {
    let stub, txMeta, txParams
    beforeEach(function () {
      txParams = {
        'from':'0xc684832530fcbddae4b4230a47e991ddcec2831d',
        'to':'0xc684832530fcbddae4b4230a47e991ddcec2831d',
      },
      txMeta = {
        status: 'unapproved',
        id: 1,
        metamaskNetworkId: currentNetworkId,
        txParams,
      }
      txController.addTx(txMeta)
      stub = sinon.stub(txController, 'addUnapprovedTransaction').returns(Promise.resolve(txMeta))
    })

    afterEach(function () {
      stub.restore()
    })

    it('should emit newUnaprovedTx event and pass txMeta as the first argument', function (done) {
      txController.once('newUnaprovedTx', (txMetaFromEmit) => {
        assert(txMetaFromEmit, 'txMeta is falsey')
        assert.equal(txMetaFromEmit.id, 1, 'the right txMeta was passed')
        done()
      })
      txController.newUnapprovedTransaction(txParams)
      .catch(done)
    })

    it('should resolve when finished and status is submitted and resolve with the hash', function (done) {
      txController.once('newUnaprovedTx', (txMetaFromEmit) => {
        setTimeout(() => {
          txController.setTxHash(txMetaFromEmit.id, '0x0')
          txController.setTxStatusSubmitted(txMetaFromEmit.id)
        }, 10)
      })

      txController.newUnapprovedTransaction(txParams)
      .then((hash) => {
        assert(hash, 'newUnapprovedTransaction needs to return the hash')
        done()
      })
      .catch(done)
    })

    it('should reject when finished and status is rejected', function (done) {
      txController.once('newUnaprovedTx', (txMetaFromEmit) => {
        setTimeout(() => {
          txController.setTxStatusRejected(txMetaFromEmit.id)
        }, 10)
      })

      txController.newUnapprovedTransaction(txParams)
      .catch((err) => {
        if (err.message === 'MetaMask Tx Signature: User denied transaction signature.') done()
        else done(err)
      })
    })
  })

  describe('#addUnapprovedTransaction', function () {
    it('should add an unapproved transaction and return a valid txMeta', function (done) {
      const addTxDefaultsStub = sinon.stub(txController, 'addTxDefaults').callsFake(() => Promise.resolve())
      txController.addUnapprovedTransaction({})
      .then((txMeta) => {
        assert(('id' in txMeta), 'should have a id')
        assert(('time' in txMeta), 'should have a time stamp')
        assert(('metamaskNetworkId' in txMeta), 'should have a metamaskNetworkId')
        assert(('txParams' in txMeta), 'should have a txParams')
        assert(('history' in txMeta), 'should have a history')

        const memTxMeta = txController.getTx(txMeta.id)
        assert.deepEqual(txMeta, memTxMeta, `txMeta should be stored in txController after adding it\n  expected: ${txMeta} \n  got: ${memTxMeta}`)
        addTxDefaultsStub.restore()
        done()
      }).catch(done)
    })
  })

  describe('#addTxDefaults', function () {
    it('should add the tx defaults if their are none', function (done) {
      let txMeta = {
        'txParams': {
          'from':'0xc684832530fcbddae4b4230a47e991ddcec2831d',
          'to':'0xc684832530fcbddae4b4230a47e991ddcec2831d',
        },
      }
        providerResultStub.eth_gasPrice = '4a817c800'
        providerResultStub.eth_getBlockByNumber = { gasLimit: '47b784' }
        providerResultStub.eth_estimateGas = '5209'
      txController.addTxDefaults(txMeta)
      .then((txMetaWithDefaults) => {
        assert(txMetaWithDefaults.txParams.value, '0x0','should have added 0x0 as the value')
        assert(txMetaWithDefaults.txParams.gasPrice, 'should have added the gas price')
        assert(txMetaWithDefaults.txParams.gas, 'should have added the gas field')
        done()
      })
      .catch(done)
    })
  })

  describe('#validateTxParams', function () {
    it('does not throw for positive values', function (done) {
      var sample = {
        value: '0x01',
      }
      txController.txProviderUtils.validateTxParams(sample).then(() => {
        done()
      }).catch(done)
    })

    it('returns error for negative values', function (done) {
      var sample = {
        value: '-0x01',
      }
      txController.txProviderUtils.validateTxParams(sample)
      .then(() => done('expected to thrown on negativity values but didn\'t'))
      .catch((err) => {
        assert.ok(err, 'error')
        done()
      })
    })
  })

  describe('#getTxList', function () {
    it('when new should return empty array', function () {
      var result = txController.getTxList()
      assert.ok(Array.isArray(result))
      assert.equal(result.length, 0)
    })
  })

  describe('#addTx', function () {
    it('adds a tx returned in getTxList', function () {
      var tx = { id: 1, status: 'confirmed', metamaskNetworkId: currentNetworkId, txParams: {} }
      txController.addTx(tx, noop)
      var result = txController.getTxList()
      assert.ok(Array.isArray(result))
      assert.equal(result.length, 1)
      assert.equal(result[0].id, 1)
    })

    it('does not override txs from other networks', function () {
      var tx = { id: 1, status: 'confirmed', metamaskNetworkId: currentNetworkId, txParams: {} }
      var tx2 = { id: 2, status: 'confirmed', metamaskNetworkId: otherNetworkId, txParams: {} }
      txController.addTx(tx, noop)
      txController.addTx(tx2, noop)
      var result = txController.getFullTxList()
      var result2 = txController.getTxList()
      assert.equal(result.length, 2, 'txs were deleted')
      assert.equal(result2.length, 1, 'incorrect number of txs on network.')
    })

    it('cuts off early txs beyond a limit', function () {
      const limit = txController.txHistoryLimit
      for (let i = 0; i < limit + 1; i++) {
        const tx = { id: i, time: new Date(), status: 'confirmed', metamaskNetworkId: currentNetworkId, txParams: {} }
        txController.addTx(tx, noop)
      }
      var result = txController.getTxList()
      assert.equal(result.length, limit, `limit of ${limit} txs enforced`)
      assert.equal(result[0].id, 1, 'early txs truncted')
    })

    it('cuts off early txs beyond a limit whether or not it is confirmed or rejected', function () {
      const limit = txController.txHistoryLimit
      for (let i = 0; i < limit + 1; i++) {
        const tx = { id: i, time: new Date(), status: 'rejected', metamaskNetworkId: currentNetworkId, txParams: {} }
        txController.addTx(tx, noop)
      }
      var result = txController.getTxList()
      assert.equal(result.length, limit, `limit of ${limit} txs enforced`)
      assert.equal(result[0].id, 1, 'early txs truncted')
    })

    it('cuts off early txs beyond a limit but does not cut unapproved txs', function () {
      var unconfirmedTx = { id: 0, time: new Date(), status: 'unapproved', metamaskNetworkId: currentNetworkId, txParams: {} }
      txController.addTx(unconfirmedTx, noop)
      const limit = txController.txHistoryLimit
      for (let i = 1; i < limit + 1; i++) {
        const tx = { id: i, time: new Date(), status: 'confirmed', metamaskNetworkId: currentNetworkId, txParams: {} }
        txController.addTx(tx, noop)
      }
      var result = txController.getTxList()
      assert.equal(result.length, limit, `limit of ${limit} txs enforced`)
      assert.equal(result[0].id, 0, 'first tx should still be there')
      assert.equal(result[0].status, 'unapproved', 'first tx should be unapproved')
      assert.equal(result[1].id, 2, 'early txs truncted')
    })
  })

  describe('#setTxStatusSigned', function () {
    it('sets the tx status to signed', function () {
      var tx = { id: 1, status: 'unapproved', metamaskNetworkId: currentNetworkId, txParams: {} }
      txController.addTx(tx, noop)
      txController.setTxStatusSigned(1)
      var result = txController.getTxList()
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
      txController.addTx(tx)
      txController.on('1:signed', noop)
      txController.setTxStatusSigned(1)
    })
  })

  describe('#setTxStatusRejected', function () {
    it('sets the tx status to rejected', function () {
      var tx = { id: 1, status: 'unapproved', metamaskNetworkId: currentNetworkId, txParams: {} }
      txController.addTx(tx)
      txController.setTxStatusRejected(1)
      var result = txController.getTxList()
      assert.ok(Array.isArray(result))
      assert.equal(result.length, 1)
      assert.equal(result[0].status, 'rejected')
    })

    it('should emit a rejected event to signal the exciton of callback', (done) => {
      this.timeout(10000)
      var tx = { id: 1, status: 'unapproved', metamaskNetworkId: currentNetworkId, txParams: {} }
      txController.addTx(tx)
      const noop = function (err, txId) {
        assert(true, 'event listener has been triggered and noop executed')
        done()
      }
      txController.on('1:rejected', noop)
      txController.setTxStatusRejected(1)
    })
  })

  describe('#updateTx', function () {
    it('replaces the tx with the same id', function () {
      txController.addTx({ id: '1', status: 'unapproved', metamaskNetworkId: currentNetworkId, txParams: {} }, noop)
      txController.addTx({ id: '2', status: 'confirmed', metamaskNetworkId: currentNetworkId, txParams: {} }, noop)
      const tx1 = txController.getTx('1')
      tx1.status = 'blah'
      tx1.hash = 'foo'
      txController.updateTx(tx1)
      const savedResult = txController.getTx('1')
      assert.equal(savedResult.hash, 'foo')
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

      txController.addTx(txMeta)
      const updatedTx = txController.getTx('1')
      // verify tx was initialized correctly
      assert.equal(result.history.length, 1, 'one history item (initial)')
      assert.equal(Array.isArray(result.history[0]), false, 'first history item is initial state')
      assert.deepEqual(result.history[0], txStateHistoryHelper.snapshotFromTxMeta(updatedTx), 'first history item is initial state')
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
      txController.addTx({ id: '1', status: 'unapproved', metamaskNetworkId: currentNetworkId, txParams: {} }, noop)
      txController.addTx({ id: '2', status: 'confirmed', metamaskNetworkId: currentNetworkId, txParams: {} }, noop)
      const result = txController.getUnapprovedTxList()
      assert.equal(typeof result, 'object')
      assert.equal(result['1'].status, 'unapproved')
      assert.equal(result['2'], undefined)
    })
  })

  describe('#getTx', function () {
    it('returns a tx with the requested id', function () {
      txController.addTx({ id: '1', status: 'unapproved', metamaskNetworkId: currentNetworkId, txParams: {} }, noop)
      txController.addTx({ id: '2', status: 'confirmed', metamaskNetworkId: currentNetworkId, txParams: {} }, noop)
      assert.equal(txController.getTx('1').status, 'unapproved')
      assert.equal(txController.getTx('2').status, 'confirmed')
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
      txMetas.forEach((txMeta) => txController.addTx(txMeta, noop))
      let filterParams

      filterParams = { status: 'unapproved', from: '0xaa' }
      assert.equal(txController.getFilteredTxList(filterParams).length, 3, `getFilteredTxList - ${JSON.stringify(filterParams)}`)
      filterParams = { status: 'unapproved', to: '0xaa' }
      assert.equal(txController.getFilteredTxList(filterParams).length, 2, `getFilteredTxList - ${JSON.stringify(filterParams)}`)
      filterParams = { status: 'confirmed', from: '0xbb' }
      assert.equal(txController.getFilteredTxList(filterParams).length, 3, `getFilteredTxList - ${JSON.stringify(filterParams)}`)
      filterParams = { status: 'confirmed' }
      assert.equal(txController.getFilteredTxList(filterParams).length, 5, `getFilteredTxList - ${JSON.stringify(filterParams)}`)
      filterParams = { from: '0xaa' }
      assert.equal(txController.getFilteredTxList(filterParams).length, 5, `getFilteredTxList - ${JSON.stringify(filterParams)}`)
      filterParams = { to: '0xaa' }
      assert.equal(txController.getFilteredTxList(filterParams).length, 5, `getFilteredTxList - ${JSON.stringify(filterParams)}`)
    })
  })

  describe('#approveTransaction', function () {
    let txMeta, originalValue

    beforeEach(function () {
      originalValue = '0x01'
      txMeta = {
        id: '1',
        status: 'unapproved',
        metamaskNetworkId: currentNetworkId,
        txParams: {
          nonce: originalValue,
          gas: originalValue,
          gasPrice: originalValue,
        },
      }
    })


    it('does not overwrite set values', function (done) {
      this.timeout(15000)
      const wrongValue = '0x05'

      txController.addTx(txMeta)
      providerResultStub.eth_gasPrice = wrongValue
      providerResultStub.eth_estimateGas = '0x5209'

      const signStub = sinon.stub(txController, 'signTransaction').callsFake(() => Promise.resolve())

      const pubStub = sinon.stub(txController, 'publishTransaction').callsFake(() => {
        txController.setTxHash('1', originalValue)
        txController.setTxStatusSubmitted('1')
      })

      txController.approveTransaction(txMeta.id).then(() => {
        const result = txController.getTx(txMeta.id)
        const params = result.txParams

        assert.equal(params.gas, originalValue, 'gas unmodified')
        assert.equal(params.gasPrice, originalValue, 'gas price unmodified')
        assert.equal(result.hash, originalValue, `hash was set \n got: ${result.hash} \n expected: ${originalValue}`)
        signStub.restore()
        pubStub.restore()
        done()
      }).catch(done)
    })
  })

  describe('#sign replay-protected tx', function () {
    it('prepares a tx with the chainId set', function (done) {
      txController.addTx({ id: '1', status: 'unapproved', metamaskNetworkId: currentNetworkId, txParams: {} }, noop)
      txController.signTransaction('1').then((rawTx) => {
        const ethTx = new EthTx(ethUtil.toBuffer(rawTx))
        assert.equal(ethTx.getChainId(), currentNetworkId)
        done()
      }).catch(done)
    })
  })
})