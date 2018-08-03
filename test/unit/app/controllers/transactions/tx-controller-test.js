const assert = require('assert')
const ethUtil = require('ethereumjs-util')
const EthTx = require('ethereumjs-tx')
const ObservableStore = require('obs-store')
const sinon = require('sinon')
const TransactionController = require('../../../../../app/scripts/controllers/transactions')
const { createTestProviderTools, getTestAccounts } = require('../../../../stub/provider')

const noop = () => true
const currentNetworkId = 42


describe('Transaction Controller', function () {
  let txController, provider, providerResultStub, fromAccount

  beforeEach(function () {
    providerResultStub = {
      // 1 gwei
      eth_gasPrice: '0x0de0b6b3a7640000',
      // by default, all accounts are external accounts (not contracts)
      eth_getCode: '0x',
    }
    provider = createTestProviderTools({ scaffold: providerResultStub }).provider
    fromAccount = getTestAccounts()[0]

    txController = new TransactionController({
      provider,
      networkStore: new ObservableStore(currentNetworkId),
      txHistoryLimit: 10,
      blockTracker: { getCurrentBlock: noop, on: noop, once: noop },
      signTransaction: (ethTx) => new Promise((resolve) => {
        ethTx.sign(fromAccount.key)
        resolve()
      }),
    })
    txController.nonceTracker.getNonceLock = () => Promise.resolve({ nextNonce: 0, releaseLock: noop })
  })

  describe('#getState', function () {
    it('should return a state object with the right keys and datat types', function () {
      const exposedState = txController.getState()
      assert('unapprovedTxs' in exposedState, 'state should have the key unapprovedTxs')
      assert('selectedAddressTxList' in exposedState, 'state should have the key selectedAddressTxList')
      assert(typeof exposedState.unapprovedTxs === 'object', 'should be an object')
      assert(Array.isArray(exposedState.selectedAddressTxList), 'should be an array')
    })
  })

  describe('#getUnapprovedTxCount', function () {
    it('should return the number of unapproved txs', function () {
      txController.txStateManager._saveTxList([
        { id: 1, status: 'unapproved', metamaskNetworkId: currentNetworkId, txParams: {} },
        { id: 2, status: 'unapproved', metamaskNetworkId: currentNetworkId, txParams: {} },
        { id: 3, status: 'unapproved', metamaskNetworkId: currentNetworkId, txParams: {} },
      ])
      const unapprovedTxCount = txController.getUnapprovedTxCount()
      assert.equal(unapprovedTxCount, 3, 'should be 3')
    })
  })

  describe('#getPendingTxCount', function () {
    it('should return the number of pending txs', function () {
      txController.txStateManager._saveTxList([
        { id: 1, status: 'submitted', metamaskNetworkId: currentNetworkId, txParams: {} },
        { id: 2, status: 'submitted', metamaskNetworkId: currentNetworkId, txParams: {} },
        { id: 3, status: 'submitted', metamaskNetworkId: currentNetworkId, txParams: {} },
      ])
      const pendingTxCount = txController.getPendingTxCount()
      assert.equal(pendingTxCount, 3, 'should be 3')
    })
  })

  describe('#getConfirmedTransactions', function () {
    let address
    beforeEach(function () {
      address = '0xc684832530fcbddae4b4230a47e991ddcec2831d'
      const txParams = {
        'from': address,
        'to': '0xc684832530fcbddae4b4230a47e991ddcec2831d',
      }
      txController.txStateManager._saveTxList([
        {id: 0, status: 'confirmed', metamaskNetworkId: currentNetworkId, txParams},
        {id: 1, status: 'confirmed', metamaskNetworkId: currentNetworkId, txParams},
        {id: 2, status: 'confirmed', metamaskNetworkId: currentNetworkId, txParams},
        {id: 3, status: 'unapproved', metamaskNetworkId: currentNetworkId, txParams},
        {id: 4, status: 'rejected', metamaskNetworkId: currentNetworkId, txParams},
        {id: 5, status: 'approved', metamaskNetworkId: currentNetworkId, txParams},
        {id: 6, status: 'signed', metamaskNetworkId: currentNetworkId, txParams},
        {id: 7, status: 'submitted', metamaskNetworkId: currentNetworkId, txParams},
        {id: 8, status: 'failed', metamaskNetworkId: currentNetworkId, txParams},
      ])
    })

    it('should return the number of confirmed txs', function () {
      assert.equal(txController.nonceTracker.getConfirmedTransactions(address).length, 3)
    })
  })


  describe('#newUnapprovedTransaction', function () {
    let stub, txMeta, txParams
    beforeEach(function () {
      txParams = {
        'from': '0xc684832530fcbddae4b4230a47e991ddcec2831d',
        'to': '0xc684832530fcbddae4b4230a47e991ddcec2831d',
      }
      txMeta = {
        status: 'unapproved',
        id: 1,
        metamaskNetworkId: currentNetworkId,
        txParams,
        history: [],
      }
      txController.txStateManager._saveTxList([txMeta])
      stub = sinon.stub(txController, 'addUnapprovedTransaction').callsFake(() => {
        txController.emit('newUnapprovedTx', txMeta)
        return Promise.resolve(txController.txStateManager.addTx(txMeta))
    })

    afterEach(function () {
      txController.txStateManager._saveTxList([])
      stub.restore()
    })
  })

    it('should resolve when finished and status is submitted and resolve with the hash', function (done) {
      txController.once('newUnapprovedTx', (txMetaFromEmit) => {
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
      txController.once('newUnapprovedTx', (txMetaFromEmit) => {
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
      txController.addUnapprovedTransaction({ from: '0x1678a085c290ebd122dc42cba69373b5953b831d' })
      .then((txMeta) => {
        assert(('id' in txMeta), 'should have a id')
        assert(('time' in txMeta), 'should have a time stamp')
        assert(('metamaskNetworkId' in txMeta), 'should have a metamaskNetworkId')
        assert(('txParams' in txMeta), 'should have a txParams')
        assert(('history' in txMeta), 'should have a history')

        const memTxMeta = txController.txStateManager.getTx(txMeta.id)
        assert.deepEqual(txMeta, memTxMeta, `txMeta should be stored in txController after adding it\n  expected: ${txMeta} \n  got: ${memTxMeta}`)
        done()
      }).catch(done)
    })

    it('should emit newUnapprovedTx event and pass txMeta as the first argument', function (done) {
      providerResultStub.eth_gasPrice = '4a817c800'
      txController.once('newUnapprovedTx', (txMetaFromEmit) => {
        assert(txMetaFromEmit, 'txMeta is falsey')
        done()
      })
      txController.addUnapprovedTransaction({ from: '0x1678a085c290ebd122dc42cba69373b5953b831d' })
      .catch(done)
    })

    it('should fail if recipient is public', function (done) {
      txController.networkStore = new ObservableStore(1)
      txController.addUnapprovedTransaction({ from: '0x1678a085c290ebd122dc42cba69373b5953b831d', to: '0x0d1d4e623D10F9FBA5Db95830F7d3839406C6AF2' })
      .catch((err) => {
        if (err.message === 'Recipient is a public account') done()
        else done(err)
      })
    })

    it('should not fail if recipient is public but not on mainnet', function (done) {
      txController.once('newUnapprovedTx', (txMetaFromEmit) => {
        assert(txMetaFromEmit, 'txMeta is falsey')
        done()
      })
      txController.addUnapprovedTransaction({ from: '0x1678a085c290ebd122dc42cba69373b5953b831d', to: '0x0d1d4e623D10F9FBA5Db95830F7d3839406C6AF2' })
      .catch(done)
    })
  })

  describe('#addTxGasDefaults', function () {
    it('should add the tx defaults if their are none', function (done) {
      const txMeta = {
        'txParams': {
          'from': '0xc684832530fcbddae4b4230a47e991ddcec2831d',
          'to': '0xc684832530fcbddae4b4230a47e991ddcec2831d',
        },
      }
        providerResultStub.eth_gasPrice = '4a817c800'
        providerResultStub.eth_getBlockByNumber = { gasLimit: '47b784' }
        providerResultStub.eth_estimateGas = '5209'
      txController.addTxGasDefaults(txMeta)
      .then((txMetaWithDefaults) => {
        assert(txMetaWithDefaults.txParams.value, '0x0', 'should have added 0x0 as the value')
        assert(txMetaWithDefaults.txParams.gasPrice, 'should have added the gas price')
        assert(txMetaWithDefaults.txParams.gas, 'should have added the gas field')
        done()
      })
      .catch(done)
    })
  })

  describe('#addTx', function () {
    it('should emit updates', function (done) {
      const txMeta = {
        id: '1',
        status: 'unapproved',
        metamaskNetworkId: currentNetworkId,
        txParams: {},
      }

      const eventNames = ['update:badge', '1:unapproved']
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

  describe('#updateAndApproveTransaction', function () {
    let txMeta
    beforeEach(() => {
      txMeta = {
        id: 1,
        status: 'unapproved',
        txParams: {
          from: fromAccount.address,
          to: '0x1678a085c290ebd122dc42cba69373b5953b831d',
          gasPrice: '0x77359400',
          gas: '0x7b0d',
          nonce: '0x4b',
        },
        metamaskNetworkId: currentNetworkId,
      }
    })
    it('should update and approve transactions', async () => {
      txController.txStateManager.addTx(txMeta)
      const approvalPromise = txController.updateAndApproveTransaction(txMeta)
      const tx = txController.txStateManager.getTx(1)
      assert.equal(tx.status, 'approved')
      await approvalPromise
    })
  })

  describe('#getChainId', function () {
    it('returns 0 when the chainId is NaN', function () {
      txController.networkStore = new ObservableStore(NaN)
      assert.equal(txController.getChainId(), 0)
    })
  })

  describe('#cancelTransaction', function () {
    beforeEach(function () {
      txController.txStateManager._saveTxList([
        { id: 0, status: 'unapproved', txParams: {}, metamaskNetworkId: currentNetworkId, history: [{}] },
        { id: 1, status: 'rejected', txParams: {}, metamaskNetworkId: currentNetworkId, history: [{}] },
        { id: 2, status: 'approved', txParams: {}, metamaskNetworkId: currentNetworkId, history: [{}] },
        { id: 3, status: 'signed', txParams: {}, metamaskNetworkId: currentNetworkId, history: [{}] },
        { id: 4, status: 'submitted', txParams: {}, metamaskNetworkId: currentNetworkId, history: [{}] },
        { id: 5, status: 'confirmed', txParams: {}, metamaskNetworkId: currentNetworkId, history: [{}] },
        { id: 6, status: 'failed', txParams: {}, metamaskNetworkId: currentNetworkId, history: [{}] },
      ])
    })

    it('should emit a status change to rejected', function (done) {
      txController.once('tx:status-update', (txId, status) => {
        try {
          assert.equal(status, 'rejected', 'status should e rejected')
          assert.equal(txId, 0, 'id should e 0')
          done()
        } catch (e) { done(e) }
      })

      txController.cancelTransaction(0)
    })

  })

  describe('#publishTransaction', function () {
    let hash, txMeta
    beforeEach(function () {
      hash = '0x2a5523c6fa98b47b7d9b6c8320179785150b42a16bcff36b398c5062b65657e8'
      txMeta = {
        id: 1,
        status: 'unapproved',
        txParams: {},
        metamaskNetworkId: currentNetworkId,
      }
      providerResultStub.eth_sendRawTransaction = hash
    })

    it('should publish a tx, updates the rawTx when provided a one', async function () {
      txController.txStateManager.addTx(txMeta)
      await txController.publishTransaction(txMeta.id)
      const publishedTx = txController.txStateManager.getTx(1)
      assert.equal(publishedTx.hash, hash)
      assert.equal(publishedTx.status, 'submitted')
    })
  })

  describe('#retryTransaction', function () {
    it('should create a new txMeta with the same txParams as the original one', function (done) {
      const txParams = {
        nonce: '0x00',
        from: '0xB09d8505E1F4EF1CeA089D47094f5DD3464083d4',
        to: '0xB09d8505E1F4EF1CeA089D47094f5DD3464083d4',
        data: '0x0',
      }
      txController.txStateManager._saveTxList([
        { id: 1, status: 'submitted', metamaskNetworkId: currentNetworkId, txParams },
      ])
      txController.retryTransaction(1)
      .then((txMeta) => {
        assert.equal(txMeta.txParams.nonce, txParams.nonce, 'nonce should be the same')
        assert.equal(txMeta.txParams.from, txParams.from, 'from should be the same')
        assert.equal(txMeta.txParams.to, txParams.to, 'to should be the same')
        assert.equal(txMeta.txParams.data, txParams.data, 'data should be the same')
        assert.ok(('lastGasPrice' in txMeta), 'should have the key `lastGasPrice`')
        assert.equal(txController.txStateManager.getTxList().length, 2)
        done()
      }).catch(done)
    })
  })

  describe('#_markNonceDuplicatesDropped', function () {
    it('should mark all nonce duplicates as dropped without marking the confirmed transaction as dropped', function () {
      txController.txStateManager._saveTxList([
        { id: 1, status: 'confirmed', metamaskNetworkId: currentNetworkId, history: [{}], txParams: { nonce: '0x01' } },
        { id: 2, status: 'submitted', metamaskNetworkId: currentNetworkId, history: [{}], txParams: { nonce: '0x01' } },
        { id: 3, status: 'submitted', metamaskNetworkId: currentNetworkId, history: [{}], txParams: { nonce: '0x01' } },
        { id: 4, status: 'submitted', metamaskNetworkId: currentNetworkId, history: [{}], txParams: { nonce: '0x01' } },
        { id: 5, status: 'submitted', metamaskNetworkId: currentNetworkId, history: [{}], txParams: { nonce: '0x01' } },
        { id: 6, status: 'submitted', metamaskNetworkId: currentNetworkId, history: [{}], txParams: { nonce: '0x01' } },
        { id: 7, status: 'submitted', metamaskNetworkId: currentNetworkId, history: [{}], txParams: { nonce: '0x01' } },
      ])
      txController._markNonceDuplicatesDropped(1)
      const confirmedTx = txController.txStateManager.getTx(1)
      const droppedTxs = txController.txStateManager.getFilteredTxList({ nonce: '0x01', status: 'dropped' })
      assert.equal(confirmedTx.status, 'confirmed', 'the confirmedTx should remain confirmed')
      assert.equal(droppedTxs.length, 6, 'their should be 6 dropped txs')

    })
  })

  describe('#getPendingTransactions', function () {
    beforeEach(function () {
      txController.txStateManager._saveTxList([
        { id: 1, status: 'unapproved', metamaskNetworkId: currentNetworkId, txParams: {} },
        { id: 2, status: 'rejected', metamaskNetworkId: currentNetworkId, txParams: {} },
        { id: 3, status: 'approved', metamaskNetworkId: currentNetworkId, txParams: {} },
        { id: 4, status: 'signed', metamaskNetworkId: currentNetworkId, txParams: {} },
        { id: 5, status: 'submitted', metamaskNetworkId: currentNetworkId, txParams: {} },
        { id: 6, status: 'confirmed', metamaskNetworkId: currentNetworkId, txParams: {} },
        { id: 7, status: 'failed', metamaskNetworkId: currentNetworkId, txParams: {} },
      ])
    })
    it('should show only submitted transactions as pending transasction', function () {
      assert(txController.pendingTxTracker.getPendingTransactions().length, 1)
      assert(txController.pendingTxTracker.getPendingTransactions()[0].status, 'submitted')
    })
  })
})
