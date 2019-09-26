const assert = require('assert')
const { createTestProviderTools } = require('../../../../stub/provider')
const PendingTransactionTracker = require('../../../../../app/scripts/controllers/transactions/pending-tx-tracker')
const MockTxGen = require('../../../../lib/mock-tx-gen')
const sinon = require('sinon')


describe('PendingTransactionTracker', function () {
  let pendingTxTracker, txMeta, txMetaNoHash, providerResultStub,
    provider, txMeta3, txList, knownErrors
  this.timeout(10000)

  beforeEach(function () {
    txMeta = {
      id: 1,
      hash: '0x0593ee121b92e10d63150ad08b4b8f9c7857d1bd160195ee648fb9a0f8d00eeb',
      status: 'signed',
      txParams: {
        from: '0x1678a085c290ebd122dc42cba69373b5953b831d',
        nonce: '0x1',
        value: '0xfffff',
      },
      history: [{}],
      rawTx: '0xf86c808504a817c800827b0d940c62bb85faa3311a998d3aba8098c1235c564966880de0b6b3a7640000802aa08ff665feb887a25d4099e40e11f0fef93ee9608f404bd3f853dd9e84ed3317a6a02ec9d3d1d6e176d4d2593dd760e74ccac753e6a0ea0d00cc9789d0d7ff1f471d',
    }
    txMetaNoHash = {
      id: 2,
      history: [{}],
      status: 'submitted',
      txParams: { from: '0x1678a085c290ebd122dc42cba69373b5953b831d'},
    }

    providerResultStub = {}
    provider = createTestProviderTools({ scaffold: providerResultStub }).provider

    pendingTxTracker = new PendingTransactionTracker({
      provider,
      nonceTracker: {
        getGlobalLock: async () => {
          return { releaseLock: () => {} }
        },
      },
      getPendingTransactions: () => { return [] },
      getCompletedTransactions: () => { return [] },
      publishTransaction: () => {},
      confirmTransaction: () => {},
    })

    pendingTxTracker._getBlock = (blockNumber) => { return {number: blockNumber, transactions: []} }
  })

  describe('_checkPendingTx state management', function () {
    let stub

    afterEach(function () {
      if (stub) {
        stub.restore()
      }
    })

    it('should emit dropped if another tx with the same nonce succeeds', async function () {

      // SETUP
      const txGen = new MockTxGen()

      txGen.generate({
        id: '456',
        value: '0x01',
        hash: '0xbad',
        status: 'confirmed',
        nonce: '0x01',
      }, { count: 1 })

      const pending = txGen.generate({
        id: '123',
        value: '0x02',
        hash: '0xfad',
        status: 'submitted',
        nonce: '0x01',
      }, { count: 1 })[0]

      stub = sinon.stub(pendingTxTracker, 'getCompletedTransactions')
        .returns(txGen.txs)

      // THE EXPECTATION
      const spy = sinon.spy()
      pendingTxTracker.on('tx:dropped', (txId) => {
        assert.equal(txId, pending.id, 'should fail the pending tx')
        spy(txId)
      })

      // THE METHOD
      await pendingTxTracker._checkPendingTx(pending)

      // THE ASSERTION
      assert.ok(spy.calledWith(pending.id), 'tx dropped should be emitted')
    })
  })

  describe('#_checkPendingTx', function () {
    it('should emit \'tx:failed\' if the txMeta does not have a hash', function (done) {
      pendingTxTracker.once('tx:failed', (txId) => {
        assert(txId, txMetaNoHash.id, 'should pass txId')
        done()
      })
      pendingTxTracker._checkPendingTx(txMetaNoHash)
    })

    it('should emit tx:dropped with the txMetas id only after the second call', function (done) {
      txMeta = {
        id: 1,
        hash: '0x0593ee121b92e10d63150ad08b4b8f9c7857d1bd160195ee648fb9a0f8d00eeb',
        status: 'submitted',
        txParams: {
          from: '0x1678a085c290ebd122dc42cba69373b5953b831d',
          nonce: '0x1',
          value: '0xfffff',
        },
        history: [{}],
        rawTx: '0xf86c808504a817c800827b0d940c62bb85faa3311a998d3aba8098c1235c564966880de0b6b3a7640000802aa08ff665feb887a25d4099e40e11f0fef93ee9608f404bd3f853dd9e84ed3317a6a02ec9d3d1d6e176d4d2593dd760e74ccac753e6a0ea0d00cc9789d0d7ff1f471d',
      }

      providerResultStub['eth_getTransactionCount'] = '0x02'
      providerResultStub['eth_getTransactionByHash'] = {}
      pendingTxTracker.once('tx:dropped', (id) => {
        if (id === txMeta.id) {
          delete providerResultStub['eth_getTransactionCount']
          delete providerResultStub['eth_getTransactionByHash']
          return done()
        } else {
          done(new Error('wrong tx Id'))
        }
      })

      pendingTxTracker._checkPendingTx(txMeta).then(() => {
        pendingTxTracker._checkPendingTx(txMeta).catch(done)
      }).catch(done)
    })


    it('should should return if query does not return txParams', function () {
      providerResultStub.eth_getTransactionByHash = null
      pendingTxTracker._checkPendingTx(txMeta)
    })
  })

  describe('#_checkPendingTxs', function () {
    beforeEach(function () {
      const txMeta2 = txMeta3 = txMeta
      txMeta2.id = 2
      txMeta3.id = 3
      txList = [txMeta, txMeta2, txMeta3].map((tx) => {
        tx.processed = new Promise((resolve) => { tx.resolve = resolve })
        return tx
      })
    })

    it('should warp all txMeta\'s in #updatePendingTxs', function (done) {
      pendingTxTracker.getPendingTransactions = () => txList
      pendingTxTracker._checkPendingTx = (tx) => { tx.resolve(tx) }
      Promise.all(txList.map((tx) => tx.processed))
        .then(() => done())
        .catch(done)

      pendingTxTracker.updatePendingTxs()
    })
  })

  describe('#resubmitPendingTxs', function () {
    const blockNumberStub = '0x0'
    beforeEach(function () {
      const txMeta2 = txMeta3 = txMeta
      txList = [txMeta, txMeta2, txMeta3].map((tx) => {
        tx.processed = new Promise((resolve) => { tx.resolve = resolve })
        return tx
      })
    })

    it('should return if no pending transactions', function () {
      pendingTxTracker.resubmitPendingTxs()
    })
    it('should call #_resubmitTx for all pending tx\'s', function (done) {
      pendingTxTracker.getPendingTransactions = () => txList
      pendingTxTracker._resubmitTx = async (tx) => { tx.resolve(tx) }
      Promise.all(txList.map((tx) => tx.processed))
        .then(() => done())
        .catch(done)
      pendingTxTracker.resubmitPendingTxs(blockNumberStub)
    })
    it('should not emit \'tx:failed\' if the txMeta throws a known txError', function (done) {
      knownErrors = [
        // geth
        '     Replacement transaction Underpriced            ',
        '       known transaction',
        // parity
        'Gas price too low to replace     ',
        '     transaction with the sAme hash was already imported',
        // other
        '       gateway timeout',
        '         noncE too low       ',
      ]
      const enoughForAllErrors = txList.concat(txList)

      pendingTxTracker.on('tx:failed', (_, err) => done(err))

      pendingTxTracker.getPendingTransactions = () => enoughForAllErrors
      pendingTxTracker._resubmitTx = async (tx) => {
        tx.resolve()
        throw new Error(knownErrors.pop())
      }
      Promise.all(txList.map((tx) => tx.processed))
        .then(() => done())
        .catch(done)

      pendingTxTracker.resubmitPendingTxs(blockNumberStub)
    })
    it('should emit \'tx:warning\' if it encountered a real error', function (done) {
      pendingTxTracker.once('tx:warning', (txMeta, err) => {
        if (err.message === 'im some real error') {
          const matchingTx = txList.find(tx => tx.id === txMeta.id)
          matchingTx.resolve()
        } else {
          done(err)
        }
      })

      pendingTxTracker.getPendingTransactions = () => txList
      pendingTxTracker._resubmitTx = async () => { throw new TypeError('im some real error') }
      Promise.all(txList.map((tx) => tx.processed))
        .then(() => done())
        .catch(done)

      pendingTxTracker.resubmitPendingTxs(blockNumberStub)
    })
  })
  describe('#_resubmitTx', function () {
    const mockFirstRetryBlockNumber = '0x1'
    let txMetaToTestExponentialBackoff, enoughBalance

    beforeEach(() => {
      pendingTxTracker.getBalance = (address) => {
        assert.equal(address, txMeta.txParams.from, 'Should pass the address')
        return enoughBalance
      }
      pendingTxTracker.publishTransaction = async (rawTx) => {
        assert.equal(rawTx, txMeta.rawTx, 'Should pass the rawTx')
      }
      pendingTxTracker.approveTransaction = async () => {}
      sinon.spy(pendingTxTracker, 'publishTransaction')

      txMetaToTestExponentialBackoff = Object.assign({}, txMeta, {
        retryCount: 4,
        firstRetryBlockNumber: mockFirstRetryBlockNumber,
      })
    })

    afterEach(() => {
      pendingTxTracker.publishTransaction.restore()
    })

    it('should publish the transaction', function (done) {
      enoughBalance = '0x100000'

      // Stubbing out current account state:
      // Adding the fake tx:
      pendingTxTracker._resubmitTx(txMeta)
        .then(() => done())
        .catch((err) => {
          assert.ifError(err, 'should not throw an error')
          done(err)
        })

      assert.equal(pendingTxTracker.publishTransaction.callCount, 1, 'Should call publish transaction')
    })

    it('should not publish the transaction if the limit of retries has been exceeded', function (done) {
      enoughBalance = '0x100000'
      const mockLatestBlockNumber = '0x5'

      pendingTxTracker._resubmitTx(txMetaToTestExponentialBackoff, mockLatestBlockNumber)
        .then(() => done())
        .catch((err) => {
          assert.ifError(err, 'should not throw an error')
          done(err)
        })

      assert.equal(pendingTxTracker.publishTransaction.callCount, 0, 'Should NOT call publish transaction')
    })

    it('should publish the transaction if the number of blocks since last retry exceeds the last set limit', function (done) {
      enoughBalance = '0x100000'
      const mockLatestBlockNumber = '0x11'

      pendingTxTracker._resubmitTx(txMetaToTestExponentialBackoff, mockLatestBlockNumber)
        .then(() => done())
        .catch((err) => {
          assert.ifError(err, 'should not throw an error')
          done(err)
        })

      assert.equal(pendingTxTracker.publishTransaction.callCount, 1, 'Should call publish transaction')
    })

    it('should call opts.approveTransaction with the id if the tx is not signed', async () => {
      const stubTx = {
        id: 40,
      }
      const approveMock = sinon.stub(pendingTxTracker, 'approveTransaction')

      pendingTxTracker._resubmitTx(stubTx)

      assert.ok(approveMock.called)
      approveMock.restore()
    })
  })

  describe('#_checkIftxWasDropped', () => {
    const txMeta = {
      id: 1,
      hash: '0x0593ee121b92e10d63150ad08b4b8f9c7857d1bd160195ee648fb9a0f8d00eeb',
      status: 'submitted',
      txParams: {
        from: '0x1678a085c290ebd122dc42cba69373b5953b831d',
        nonce: '0x1',
        value: '0xfffff',
      },
      rawTx: '0xf86c808504a817c800827b0d940c62bb85faa3311a998d3aba8098c1235c564966880de0b6b3a7640000802aa08ff665feb887a25d4099e40e11f0fef93ee9608f404bd3f853dd9e84ed3317a6a02ec9d3d1d6e176d4d2593dd760e74ccac753e6a0ea0d00cc9789d0d7ff1f471d',
    }
    it('should return false when the nonce is the suggested network nonce', (done) => {
      providerResultStub['eth_getTransactionCount'] = '0x01'
      providerResultStub['eth_getTransactionByHash'] = {}
      pendingTxTracker._checkIftxWasDropped(txMeta).then((dropped) => {
        assert(!dropped, 'should be false')
        done()
      }).catch(done)
    })

    it('should return true when the network nonce is higher then the txMeta nonce', function (done) {
      providerResultStub['eth_getTransactionCount'] = '0x02'
      providerResultStub['eth_getTransactionByHash'] = {}
      pendingTxTracker._checkIftxWasDropped(txMeta).then((dropped) => {
        assert(dropped, 'should be true')
        done()
      }).catch(done)
    })
  })

  describe('#_checkIfNonceIsTaken', function () {
    beforeEach(function () {
      const confirmedTxList = [{
        id: 1,
        hash: '0x0593ee121b92e10d63150ad08b4b8f9c7857d1bd160195ee648fb9a0f8d00eeb',
        status: 'confirmed',
        txParams: {
          from: '0x1678a085c290ebd122dc42cba69373b5953b831d',
          nonce: '0x1',
          value: '0xfffff',
        },
        rawTx: '0xf86c808504a817c800827b0d940c62bb85faa3311a998d3aba8098c1235c564966880de0b6b3a7640000802aa08ff665feb887a25d4099e40e11f0fef93ee9608f404bd3f853dd9e84ed3317a6a02ec9d3d1d6e176d4d2593dd760e74ccac753e6a0ea0d00cc9789d0d7ff1f471d',
      }, {
        id: 2,
        hash: '0x0593ee121b92e10d63150ad08b4b8f9c7857d1bd160195ee648fb9a0f8d00eeb',
        status: 'confirmed',
        txParams: {
          from: '0x1678a085c290ebd122dc42cba69373b5953b831d',
          nonce: '0x2',
          value: '0xfffff',
        },
        rawTx: '0xf86c808504a817c800827b0d940c62bb85faa3311a998d3aba8098c1235c564966880de0b6b3a7640000802aa08ff665feb887a25d4099e40e11f0fef93ee9608f404bd3f853dd9e84ed3317a6a02ec9d3d1d6e176d4d2593dd760e74ccac753e6a0ea0d00cc9789d0d7ff1f471d',
      }]
      pendingTxTracker.getCompletedTransactions = (address) => {
        if (!address) throw new Error('unless behavior has changed #_checkIfNonceIsTaken needs a filtered list of transactions to see if the nonce is taken')
        return confirmedTxList
      }
    })

    it('should return false if nonce has not been taken', function (done) {
      pendingTxTracker._checkIfNonceIsTaken({
        txParams: {
          from: '0x1678a085c290ebd122dc42cba69373b5953b831d',
          nonce: '0x3',
          value: '0xfffff',
        },
      })
        .then((taken) => {
          assert.ok(!taken)
          done()
        })
        .catch(done)
    })

    it('should return true if nonce has been taken', function (done) {
      pendingTxTracker._checkIfNonceIsTaken({
        txParams: {
          from: '0x1678a085c290ebd122dc42cba69373b5953b831d',
          nonce: '0x2',
          value: '0xfffff',
        },
      }).then((taken) => {
        assert.ok(taken)
        done()
      })
        .catch(done)
    })
  })
})
