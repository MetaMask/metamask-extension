import { strict as assert } from 'assert'
import migration49 from '../../../app/scripts/migrations/049'
import { generateMetaMaskTxId } from '../../../shared/helpers/transaction'
import state from '../../data/mock-state.json'

const testTxs = state.metamask.currentNetworkTxList
const testIncomingTxs = {}
testTxs.forEach((tx) => {
  testIncomingTxs[tx.hash] = tx
})

describe('migration #49', function () {
  it('should update the version metadata', async function () {
    const oldStorage = {
      'meta': {
        'version': 48,
      },
      'data': {},
    }

    const newStorage = await migration49.migrate(oldStorage)
    assert.deepEqual(newStorage.meta, {
      'version': 49,
    })
  })

  it('should update id in transactions', async function () {
    const oldStorage = {
      meta: {},
      data: {
        TransactionController: {
          transactions: testTxs,
        },
        IncomingTransactionsController: {
          incomingTransactions: testIncomingTxs,
        },
        foo: 'bar',
      },
    }

    const newStorage = await migration49.migrate(oldStorage)

    const newIncomingTransactionsState = {}
    Object.entries(testIncomingTxs).forEach(([key, tx]) => {
      newIncomingTransactionsState[key] = { ...tx, id: generateMetaMaskTxId(tx.txParams) }
    })
    assert.deepEqual(newStorage.data, {
      TransactionController: {
        transactions: testTxs.map((tx) => ({ ...tx, id: generateMetaMaskTxId(tx.txParams) })),
      },
      IncomingTransactionsController: {
        incomingTransactions: newIncomingTransactionsState,
      },
      foo: 'bar',
    })
  })

  it('should do nothing if state is empty', async function () {
    const oldStorage = {
      meta: {},
      data: {},
    }

    const newStorage = await migration49.migrate(oldStorage)
    assert.deepEqual(oldStorage.data, newStorage.data)
  })
})
