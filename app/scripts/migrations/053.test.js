import { TRANSACTION_TYPES } from '../../../shared/constants/transaction';
import migration53 from './053';

const SENT_ETHER = 'sentEther'; // a legacy transaction type replaced now by TRANSACTION_TYPES.SIMPLE_SEND

describe('migration #53', () => {
  it('should update the version metadata', async () => {
    const oldStorage = {
      meta: {
        version: 52,
      },
      data: {},
    };

    const newStorage = await migration53.migrate(oldStorage);
    expect(newStorage.meta).toStrictEqual({
      version: 53,
    });
  });

  it('should update type of standard transactions', async () => {
    const oldStorage = {
      meta: {},
      data: {
        TransactionController: {
          transactions: [
            {
              type: TRANSACTION_TYPES.CANCEL,
              transactionCategory: SENT_ETHER,
              txParams: { foo: 'bar' },
            },
            {
              type: 'standard',
              transactionCategory: SENT_ETHER,
              txParams: { foo: 'bar' },
            },
            {
              type: 'standard',
              transactionCategory: TRANSACTION_TYPES.CONTRACT_INTERACTION,
              txParams: { foo: 'bar' },
            },
            {
              type: TRANSACTION_TYPES.RETRY,
              transactionCategory: SENT_ETHER,
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
    expect(newStorage.data).toStrictEqual({
      TransactionController: {
        transactions: [
          { type: TRANSACTION_TYPES.CANCEL, txParams: { foo: 'bar' } },
          {
            type: SENT_ETHER,
            txParams: { foo: 'bar' },
          },
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

  it('should do nothing if transactions state does not exist', async () => {
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
    expect(oldStorage.data).toStrictEqual(newStorage.data);
  });

  it('should do nothing if transactions state is empty', async () => {
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
    expect(oldStorage.data).toStrictEqual(newStorage.data);
  });

  it('should do nothing if state is empty', async () => {
    const oldStorage = {
      meta: {},
      data: {},
    };

    const newStorage = await migration53.migrate(oldStorage);
    expect(oldStorage.data).toStrictEqual(newStorage.data);
  });
});
