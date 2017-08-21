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
        history: [],
      }
      txController.txStateManager._saveTxList([txMeta])
      stub = sinon.stub(txController, 'addUnapprovedTransaction').returns(Promise.resolve(txController.txStateManager.addTx(txMeta)))
    })

    afterEach(function () {
      txController.txStateManager._saveTxList([])
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
          txController.txStateManager.setTxStatusSubmitted(txMetaFromEmit.id)
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
          txController.txStateManager.setTxStatusRejected(txMetaFromEmit.id)
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

        const memTxMeta = txController.txStateManager.getTx(txMeta.id)
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

  describe('#addTx', function () {
    it('should emit updates', function (done) {
      const txMeta = {
        id: '1',
        status: 'unapproved',
        id: 1,
        metamaskNetworkId: currentNetworkId,
        txParams: {}
      }

      const eventNames = ['update', 'updateBadge', '1:unapproved']
      const listeners = []
      eventNames.forEach((eventName) => {
        listeners.push(new Promise((resolve) => {
          txController.once(eventName, (arg) => {
            resolve(arg)
          })
        }))
      })
      Promise.all(listeners)
      .then((returnValues) => {
        assert.deepEqual(returnValues.pop(), txMeta, 'last event 1:unapproved should return txMeta')
        done()
      })
      .catch(done)
      txController.addTx(txMeta)
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
        txController.txStateManager.setTxStatusSubmitted('1')
      })

      txController.approveTransaction(txMeta.id).then(() => {
        const result = txController.txStateManager.getTx(txMeta.id)
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