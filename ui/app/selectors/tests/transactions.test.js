import assert from 'assert'
import {
  unapprovedMessagesSelector,
  transactionsSelector,
  nonceSortedTransactionsSelector,
  nonceSortedPendingTransactionsSelector,
  nonceSortedCompletedTransactionsSelector,
  submittedPendingTransactionsSelector,
} from '../transactions'

describe('Transaction Selectors', function () {

  describe('unapprovedMessagesSelector', function () {
    it('returns eth sign msg from unapprovedMsgs', function () {

      const msg = {
        id: 1,
        msgParams: {
          from: '0xAddress',
          data: '0xData',
          origin: 'origin',
        },
        time: 1,
        status: 'unapproved',
        type: 'eth_sign',
      }

      const state = {
        metamask: {
          unapprovedMsgs: {
            1: msg,
          },
        },
      }

      const msgSelector = unapprovedMessagesSelector(state)

      assert(Array.isArray(msgSelector))
      assert.deepEqual(msgSelector, [msg])
    })

    it('returns personal sign from unapprovedPersonalMsgsSelector', function () {

      const msg = {
        id: 1,
        msgParams: {
          from: '0xAddress',
          data: '0xData',
          origin: 'origin',
        },
        time: 1,
        status: 'unapproved',
        type: 'personal_sign',
      }

      const state = {
        metamask: {
          unapprovedPersonalMsgs: {
            1: msg,
          },
        },
      }

      const msgSelector = unapprovedMessagesSelector(state)

      assert(Array.isArray(msgSelector))
      assert.deepEqual(msgSelector, [msg])
    })

    it('returns typed message from unapprovedTypedMessagesSelector', function () {

      const msg = {
        id: 1,
        msgParams: {
          data: '0xData',
          from: '0xAddress',
          version: 'V3',
          origin: 'origin',
        },
        time: 1,
        status: 'unapproved',
        type: 'eth_signTypedData',
      }

      const state = {
        metamask: {
          unapprovedTypedMessages: {
            1: msg,
          },
        },
      }

      const msgSelector = unapprovedMessagesSelector(state)

      assert(Array.isArray(msgSelector))
      assert.deepEqual(msgSelector, [msg])

    })
  })

  describe('transactionsSelector', function () {

    it('selectedAddressTxList', function () {

      const state = {
        metamask: {
          provider: {
            nickname: 'mainnet',
          },
          featureFlags: {
            showIncomingTransactions: false,
          },
          selectedAddressTxList: [
            {
              id: 0,
              time: 0,
              txParams: {
                from: '0xAddress',
                to: '0xRecipient',
              },
            },
            {
              id: 1,
              time: 1,
              txParams: {
                from: '0xAddress',
                to: '0xRecipient',
              },
            },
          ],
        },
      }

      const orderedTxlist = state.metamask.selectedAddressTxList.sort((a, b) => b.time - a.time)

      const txSelector = transactionsSelector(state)

      assert(Array.isArray(txSelector))
      assert.deepEqual(txSelector, orderedTxlist)
    })

    it('returns token tx from selectedAddressTxList when selectedTokenAddress is valid', function () {

      const state = {
        metamask: {
          provider: {
            nickname: 'mainnet',
          },
          featureFlags: {
            showIncomingTransactions: false,
          },
          selectedTokenAddress: '0xToken',
          selectedAddressTxList: [
            {
              id: 0,
              time: 0,
              txParams: {
                from: '0xAddress',
                to: '0xToken',
              },
            },
            {
              id: 1,
              time: 1,
              txParams: {
                from: '0xAddress',
                to: '0xToken',
              },
            },
          ],
        },

      }

      const orderedTxlist = state.metamask.selectedAddressTxList.sort((a, b) => b.time - a.time)

      const txSelector = transactionsSelector(state)

      assert(Array.isArray(txSelector))
      assert.deepEqual(txSelector, orderedTxlist)

    })

  })

  describe('nonceSortedTransactionsSelector', function () {

    it('returns transaction group nonce sorted tx from from selectedTxList wit', function () {

      const tx1 = {
        id: 0,
        time: 0,
        txParams: {
          from: '0xAddress',
          to: '0xRecipient',
          nonce: '0x0',
        },
      }

      const tx2 = {
        id: 1,
        time: 1,
        txParams: {
          from: '0xAddress',
          to: '0xRecipient',
          nonce: '0x1',
        },
      }

      const state = {
        metamask: {
          provider: {
            nickname: 'mainnet',
          },
          featureFlags: {
            showIncomingTransactions: false,
          },
          selectedAddressTxList: [
            tx1,
            tx2,
          ],
        },
      }

      const expectedResult = [
        {
          nonce: '0x0',
          transactions: [ tx1 ],
          initialTransaction: tx1,
          primaryTransaction: tx1,
          hasRetried: false,
          hasCancelled: false,
        },
        {
          nonce: '0x1',
          transactions: [ tx2 ],
          initialTransaction: tx2,
          primaryTransaction: tx2,
          hasRetried: false,
          hasCancelled: false,
        },
      ]

      assert.deepEqual(nonceSortedTransactionsSelector(state), expectedResult)
    })
  })

  describe('Sorting Transactions Selectors', function () {

    const submittedTx = {
      id: 0,
      time: 0,
      txParams: {
        from: '0xAddress',
        to: '0xRecipient',
        nonce: '0x0',
      },
      status: 'submitted',
    }

    const unapprovedTx = {
      id: 1,
      time: 1,
      txParams: {
        from: '0xAddress',
        to: '0xRecipient',
        nonce: '0x1',
      },
      status: 'unapproved',
    }

    const approvedTx = {
      id: 2,
      time: 2,
      txParams: {
        from: '0xAddress',
        to: '0xRecipient',
        nonce: '0x2',
      },
      status: 'approved',
    }

    const confirmedTx = {
      id: 3,
      time: 3,
      txParams: {
        from: '0xAddress',
        to: '0xRecipient',
        nonce: '0x3',
      },
      status: 'confirmed',
    }

    const state = {
      metamask: {
        provider: {
          nickname: 'mainnet',
        },
        featureFlags: {
          showIncomingTransactions: false,
        },
        selectedAddressTxList: [
          submittedTx,
          unapprovedTx,
          approvedTx,
          confirmedTx,
        ],
      },
    }

    it('nonceSortedPendingTransactionsSelector', function () {

      const expectedResult = [
        {
          nonce: submittedTx.txParams.nonce,
          transactions: [ submittedTx ],
          initialTransaction: submittedTx,
          primaryTransaction: submittedTx,
          hasRetried: false,
          hasCancelled: false,
        },
        {
          nonce: unapprovedTx.txParams.nonce,
          transactions: [ unapprovedTx ],
          initialTransaction: unapprovedTx,
          primaryTransaction: unapprovedTx,
          hasRetried: false,
          hasCancelled: false,
        },
        {
          nonce: approvedTx.txParams.nonce,
          transactions: [ approvedTx ],
          initialTransaction: approvedTx,
          primaryTransaction: approvedTx,
          hasRetried: false,
          hasCancelled: false,
        },
      ]

      assert.deepEqual(nonceSortedPendingTransactionsSelector(state), expectedResult)
    })

    it('nonceSortedCompletedTransactionsSelector', function () {

      const expectedResult = [
        {
          nonce: confirmedTx.txParams.nonce,
          transactions: [ confirmedTx ],
          initialTransaction: confirmedTx,
          primaryTransaction: confirmedTx,
          hasRetried: false,
          hasCancelled: false,
        },
      ]

      assert.deepEqual(nonceSortedCompletedTransactionsSelector(state), expectedResult)
    })

    it('submittedPendingTransactionsSelector', function () {

      const expectedResult = [ submittedTx ]
      assert.deepEqual(submittedPendingTransactionsSelector(state), expectedResult)

    })

  })

})
