import { TransactionType } from '@metamask/transaction-controller';
import migration53 from './053';

const SENT_ETHER = 'sentEther'; // a legacy transaction type replaced now by TransactionType.simpleSend

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
              type: TransactionType.cancel,
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
              transactionCategory: TransactionType.contractInteraction,
              txParams: { foo: 'bar' },
            },
            {
              type: TransactionType.retry,
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
          { type: TransactionType.cancel, txParams: { foo: 'bar' } },
          {
            type: SENT_ETHER,
            txParams: { foo: 'bar' },
          },
          {
            type: TransactionType.contractInteraction,
            txParams: { foo: 'bar' },
          },
          { type: TransactionType.retry, txParams: { foo: 'bar' } },
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
