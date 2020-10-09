import { strict as assert } from 'assert'
import migration49 from '../../../app/scripts/migrations/049'
import { TRANSACTION_TYPE_CANCEL, TRANSACTION_TYPE_CONTRACT_INTERACTION, TRANSACTION_TYPE_RETRY, TRANSACTION_TYPE_SENT_ETHER } from '../../../shared/constants/transaction'

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

  it('should update type of standard transactions', async function () {
    const oldStorage = {
      meta: {},
      data: {
        TransactionController: {
          transactions: [
            { type: TRANSACTION_TYPE_CANCEL, transactionCategory: TRANSACTION_TYPE_SENT_ETHER, txParams: { foo: 'bar' } },
            { type: 'standard', transactionCategory: TRANSACTION_TYPE_SENT_ETHER, txParams: { foo: 'bar' } },
            { type: 'standard', transactionCategory: TRANSACTION_TYPE_CONTRACT_INTERACTION, txParams: { foo: 'bar' } },
            { type: TRANSACTION_TYPE_RETRY, transactionCategory: TRANSACTION_TYPE_SENT_ETHER, txParams: { foo: 'bar' } },
          ],
        },
        IncomingTransactionsController: {
          incomingTransactions: {
            'test': {
              transactionCategory: 'incoming',
              txParams: {
                foo: 'bar',
              },
            },
          },
        },
        foo: 'bar',
      },
    }

    const newStorage = await migration49.migrate(oldStorage)
    assert.deepEqual(newStorage.data, {
      TransactionController: {
        transactions: [
          { type: TRANSACTION_TYPE_CANCEL, txParams: { foo: 'bar' } },
          { type: TRANSACTION_TYPE_SENT_ETHER, txParams: { foo: 'bar' } },
          { type: TRANSACTION_TYPE_CONTRACT_INTERACTION, txParams: { foo: 'bar' } },
          { type: TRANSACTION_TYPE_RETRY, txParams: { foo: 'bar' } },
        ],
      },
      IncomingTransactionsController: {
        incomingTransactions: {
          'test': {
            type: 'incoming',
            txParams: {
              foo: 'bar',
            },
          },
        },
      },
      foo: 'bar',
    })
  })

  it('should do nothing if transactions state does not exist', async function () {
    const oldStorage = {
      meta: {},
      data: {
        TransactionController: {
          bar: 'baz',
        },
        IncomingTransactionsController: {
          foo: 'baz',
        },
        foo: 'bar',
      },
    }

    const newStorage = await migration49.migrate(oldStorage)
    assert.deepEqual(oldStorage.data, newStorage.data)
  })

  it('should do nothing if transactions state is empty', async function () {
    const oldStorage = {
      meta: {},
      data: {
        TransactionController: {
          transactions: [],
          bar: 'baz',
        },
        IncomingTransactionsController: {
          incomingTransactions: {},
          baz: 'bar',
        },
        foo: 'bar',
      },
    }

    const newStorage = await migration49.migrate(oldStorage)
    assert.deepEqual(oldStorage.data, newStorage.data)
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
