import { migrate, version } from './158';

describe(`migration #${version}`, () => {
  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: { version: version - 1 },
      data: {},
    };
    const newStorage = await migrate(oldStorage);
    expect(newStorage.meta).toStrictEqual({ version });
  });

  it('does nothing if MultichainTransactionsController is missing', async () => {
    const oldStorage = {
      meta: { version: version - 1 },
      data: {},
    };
    const newStorage = await migrate(oldStorage);
    expect(newStorage.data).toStrictEqual({});
  });

  it('does nothing if MultichainTransactionsController is not an object', async () => {
    const oldStorage = {
      meta: { version: version - 1 },
      data: {
        MultichainTransactionsController: 'not an object',
      },
    };
    const newStorage = await migrate(oldStorage);
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('does nothing if nonEvmTransactions is not an object', async () => {
    const oldStorage = {
      meta: { version: version - 1 },
      data: {
        MultichainTransactionsController: {
          nonEvmTransactions: 'not an object',
        },
      },
    };
    const newStorage = await migrate(oldStorage);
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('migrates transactions to the new structure with chainId nesting', async () => {
    const mockTransaction = { id: '123', type: 'send' };
    const oldStorage = {
      meta: { version: version - 1 },
      data: {
        MultichainTransactionsController: {
          nonEvmTransactions: {
            'account 1': {
              transactions: [mockTransaction],
              next: null,
              lastUpdated: 1234567890,
            },
            'account 2': {
              transactions: [],
              next: null,
              lastUpdated: 9876543210,
            },
          },
        },
      },
    };

    const expectedData = {
      MultichainTransactionsController: {
        nonEvmTransactions: {
          'account 1': {
            'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': {
              transactions: [mockTransaction],
              next: null,
              lastUpdated: 1234567890,
            },
          },
          'account 2': {
            'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': {
              transactions: [],
              next: null,
              lastUpdated: 9876543210,
            },
          },
        },
      },
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.data).toStrictEqual(expectedData);
  });

  it('skips accounts that already have the new structure', async () => {
    const mockTransaction = { id: '123', type: 'send' };
    const oldStorage = {
      meta: { version: version - 1 },
      data: {
        MultichainTransactionsController: {
          nonEvmTransactions: {
            'account 1': {
              transactions: [mockTransaction],
              next: null,
              lastUpdated: 1234567890,
            },
            'account 2': {
              'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': {
                transactions: [],
                next: null,
                lastUpdated: 9876543210,
              },
            },
          },
        },
      },
    };

    const expectedData = {
      MultichainTransactionsController: {
        nonEvmTransactions: {
          'account 1': {
            'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': {
              transactions: [mockTransaction],
              next: null,
              lastUpdated: 1234567890,
            },
          },
          'account 2': {
            'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': {
                transactions: [],
                next: null,
                lastUpdated: 9876543210,
            },
          },
        },
      },
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.data).toStrictEqual(expectedData);
  });
});