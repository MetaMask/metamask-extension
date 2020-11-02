import { strict as assert } from 'assert'
import sinon from 'sinon'
import BN from 'bn.js'
import PendingTransactionTracker from '../../../../../app/scripts/controllers/transactions/pending-tx-tracker'

describe('PendingTransactionTracker', function () {
  describe('#resubmitPendingTxs', function () {
    it('should return early if there are no pending transactions', async function () {
      const getPendingTransactions = sinon.stub().returns([])
      const pendingTxTracker = new PendingTransactionTracker({
        query: {
          getTransactionReceipt: sinon.stub(),
        },
        nonceTracker: {
          getGlobalLock: sinon.stub().resolves({
            releaseLock: sinon.spy(),
          }),
        },
        getPendingTransactions,
        getCompletedTransactions: sinon.stub().returns([]),
        approveTransaction: sinon.spy(),
        publishTransaction: sinon.spy(),
        confirmTransaction: sinon.spy(),
      })
      const resubmitTx = sinon.stub(pendingTxTracker, '_resubmitTx').rejects()
      const warningListener = sinon.spy()

      pendingTxTracker.on('tx:warning', warningListener)
      await pendingTxTracker.resubmitPendingTxs('0x1')

      assert.ok(
        getPendingTransactions.calledOnceWithExactly(),
        'should call getPendingTransaction',
      )
      assert.ok(resubmitTx.notCalled, 'should NOT call _resubmitTx')
      assert.ok(warningListener.notCalled, "should NOT emit 'tx:warning'")
    })

    it('should resubmit each pending transaction', async function () {
      const getPendingTransactions = sinon.stub().returns([
        {
          id: 1,
        },
        {
          id: 2,
        },
      ])
      const pendingTxTracker = new PendingTransactionTracker({
        query: {
          getTransactionReceipt: sinon.stub(),
        },
        nonceTracker: {
          getGlobalLock: sinon.stub().resolves({
            releaseLock: sinon.spy(),
          }),
        },
        getPendingTransactions,
        getCompletedTransactions: sinon.stub().returns([]),
        approveTransaction: sinon.spy(),
        publishTransaction: sinon.spy(),
        confirmTransaction: sinon.spy(),
      })
      const resubmitTx = sinon.stub(pendingTxTracker, '_resubmitTx').resolves()
      const warningListener = sinon.spy()

      pendingTxTracker.on('tx:warning', warningListener)
      await pendingTxTracker.resubmitPendingTxs('0x1')

      assert.ok(
        getPendingTransactions.calledOnceWithExactly(),
        'should call getPendingTransaction',
      )
      assert.ok(resubmitTx.calledTwice, 'should call _resubmitTx')
      assert.ok(warningListener.notCalled, "should NOT emit 'tx:warning'")
    })

    it("should NOT emit 'tx:warning' for known failed resubmission", async function () {
      const getPendingTransactions = sinon.stub().returns([
        {
          id: 1,
        },
      ])
      const pendingTxTracker = new PendingTransactionTracker({
        query: {
          getTransactionReceipt: sinon.stub(),
        },
        nonceTracker: {
          getGlobalLock: sinon.stub().resolves({
            releaseLock: sinon.spy(),
          }),
        },
        getPendingTransactions,
        getCompletedTransactions: sinon.stub().returns([]),
        approveTransaction: sinon.spy(),
        publishTransaction: sinon.spy(),
        confirmTransaction: sinon.spy(),
      })
      const resubmitTx = sinon
        .stub(pendingTxTracker, '_resubmitTx')
        .rejects({ message: 'known transaction' })
      const warningListener = sinon.spy()

      pendingTxTracker.on('tx:warning', warningListener)
      await pendingTxTracker.resubmitPendingTxs('0x1')

      assert.ok(
        getPendingTransactions.calledOnceWithExactly(),
        'should call getPendingTransaction',
      )
      assert.ok(resubmitTx.calledOnce, 'should call _resubmitTx')
      assert.ok(warningListener.notCalled, "should NOT emit 'tx:warning'")
    })

    it("should emit 'tx:warning' for unknown failed resubmission", async function () {
      const getPendingTransactions = sinon.stub().returns([
        {
          id: 1,
        },
      ])
      const pendingTxTracker = new PendingTransactionTracker({
        query: {
          getTransactionReceipt: sinon.stub(),
        },
        nonceTracker: {
          getGlobalLock: sinon.stub().resolves({
            releaseLock: sinon.spy(),
          }),
        },
        getPendingTransactions,
        getCompletedTransactions: sinon.stub().returns([]),
        approveTransaction: sinon.spy(),
        publishTransaction: sinon.spy(),
        confirmTransaction: sinon.spy(),
      })
      const resubmitTx = sinon
        .stub(pendingTxTracker, '_resubmitTx')
        .rejects({ message: 'who dis' })
      const warningListener = sinon.spy()

      pendingTxTracker.on('tx:warning', warningListener)
      await pendingTxTracker.resubmitPendingTxs('0x1')

      assert.ok(
        getPendingTransactions.calledOnceWithExactly(),
        'should call getPendingTransaction',
      )
      assert.ok(resubmitTx.calledOnce, 'should call _resubmitTx')
      assert.ok(warningListener.calledOnce, "should emit 'tx:warning'")
    })
  })

  describe('#updatePendingTxs', function () {
    it('should call _checkPendingTx for each pending transaction', async function () {
      const txMeta = {
        id: 1,
        hash:
          '0x0593ee121b92e10d63150ad08b4b8f9c7857d1bd160195ee648fb9a0f8d00eeb',
        status: 'signed',
        txParams: {
          from: '0x1678a085c290ebd122dc42cba69373b5953b831d',
          nonce: '0x1',
          value: '0xfffff',
        },
        history: [{}],
        rawTx:
          '0xf86c808504a817c800827b0d940c62bb85faa3311a998d3aba8098c1235c564966880de0b6b3a7640000802aa08ff665feb887a25d4099e40e11f0fef93ee9608f404bd3f853dd9e84ed3317a6a02ec9d3d1d6e176d4d2593dd760e74ccac753e6a0ea0d00cc9789d0d7ff1f471d',
      }
      const txList = [1, 2, 3].map((id) => ({ ...txMeta, id }))
      const pendingTxTracker = new PendingTransactionTracker({
        query: {
          getTransactionReceipt: sinon.stub(),
        },
        nonceTracker: {
          getGlobalLock: async () => {
            return { releaseLock: () => undefined }
          },
        },
        getPendingTransactions: () => txList,
        getCompletedTransactions: () => {
          return []
        },
        publishTransaction: () => undefined,
        confirmTransaction: () => undefined,
      })

      const checkPendingTxStub = sinon
        .stub(pendingTxTracker, '_checkPendingTx')
        .resolves()
      await pendingTxTracker.updatePendingTxs()

      assert.ok(checkPendingTxStub.calledThrice)
      assert.ok(
        checkPendingTxStub.firstCall.calledWithExactly(
          sinon.match.has('id', 1),
        ),
      )
      assert.ok(
        checkPendingTxStub.secondCall.calledWithExactly(
          sinon.match.has('id', 2),
        ),
      )
      assert.ok(
        checkPendingTxStub.thirdCall.calledWithExactly(
          sinon.match.has('id', 3),
        ),
      )
    })
  })

  describe('#_resubmitTx', function () {
    it('should publish a new transaction', async function () {
      const txMeta = {
        id: 1,
        hash:
          '0x0593ee121b92e10d63150ad08b4b8f9c7857d1bd160195ee648fb9a0f8d00eeb',
        status: 'signed',
        txParams: {
          from: '0x1678a085c290ebd122dc42cba69373b5953b831d',
          nonce: '0x1',
          value: '0xfffff',
        },
        history: [{}],
        rawTx:
          '0xf86c808504a817c80086a02ec9d3d1d6e176d4d2593dd760e74ccac753e6a0ea0d00cc9789d0d7ff1f471d',
      }
      const approveTransaction = sinon.spy()
      const publishTransaction = sinon.spy()
      const pendingTxTracker = new PendingTransactionTracker({
        query: {
          getTransactionReceipt: sinon.stub(),
        },
        nonceTracker: {
          getGlobalLock: sinon.stub().resolves({
            releaseLock: sinon.spy(),
          }),
        },
        getPendingTransactions: sinon.stub().returns([]),
        getCompletedTransactions: sinon.stub().returns([]),
        approveTransaction,
        publishTransaction,
        confirmTransaction: sinon.spy(),
      })

      await pendingTxTracker._resubmitTx(txMeta)

      assert.ok(
        publishTransaction.calledOnceWithExactly(txMeta.rawTx),
        'should call publish transaction with the rawTx',
      )
      assert.ok(
        approveTransaction.notCalled,
        'should NOT try to approve transaction',
      )
    })

    it('should publish the given transaction if more than 2**retryCount blocks have passed', async function () {
      const txMeta = {
        id: 1,
        hash:
          '0x0593ee121b92e10d63150ad08b4b8f9c7857d1bd160195ee648fb9a0f8d00eeb',
        status: 'signed',
        txParams: {
          from: '0x1678a085c290ebd122dc42cba69373b5953b831d',
          nonce: '0x1',
          value: '0xfffff',
        },
        history: [{}],
        rawTx:
          '0xf86c808504a817c800827b0d940c62bb85faa3311a996e176d4d2593dd760e74ccac753e6a0ea0d00cc9789d0d7ff1f471d',
        retryCount: 4,
        firstRetryBlockNumber: '0x1',
      }
      const approveTransaction = sinon.spy()
      const publishTransaction = sinon.spy()
      const pendingTxTracker = new PendingTransactionTracker({
        query: {
          getTransactionReceipt: sinon.stub(),
        },
        nonceTracker: {
          getGlobalLock: sinon.stub().resolves({
            releaseLock: sinon.spy(),
          }),
        },
        getPendingTransactions: sinon.stub().returns([]),
        getCompletedTransactions: sinon.stub().returns([]),
        publishTransaction,
        approveTransaction,
        confirmTransaction: sinon.spy(),
      })

      await pendingTxTracker._resubmitTx(txMeta, '0x11' /* 16 */)

      assert.ok(
        publishTransaction.calledOnceWithExactly(txMeta.rawTx),
        'should try to publish transaction',
      )
      assert.ok(
        approveTransaction.notCalled,
        'should NOT try to approve transaction',
      )
    })

    it('should NOT publish the given transaction if fewer than 2**retryCount blocks have passed', async function () {
      const txMeta = {
        id: 1,
        hash:
          '0x0593ee121b92e10d63150ad08b4b8f9c7857d1bd160195ee648fb9a0f8d00eeb',
        status: 'signed',
        txParams: {
          from: '0x1678a085c290ebd122dc42cba69373b5953b831d',
          nonce: '0x1',
          value: '0xfffff',
        },
        history: [{}],
        rawTx:
          '0xf86c808504a817c800827b0d940c62bb85faa3311a996e176d4d2593dd760e74ccac753e6a0ea0d00cc9789d0d7ff1f471d',
        retryCount: 4,
        firstRetryBlockNumber: '0x1',
      }
      const approveTransaction = sinon.spy()
      const publishTransaction = sinon.spy()
      const pendingTxTracker = new PendingTransactionTracker({
        query: {
          getTransactionReceipt: sinon.stub(),
        },
        nonceTracker: {
          getGlobalLock: sinon.stub().resolves({
            releaseLock: sinon.spy(),
          }),
        },
        getPendingTransactions: sinon.stub().returns([]),
        getCompletedTransactions: sinon.stub().returns([]),
        publishTransaction,
        approveTransaction,
        confirmTransaction: sinon.spy(),
      })

      await pendingTxTracker._resubmitTx(txMeta, '0x5')

      assert.ok(
        publishTransaction.notCalled,
        'should NOT try to publish transaction',
      )
      assert.ok(
        approveTransaction.notCalled,
        'should NOT try to approve transaction',
      )
    })

    it('should call approveTransaction if the tx is not yet signed', async function () {
      const approveTransaction = sinon.spy()
      const publishTransaction = sinon.spy()
      const pendingTxTracker = new PendingTransactionTracker({
        query: {
          getTransactionReceipt: sinon.stub(),
        },
        nonceTracker: {
          getGlobalLock: sinon.stub().resolves({
            releaseLock: sinon.spy(),
          }),
        },
        getPendingTransactions: sinon.stub().returns([]),
        getCompletedTransactions: sinon.stub().returns([]),
        approveTransaction,
        publishTransaction,
        confirmTransaction: sinon.spy(),
      })

      await pendingTxTracker._resubmitTx({ id: 40 })

      assert.ok(
        approveTransaction.calledOnceWithExactly(40),
        'should call approveTransaction with the tx ID',
      )
      assert.ok(
        publishTransaction.notCalled,
        'should NOT try to publish transaction',
      )
    })
  })

  describe('#_checkIfTxWasDropped', function () {
    it('should return true when the given nonce is lower than the network nonce', async function () {
      const nonceBN = new BN(2)
      const pendingTxTracker = new PendingTransactionTracker({
        query: {
          getTransactionReceipt: sinon.stub(),
          getTransactionCount: sinon.stub().resolves(nonceBN),
        },
        nonceTracker: {
          getGlobalLock: sinon.stub().resolves({
            releaseLock: sinon.spy(),
          }),
        },
        getPendingTransactions: sinon.stub().returns([]),
        getCompletedTransactions: sinon.stub().returns([]),
        publishTransaction: sinon.spy(),
        confirmTransaction: sinon.spy(),
      })

      pendingTxTracker.DROPPED_BUFFER_COUNT = 0

      assert.ok(
        await pendingTxTracker._checkIfTxWasDropped({
          id: 1,
          hash:
            '0x0593ee121b92e10d63150ad08b4b8f9c7857d1bd160195ee648fb9a0f8d00eeb',
          status: 'submitted',
          txParams: {
            from: '0x1678a085c290ebd122dc42cba69373b5953b831d',
            nonce: '0x1',
            value: '0xfffff',
          },
          rawTx: '0xf86c808504a817c800827b0d940c62bba0ea0d00cc9789d0d7ff1f471d',
        }),
      )
    })

    it('should return false when the given nonce is the network nonce', async function () {
      const nonceBN = new BN(1)
      const pendingTxTracker = new PendingTransactionTracker({
        query: {
          getTransactionReceipt: sinon.stub(),
          getTransactionCount: sinon.stub().resolves(nonceBN),
        },
        nonceTracker: {
          getGlobalLock: sinon.stub().resolves({
            releaseLock: sinon.spy(),
          }),
        },
        getPendingTransactions: sinon.stub().returns([]),
        getCompletedTransactions: sinon.stub().returns([]),
        publishTransaction: sinon.spy(),
        confirmTransaction: sinon.spy(),
      })

      const dropped = await pendingTxTracker._checkIfTxWasDropped({
        id: 1,
        hash:
          '0x0593ee121b92e10d63150ad08b4b8f9c7857d1bd160195ee648fb9a0f8d00eeb',
        status: 'submitted',
        txParams: {
          from: '0x1678a085c290ebd122dc42cba69373b5953b831d',
          nonce: '0x1',
          value: '0xfffff',
        },
        rawTx:
          '0xf86c808504a89e84ed3317a6a02ec9d3d1d6e176d4d2593dd760e74ccac753e6a0ea0d00cc9789d0d7ff1f471d',
      })

      assert.ok(!dropped, 'should be false')
    })
  })

  describe('#_checkIfNonceIsTaken', function () {
    it('should return false if the given nonce is not taken', async function () {
      const confirmedTxList = [
        {
          id: 1,
          hash:
            '0x0593ee121b92e10d63150ad08b4b8f9c7857d1bd160195ee648fb9a0f8d00eeb',
          status: 'confirmed',
          txParams: {
            from: '0x1678a085c290ebd122dc42cba69373b5953b831d',
            nonce: '0x1',
            value: '0xfffff',
          },
          rawTx:
            '0xf86c808504a817c800827b0d940c62bb85fa3320e74ccac753e6a0ea0d00cc9789d0d7ff1f471d',
        },
        {
          id: 2,
          hash:
            '0x0593ee121b92e10d63150ad08b4b8f9c7857d1bd160195ee648fb9a0f8d00eeb',
          status: 'confirmed',
          txParams: {
            from: '0x1678a085c290ebd122dc42cba69373b5953b831d',
            nonce: '0x2',
            value: '0xfffff',
          },
          rawTx:
            '0xf86c808507a6a02ec9d3d1d6e176d4d2593dd760e74ccac753e6a0ea0d00cc9789d0d7ff1f471d',
        },
      ]
      const getCompletedTransactions = sinon.stub().returns(confirmedTxList)
      const pendingTxTracker = new PendingTransactionTracker({
        query: sinon.spy(),
        nonceTracker: {
          getGlobalLock: sinon.stub().resolves({
            releaseLock: sinon.spy(),
          }),
        },
        getPendingTransactions: sinon.stub().returns([]),
        getCompletedTransactions,
        publishTransaction: sinon.spy(),
        confirmTransaction: sinon.spy(),
      })

      const taken = await pendingTxTracker._checkIfNonceIsTaken({
        txParams: {
          from: '0x1678a085c290ebd122dc42cba69373b5953b831d',
          nonce: '0x3',
          value: '0xfffff',
        },
      })

      assert.ok(
        getCompletedTransactions.calledOnceWithExactly(
          '0x1678a085c290ebd122dc42cba69373b5953b831d',
        ),
      )
      assert.ok(!taken)
    })

    it('should return true if the nonce is taken', async function () {
      const confirmedTxList = [
        {
          id: 1,
          hash:
            '0x0593ee121b92e10d63150ad08b4b8f9c7857d1bd160195ee648fb9a0f8d00eeb',
          status: 'confirmed',
          txParams: {
            from: '0x1678a085c290ebd122dc42cba69373b5953b831d',
            nonce: '0x1',
            value: '0xfffff',
          },
          rawTx:
            '0xf86c808504a817c80082ec9d3d1d6e176d4d2593dd760e74ccac753e6a0ea0d00cc9789d0d7ff1f471d',
        },
        {
          id: 2,
          hash:
            '0x0593ee121b92e10d63150ad08b4b8f9c7857d1bd160195ee648fb9a0f8d00eeb',
          status: 'confirmed',
          txParams: {
            from: '0x1678a085c290ebd122dc42cba69373b5953b831d',
            nonce: '0x2',
            value: '0xfffff',
          },
          rawTx:
            '0xf86c808504a817c800827b0d940c62bb760e74ccac753e6a0ea0d00cc9789d0d7ff1f471d',
        },
      ]
      const getCompletedTransactions = sinon.stub().returns(confirmedTxList)
      const pendingTxTracker = new PendingTransactionTracker({
        query: sinon.spy(),
        nonceTracker: {
          getGlobalLock: sinon.stub().resolves({
            releaseLock: sinon.spy(),
          }),
        },
        getPendingTransactions: sinon.stub().returns([]),
        getCompletedTransactions,
        publishTransaction: sinon.spy(),
        confirmTransaction: sinon.spy(),
      })

      const taken = await pendingTxTracker._checkIfNonceIsTaken({
        txParams: {
          from: '0x1678a085c290ebd122dc42cba69373b5953b831d',
          nonce: '0x2',
          value: '0xfffff',
        },
      })

      assert.ok(
        getCompletedTransactions.calledOnceWithExactly(
          '0x1678a085c290ebd122dc42cba69373b5953b831d',
        ),
      )
      assert.ok(taken)
    })
  })

  describe('#_checkPendingTx', function () {
    it("should emit 'tx:warning' if getTransactionReceipt rejects", async function () {
      const txMeta = {
        id: 1,
        hash:
          '0x0593ee121b92e10d63150ad08b4b8f9c7857d1bd160195ee648fb9a0f8d00eeb',
        status: 'submitted',
        txParams: {
          from: '0x1678a085c290ebd122dc42cba69373b5953b831d',
          nonce: '0x1',
          value: '0xfffff',
        },
        history: [{}],
        rawTx: '0xf86c808504a817c80082471d',
      }
      const nonceBN = new BN(2)
      const pendingTxTracker = new PendingTransactionTracker({
        query: {
          getTransactionReceipt: sinon.stub().rejects(),
          getTransactionCount: sinon.stub().resolves(nonceBN),
        },
        nonceTracker: {
          getGlobalLock: sinon.stub().resolves({
            releaseLock: sinon.spy(),
          }),
        },
        getPendingTransactions: sinon.stub().returns([]),
        getCompletedTransactions: sinon.stub().returns([]),
        publishTransaction: sinon.spy(),
        confirmTransaction: sinon.spy(),
      })
      const listeners = {
        confirmed: sinon.spy(),
        dropped: sinon.spy(),
        failed: sinon.spy(),
        warning: sinon.spy(),
      }

      pendingTxTracker.once('tx:confirmed', listeners.confirmed)
      pendingTxTracker.once('tx:dropped', listeners.dropped)
      pendingTxTracker.once('tx:failed', listeners.failed)
      pendingTxTracker.once('tx:warning', listeners.warning)
      await pendingTxTracker._checkPendingTx(txMeta)

      assert.ok(listeners.dropped.notCalled, "should not emit 'tx:dropped")
      assert.ok(listeners.confirmed.notCalled, "should not emit 'tx:confirmed'")
      assert.ok(listeners.failed.notCalled, "should not emit 'tx:failed'")
      assert.ok(listeners.warning.calledOnce, "should emit 'tx:warning'")
    })

    it('should NOT emit anything if the tx is already not submitted', async function () {
      const pendingTxTracker = new PendingTransactionTracker({
        query: sinon.spy(),
        nonceTracker: {
          getGlobalLock: sinon.stub().resolves({
            releaseLock: sinon.spy(),
          }),
        },
        getPendingTransactions: sinon.stub().returns([]),
        getCompletedTransactions: sinon.stub().returns([]),
        publishTransaction: sinon.spy(),
        confirmTransaction: sinon.spy(),
      })
      const listeners = {
        confirmed: sinon.spy(),
        dropped: sinon.spy(),
        failed: sinon.spy(),
        warning: sinon.spy(),
      }

      pendingTxTracker.once('tx:confirmed', listeners.confirmed)
      pendingTxTracker.once('tx:dropped', listeners.dropped)
      pendingTxTracker.once('tx:failed', listeners.failed)
      pendingTxTracker.once('tx:warning', listeners.warning)
      await pendingTxTracker._checkPendingTx({
        status: 'confirmed',
        history: [{}],
        txParams: { nonce: '0x1' },
        id: '456',
        value: '0x01',
        hash: '0xbad',
      })

      assert.ok(listeners.failed.notCalled, "should not emit 'tx:failed'")
      assert.ok(listeners.confirmed.notCalled, "should not emit 'tx:confirmed'")
      assert.ok(listeners.dropped.notCalled, "should not emit 'tx:dropped'")
      assert.ok(listeners.warning.notCalled, "should not emit 'tx:warning'")
    })

    it("should emit 'tx:failed' if the txMeta does NOT have a hash", async function () {
      const pendingTxTracker = new PendingTransactionTracker({
        query: sinon.spy(),
        nonceTracker: {
          getGlobalLock: sinon.stub().resolves({
            releaseLock: sinon.spy(),
          }),
        },
        getPendingTransactions: sinon.stub().returns([]),
        getCompletedTransactions: sinon.stub().returns([]),
        publishTransaction: sinon.spy(),
        confirmTransaction: sinon.spy(),
      })
      const listeners = {
        confirmed: sinon.spy(),
        dropped: sinon.spy(),
        failed: sinon.spy(),
        warning: sinon.spy(),
      }

      pendingTxTracker.once('tx:confirmed', listeners.confirmed)
      pendingTxTracker.once('tx:dropped', listeners.dropped)
      pendingTxTracker.once('tx:failed', listeners.failed)
      pendingTxTracker.once('tx:warning', listeners.warning)
      await pendingTxTracker._checkPendingTx({
        id: '2',
        history: [{}],
        status: 'submitted',
        txParams: { from: '0x1678a085c290ebd122dc42cba69373b5953b831d' },
      })

      assert.ok(
        listeners.failed.calledOnceWithExactly(
          '2',
          sinon.match.instanceOf(Error),
        ),
        "should pass txId to 'tx:failed' listener",
      )
      assert.ok(listeners.confirmed.notCalled, "should not emit 'tx:confirmed'")
      assert.ok(listeners.dropped.notCalled, "should not emit 'tx:dropped'")
      assert.ok(listeners.warning.notCalled, "should not emit 'tx:warning'")
    })

    it("should emit 'tx:dropped' if another tx with the same nonce succeeds", async function () {
      const txs = [
        {
          status: 'confirmed',
          history: [{}],
          txParams: { nonce: '0x1' },
          id: '456',
          value: '0x01',
          hash: '0xbad',
        },
        {
          status: 'submitted',
          history: [{}],
          txParams: { nonce: '0x1' },
          id: '123',
          value: '0x02',
          hash:
            '0x2a919d2512ec963f524bfd9730fb66b6d5a2e399d1dd957abb5e2b544a12644b',
        },
      ]
      const pendingTxTracker = new PendingTransactionTracker({
        query: {
          getTransactionReceipt: sinon.stub().resolves(null),
        },
        nonceTracker: {
          getGlobalLock: sinon.stub().resolves({
            releaseLock: sinon.spy(),
          }),
        },
        getPendingTransactions: sinon.stub().returns([]),
        getCompletedTransactions: sinon.stub().returns(txs),
        publishTransaction: sinon.spy(),
        confirmTransaction: sinon.spy(),
      })
      const listeners = {
        confirmed: sinon.spy(),
        dropped: sinon.spy(),
        failed: sinon.spy(),
        warning: sinon.spy(),
      }

      pendingTxTracker.once('tx:confirmed', listeners.confirmed)
      pendingTxTracker.once('tx:dropped', listeners.dropped)
      pendingTxTracker.once('tx:failed', listeners.failed)
      pendingTxTracker.once('tx:warning', listeners.warning)
      await pendingTxTracker._checkPendingTx(txs[1])

      assert.ok(listeners.dropped.calledOnceWithExactly('123'))
      assert.ok(listeners.confirmed.notCalled, "should not emit 'tx:confirmed'")
      assert.ok(listeners.failed.notCalled, "should not emit 'tx:failed'")
      assert.ok(listeners.warning.notCalled, "should not emit 'tx:warning'")
    })

    it("should emit 'tx:dropped' with the txMetas id only after the fourth call", async function () {
      const nonceBN = new BN(2)
      const txMeta = {
        id: 1,
        hash:
          '0x0593ee121b92e10d63150ad08b4b8f9c7857d1bd160195ee648fb9a0f8d00eeb',
        status: 'submitted',
        txParams: {
          from: '0x1678a085c290ebd122dc42cba69373b5953b831d',
          nonce: '0x1',
          value: '0xfffff',
        },
        history: [{}],
        rawTx: '0xf86c808504a817c80082471d',
      }
      const pendingTxTracker = new PendingTransactionTracker({
        query: {
          getTransactionReceipt: sinon.stub().resolves(null),
          getTransactionCount: sinon.stub().resolves(nonceBN),
        },
        nonceTracker: {
          getGlobalLock: sinon.stub().resolves({
            releaseLock: sinon.spy(),
          }),
        },
        getPendingTransactions: sinon.stub().returns([]),
        getCompletedTransactions: sinon.stub().returns([]),
        publishTransaction: sinon.spy(),
        confirmTransaction: sinon.spy(),
      })
      const listeners = {
        confirmed: sinon.spy(),
        dropped: sinon.spy(),
        failed: sinon.spy(),
        warning: sinon.spy(),
      }

      pendingTxTracker.once('tx:confirmed', listeners.confirmed)
      pendingTxTracker.once('tx:dropped', listeners.dropped)
      pendingTxTracker.once('tx:failed', listeners.failed)
      pendingTxTracker.once('tx:warning', listeners.warning)
      await pendingTxTracker._checkPendingTx(txMeta)
      await pendingTxTracker._checkPendingTx(txMeta)
      await pendingTxTracker._checkPendingTx(txMeta)
      await pendingTxTracker._checkPendingTx(txMeta)

      assert.ok(listeners.dropped.calledOnceWithExactly(1))
      assert.ok(listeners.confirmed.notCalled, "should not emit 'tx:confirmed'")
      assert.ok(listeners.failed.notCalled, "should not emit 'tx:failed'")
      assert.ok(listeners.warning.notCalled, "should not emit 'tx:warning'")
    })
  })
})
