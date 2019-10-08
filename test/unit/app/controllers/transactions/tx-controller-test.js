const assert = require('assert')
const EventEmitter = require('events')
const ethUtil = require('ethereumjs-util')
const EthTx = require('ethereumjs-tx')
const ObservableStore = require('obs-store')
const sinon = require('sinon')
const TransactionController = require('../../../../../app/scripts/controllers/transactions')
const {
  TRANSACTION_TYPE_RETRY,
} = require('../../../../../app/scripts/controllers/transactions/enums')
const {
  TOKEN_METHOD_APPROVE,
  TOKEN_METHOD_TRANSFER,
  SEND_ETHER_ACTION_KEY,
  DEPLOY_CONTRACT_ACTION_KEY,
  CONTRACT_INTERACTION_KEY,
} = require('../../../../../ui/app/helpers/constants/transactions.js')
const { createTestProviderTools, getTestAccounts } = require('../../../../stub/provider')

const noop = () => true
const currentNetworkId = 42
const netStore = new ObservableStore(currentNetworkId)

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
    const blockTrackerStub = new EventEmitter()
    blockTrackerStub.getCurrentBlock = noop
    blockTrackerStub.getLatestBlock = noop
    txController = new TransactionController({
      provider,
      getGasPrice: function () { return '0xee6b2800' },
      networkStore: netStore,
      txHistoryLimit: 10,
      blockTracker: blockTrackerStub,
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
        { id: 1, status: 'unapproved', metamaskNetworkId: currentNetworkId, txParams: {}, history: [{}] },
        { id: 2, status: 'unapproved', metamaskNetworkId: currentNetworkId, txParams: {}, history: [{}] },
        { id: 3, status: 'unapproved', metamaskNetworkId: currentNetworkId, txParams: {}, history: [{}] },
      ])
      const unapprovedTxCount = txController.getUnapprovedTxCount()
      assert.equal(unapprovedTxCount, 3, 'should be 3')
    })
  })

  describe('#getPendingTxCount', function () {
    it('should return the number of pending txs', function () {
      txController.txStateManager._saveTxList([
        { id: 1, status: 'submitted', metamaskNetworkId: currentNetworkId, txParams: {}, history: [{}] },
        { id: 2, status: 'submitted', metamaskNetworkId: currentNetworkId, txParams: {}, history: [{}] },
        { id: 3, status: 'submitted', metamaskNetworkId: currentNetworkId, txParams: {}, history: [{}] },
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
        {id: 0, status: 'confirmed', metamaskNetworkId: currentNetworkId, txParams, history: [{}] },
        {id: 1, status: 'confirmed', metamaskNetworkId: currentNetworkId, txParams, history: [{}] },
        {id: 2, status: 'confirmed', metamaskNetworkId: currentNetworkId, txParams, history: [{}] },
        {id: 3, status: 'unapproved', metamaskNetworkId: currentNetworkId, txParams, history: [{}] },
        {id: 4, status: 'rejected', metamaskNetworkId: currentNetworkId, txParams, history: [{}] },
        {id: 5, status: 'approved', metamaskNetworkId: currentNetworkId, txParams, history: [{}] },
        {id: 6, status: 'signed', metamaskNetworkId: currentNetworkId, txParams, history: [{}] },
        {id: 7, status: 'submitted', metamaskNetworkId: currentNetworkId, txParams, history: [{}] },
        {id: 8, status: 'failed', metamaskNetworkId: currentNetworkId, txParams, history: [{}] },
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
        history: [{}],
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
    const selectedAddress = '0x1678a085c290ebd122dc42cba69373b5953b831d'

    let getSelectedAddress
    beforeEach(function () {
      getSelectedAddress = sinon.stub(txController, 'getSelectedAddress').returns(selectedAddress)
    })

    afterEach(function () {
      getSelectedAddress.restore()
    })

    it('should add an unapproved transaction and return a valid txMeta', function (done) {
      txController.addUnapprovedTransaction({ from: selectedAddress })
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
      txController.addUnapprovedTransaction({ from: selectedAddress })
        .catch(done)
    })

    it('should fail if recipient is public', function (done) {
      txController.networkStore = new ObservableStore(1)
      txController.addUnapprovedTransaction({ from: selectedAddress, to: '0x0d1d4e623D10F9FBA5Db95830F7d3839406C6AF2' })
        .catch((err) => {
          if (err.message === 'Recipient is a public account') done()
          else done(err)
        })
    })

    it('should fail if the from address isn\'t the selected address', function (done) {
      txController.addUnapprovedTransaction({from: '0x0d1d4e623D10F9FBA5Db95830F7d3839406C6AF2'})
        .then(function () {
          assert.fail('transaction should not have been added')
          done()
        })
        .catch(function () {
          assert.ok('pass')
          done()
        })
    })

    it('should not fail if recipient is public but not on mainnet', function (done) {
      txController.once('newUnapprovedTx', (txMetaFromEmit) => {
        assert(txMetaFromEmit, 'txMeta is falsey')
        done()
      })
      txController.addUnapprovedTransaction({ from: selectedAddress, to: '0x0d1d4e623D10F9FBA5Db95830F7d3839406C6AF2' })
        .catch(done)
    })

    it('should fail if netId is loading', function (done) {
      txController.networkStore = new ObservableStore('loading')
      txController.addUnapprovedTransaction({ from: selectedAddress, to: '0x0d1d4e623D10F9FBA5Db95830F7d3839406C6AF2' })
        .catch((err) => {
          if (err.message === 'MetaMask is having trouble connecting to the network') done()
          else done(err)
        })
    })
  })

  describe('#addTxGasDefaults', function () {
    it('should add the tx defaults if their are none', async () => {
      const txMeta = {
        txParams: {
          from: '0xc684832530fcbddae4b4230a47e991ddcec2831d',
          to: '0xc684832530fcbddae4b4230a47e991ddcec2831d',
        },
        history: [{}],
      }
      providerResultStub.eth_gasPrice = '4a817c800'
      providerResultStub.eth_getBlockByNumber = { gasLimit: '47b784' }
      providerResultStub.eth_estimateGas = '5209'

      const txMetaWithDefaults = await txController.addTxGasDefaults(txMeta)
      assert(txMetaWithDefaults.txParams.value, '0x0', 'should have added 0x0 as the value')
      assert(txMetaWithDefaults.txParams.gasPrice, 'should have added the gas price')
      assert(txMetaWithDefaults.txParams.gas, 'should have added the gas field')
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
        assert.equal(result.status, 'submitted', 'Should have reached the submitted status.')
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

  describe('#createSpeedUpTransaction', () => {
    let addTxSpy
    let approveTransactionSpy
    let txParams
    let expectedTxParams

    beforeEach(() => {
      addTxSpy = sinon.spy(txController, 'addTx')
      approveTransactionSpy = sinon.spy(txController, 'approveTransaction')

      txParams = {
        nonce: '0x00',
        from: '0xB09d8505E1F4EF1CeA089D47094f5DD3464083d4',
        to: '0xB09d8505E1F4EF1CeA089D47094f5DD3464083d4',
        gas: '0x5209',
        gasPrice: '0xa',
      }
      txController.txStateManager._saveTxList([
        { id: 1, status: 'submitted', metamaskNetworkId: currentNetworkId, txParams, history: [{}] },
      ])

      expectedTxParams = Object.assign({}, txParams, { gasPrice: '0xb'})
    })

    afterEach(() => {
      addTxSpy.restore()
      approveTransactionSpy.restore()
    })

    it('should call this.addTx and this.approveTransaction with the expected args', async () => {
      await txController.createSpeedUpTransaction(1)
      assert.equal(addTxSpy.callCount, 1)

      const addTxArgs = addTxSpy.getCall(0).args[0]
      assert.deepEqual(addTxArgs.txParams, expectedTxParams)

      const { lastGasPrice, type } = addTxArgs
      assert.deepEqual({ lastGasPrice, type }, {
        lastGasPrice: '0xa',
        type: TRANSACTION_TYPE_RETRY,
      })
    })

    it('should call this.approveTransaction with the id of the returned tx', async () => {
      const result = await txController.createSpeedUpTransaction(1)
      assert.equal(approveTransactionSpy.callCount, 1)

      const approveTransactionArg = approveTransactionSpy.getCall(0).args[0]
      assert.equal(result.id, approveTransactionArg)
    })

    it('should return the expected txMeta', async () => {
      const result = await txController.createSpeedUpTransaction(1)

      assert.deepEqual(result.txParams, expectedTxParams)

      const { lastGasPrice, type } = result
      assert.deepEqual({ lastGasPrice, type }, {
        lastGasPrice: '0xa',
        type: TRANSACTION_TYPE_RETRY,
      })
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
      const rawTx = '0x477b2e6553c917af0db0388ae3da62965ff1a184558f61b749d1266b2e6d024c'
      txController.txStateManager.addTx(txMeta)
      await txController.publishTransaction(txMeta.id, rawTx)
      const publishedTx = txController.txStateManager.getTx(1)
      assert.equal(publishedTx.hash, hash)
      assert.equal(publishedTx.status, 'submitted')
    })
  })

  describe('#retryTransaction', function () {
    it('should create a new txMeta with the same txParams as the original one but with a higher gasPrice', function (done) {
      const txParams = {
        gasPrice: '0xee6b2800',
        nonce: '0x00',
        from: '0xB09d8505E1F4EF1CeA089D47094f5DD3464083d4',
        to: '0xB09d8505E1F4EF1CeA089D47094f5DD3464083d4',
        data: '0x0',
      }
      txController.txStateManager._saveTxList([
        { id: 1, status: 'submitted', metamaskNetworkId: currentNetworkId, txParams, history: [{}] },
      ])
      txController.retryTransaction(1)
        .then((txMeta) => {
          assert.equal(txMeta.txParams.gasPrice, '0x10642ac00', 'gasPrice should have a %10 gasPrice bump')
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

  describe('#_determineTransactionCategory', function () {
    it('should return a simple send transactionCategory when to is truthy but data is falsey', async function () {
      const result = await txController._determineTransactionCategory({
        to: '0xabc',
        data: '',
      })
      assert.deepEqual(result, { transactionCategory: SEND_ETHER_ACTION_KEY, getCodeResponse: undefined })
    })

    it('should return a token transfer transactionCategory when data is for the respective method call', async function () {
      const result = await txController._determineTransactionCategory({
        to: '0xabc',
        data: '0xa9059cbb0000000000000000000000002f318C334780961FB129D2a6c30D0763d9a5C970000000000000000000000000000000000000000000000000000000000000000a',
      })
      assert.deepEqual(result, { transactionCategory: TOKEN_METHOD_TRANSFER, getCodeResponse: undefined })
    })

    it('should return a token approve transactionCategory when data is for the respective method call', async function () {
      const result = await txController._determineTransactionCategory({
        to: '0xabc',
        data: '0x095ea7b30000000000000000000000002f318C334780961FB129D2a6c30D0763d9a5C9700000000000000000000000000000000000000000000000000000000000000005',
      })
      assert.deepEqual(result, { transactionCategory: TOKEN_METHOD_APPROVE, getCodeResponse: undefined })
    })

    it('should return a contract deployment transactionCategory when to is falsey and there is data', async function () {
      const result = await txController._determineTransactionCategory({
        to: '',
        data: '0xabd',
      })
      assert.deepEqual(result, { transactionCategory: DEPLOY_CONTRACT_ACTION_KEY, getCodeResponse: undefined })
    })

    it('should return a simple send transactionCategory with a 0x getCodeResponse when there is data and but the to address is not a contract address', async function () {
      const result = await txController._determineTransactionCategory({
        to: '0x9e673399f795D01116e9A8B2dD2F156705131ee9',
        data: '0xabd',
      })
      assert.deepEqual(result, { transactionCategory: SEND_ETHER_ACTION_KEY, getCodeResponse: '0x' })
    })

    it('should return a simple send transactionCategory with a null getCodeResponse when to is truthy and there is data and but getCode returns an error', async function () {
      const result = await txController._determineTransactionCategory({
        to: '0xabc',
        data: '0xabd',
      })
      assert.deepEqual(result, { transactionCategory: SEND_ETHER_ACTION_KEY, getCodeResponse: null })
    })

    it('should return a contract interaction transactionCategory with the correct getCodeResponse when to is truthy and there is data and it is not a token transaction', async function () {
      const _providerResultStub = {
        // 1 gwei
        eth_gasPrice: '0x0de0b6b3a7640000',
        // by default, all accounts are external accounts (not contracts)
        eth_getCode: '0xa',
      }
      const _provider = createTestProviderTools({ scaffold: _providerResultStub }).provider
      const _fromAccount = getTestAccounts()[0]
      const _blockTrackerStub = new EventEmitter()
      _blockTrackerStub.getCurrentBlock = noop
      _blockTrackerStub.getLatestBlock = noop
      const _txController = new TransactionController({
        provider: _provider,
        getGasPrice: function () { return '0xee6b2800' },
        networkStore: new ObservableStore(currentNetworkId),
        txHistoryLimit: 10,
        blockTracker: _blockTrackerStub,
        signTransaction: (ethTx) => new Promise((resolve) => {
          ethTx.sign(_fromAccount.key)
          resolve()
        }),
      })
      const result = await _txController._determineTransactionCategory({
        to: '0x9e673399f795D01116e9A8B2dD2F156705131ee9',
        data: 'abd',
      })
      assert.deepEqual(result, { transactionCategory: CONTRACT_INTERACTION_KEY, getCodeResponse: '0x0a' })
    })

    it('should return a contract interaction transactionCategory with the correct getCodeResponse when to is a contract address and data is falsey', async function () {
      const _providerResultStub = {
        // 1 gwei
        eth_gasPrice: '0x0de0b6b3a7640000',
        // by default, all accounts are external accounts (not contracts)
        eth_getCode: '0xa',
      }
      const _provider = createTestProviderTools({ scaffold: _providerResultStub }).provider
      const _fromAccount = getTestAccounts()[0]
      const _blockTrackerStub = new EventEmitter()
      _blockTrackerStub.getCurrentBlock = noop
      _blockTrackerStub.getLatestBlock = noop
      const _txController = new TransactionController({
        provider: _provider,
        getGasPrice: function () { return '0xee6b2800' },
        networkStore: new ObservableStore(currentNetworkId),
        txHistoryLimit: 10,
        blockTracker: _blockTrackerStub,
        signTransaction: (ethTx) => new Promise((resolve) => {
          ethTx.sign(_fromAccount.key)
          resolve()
        }),
      })
      const result = await _txController._determineTransactionCategory({
        to: '0x9e673399f795D01116e9A8B2dD2F156705131ee9',
        data: '',
      })
      assert.deepEqual(result, { transactionCategory: CONTRACT_INTERACTION_KEY, getCodeResponse: '0x0a' })
    })
  })

  describe('#getPendingTransactions', function () {
    beforeEach(function () {
      txController.txStateManager._saveTxList([
        { id: 1, status: 'unapproved', metamaskNetworkId: currentNetworkId, txParams: {} },
        { id: 2, status: 'rejected', metamaskNetworkId: currentNetworkId, txParams: {}, history: [{}] },
        { id: 3, status: 'approved', metamaskNetworkId: currentNetworkId, txParams: {}, history: [{}] },
        { id: 4, status: 'signed', metamaskNetworkId: currentNetworkId, txParams: {}, history: [{}] },
        { id: 5, status: 'submitted', metamaskNetworkId: currentNetworkId, txParams: {}, history: [{}] },
        { id: 6, status: 'confirmed', metamaskNetworkId: currentNetworkId, txParams: {}, history: [{}] },
        { id: 7, status: 'failed', metamaskNetworkId: currentNetworkId, txParams: {}, history: [{}] },
      ])
    })
    it('should show only submitted and approved transactions as pending transasction', function () {
      assert(txController.pendingTxTracker.getPendingTransactions().length, 2)
      const states = txController.pendingTxTracker.getPendingTransactions().map(tx => tx.status)
      assert(states.includes('approved'), 'includes approved')
      assert(states.includes('submitted'), 'includes submitted')
    })
  })
})
