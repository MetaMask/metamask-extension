import { migrate, version } from './176';

const SOLANA_MAINNET_ADDRESS = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp';

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
            [SOLANA_MAINNET_ADDRESS]: {
              transactions: [mockTransaction],
              next: null,
              lastUpdated: 1234567890,
            },
          },
          'account 2': {
            [SOLANA_MAINNET_ADDRESS]: {
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

  it('throws error for invalid transaction state entry', async () => {
    const oldStorage = {
      meta: { version: version - 1 },
      data: {
        MultichainTransactionsController: {
          nonEvmTransactions: {
            'account 1': {
              transactions: 'not an array',
              next: null,
              lastUpdated: 1234567890,
            },
          },
        },
      },
    };

    await expect(migrate(oldStorage)).rejects.toThrow(
      'Invalid transaction state entry for account account 1',
    );
  });

  it('skips migration for accounts already in new format', async () => {
    const mockTransaction = { id: '123', type: 'send' };
    const oldStorage = {
      meta: { version: version - 1 },
      data: {
        MultichainTransactionsController: {
          nonEvmTransactions: {
            '41b81ef6-05f9-46cf-8c10-998bdee48d8d': {
              [SOLANA_MAINNET_ADDRESS]: {
                transactions: [mockTransaction],
                next: null,
                lastUpdated: 1234567890,
              },
            },
          },
        },
      },
    };

    const newStorage = await migrate(oldStorage);
    // Should keep the existing structure unchanged
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('handles mixed state with both old and new format accounts', async () => {
    const mockTransaction1 = { id: '123', type: 'send' };
    const mockTransaction2 = { id: '456', type: 'receive' };
    const oldStorage = {
      meta: { version: version - 1 },
      data: {
        MultichainTransactionsController: {
          nonEvmTransactions: {
            // Already migrated account
            'account 1': {
              [SOLANA_MAINNET_ADDRESS]: {
                transactions: [mockTransaction1],
                next: null,
                lastUpdated: 1234567890,
              },
            },
            // Old format account that needs migration
            'account 2': {
              transactions: [mockTransaction2],
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
          // Already migrated account should remain unchanged
          'account 1': {
            [SOLANA_MAINNET_ADDRESS]: {
              transactions: [mockTransaction1],
              next: null,
              lastUpdated: 1234567890,
            },
          },
          // Old format account should be migrated
          'account 2': {
            [SOLANA_MAINNET_ADDRESS]: {
              transactions: [mockTransaction2],
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

  it('handles empty accounts as already migrated', async () => {
    const oldStorage = {
      meta: { version: version - 1 },
      data: {
        MultichainTransactionsController: {
          nonEvmTransactions: {
            'empty account': {},
          },
        },
      },
    };

    const newStorage = await migrate(oldStorage);
    // Empty accounts should be kept as is
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });
});
