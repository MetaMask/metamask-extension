import { strict as assert } from 'assert';
import { TRANSACTION_TYPES } from '../../../shared/constants/transaction';
import migration53 from './053';

describe('migration #53', function () {
  it('should update the version metadata', async function () {
    const oldStorage = {
      meta: {
        version: 52,
      },
      data: {},
    };

    const newStorage = await migration53.migrate(oldStorage);
    assert.deepEqual(newStorage.meta, {
      version: 53,
    });
  });

  it('should update type of standard transactions', async function () {
    const oldStorage = {
      meta: {},
      data: {
        TransactionController: {
          transactions: [
            {
              type: TRANSACTION_TYPES.CANCEL,
              transactionCategory: TRANSACTION_TYPES.SENT_ETHER,
              txParams: { foo: 'bar' },
            },
            {
              type: 'standard',
              transactionCategory: TRANSACTION_TYPES.SENT_ETHER,
              txParams: { foo: 'bar' },
            },
            {
              type: 'standard',
              transactionCategory: TRANSACTION_TYPES.CONTRACT_INTERACTION,
              txParams: { foo: 'bar' },
            },
            {
              type: TRANSACTION_TYPES.RETRY,
              transactionCategory: TRANSACTION_TYPES.SENT_ETHER,
              txParams: { foo: 'bar' },
            },
          ],
        },
        IncomingTransactionsController: {
          incomingTransactions: {
            test: {
              transactionCategory: 'incoming',
              txParams: {
                foo: 'bar',
              },
            },
          },
        },
        foo: 'bar',
      },
    };

    const newStorage = await migration53.migrate(oldStorage);
    assert.deepEqual(newStorage.data, {
      TransactionController: {
        transactions: [
          { type: TRANSACTION_TYPES.CANCEL, txParams: { foo: 'bar' } },
          { type: TRANSACTION_TYPES.SENT_ETHER, txParams: { foo: 'bar' } },
          {
            type: TRANSACTION_TYPES.CONTRACT_INTERACTION,
            txParams: { foo: 'bar' },
          },
          { type: TRANSACTION_TYPES.RETRY, txParams: { foo: 'bar' } },
        ],
      },
      IncomingTransactionsController: {
        incomingTransactions: {
          test: {
            type: 'incoming',
            txParams: {
              foo: 'bar',
            },
          },
        },
      },
      foo: 'bar',
    });
  });

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
    };

    const newStorage = await migration53.migrate(oldStorage);
    assert.deepEqual(oldStorage.data, newStorage.data);
  });

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
    };

    const newStorage = await migration53.migrate(oldStorage);
    assert.deepEqual(oldStorage.data, newStorage.data);
  });

  it('should do nothing if state is empty', async function () {
    const oldStorage = {
      meta: {},
      data: {},
    };

    const newStorage = await migration53.migrate(oldStorage);
    assert.deepEqual(oldStorage.data, newStorage.data);
  });
});
