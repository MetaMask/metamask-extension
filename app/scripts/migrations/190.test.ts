import { EthAccountType } from '@metamask/keyring-api';
import { migrate, version } from './190';

const oldVersion = 189;

describe(`migration #${version}`, () => {
  beforeEach(() => {
    global.sentry = { captureException: jest.fn() };
  });

  afterEach(() => {
    global.sentry = undefined;
  });

  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        AccountsController: {
          internalAccounts: {
            accounts: {},
            selectedAccount: '',
          },
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.meta).toStrictEqual({ version });
  });

  it('logs an error and returns the original state if AccountsController is missing', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {},
    };

    const newStorage = await migrate(oldStorage);

    expect(global.sentry.captureException).toHaveBeenCalledWith(
      new Error(`Migration ${version}: AccountsController not found.`),
    );
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('logs an error and returns the original state if AccountsController is not an object', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        AccountsController: 'not an object',
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(global.sentry.captureException).toHaveBeenCalledWith(
      new Error(
        `Migration ${version}: AccountsController is type 'string', expected object.`,
      ),
    );
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('logs an error and returns the original state if internalAccounts is missing', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        AccountsController: {},
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(global.sentry.captureException).toHaveBeenCalledWith(
      new Error(
        `Migration ${version}: AccountsController.internalAccounts not found.`,
      ),
    );
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('logs an error and returns the original state if internalAccounts is not an object', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        AccountsController: {
          internalAccounts: 'not an object',
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(global.sentry.captureException).toHaveBeenCalledWith(
      new Error(
        `Migration ${version}: AccountsController.internalAccounts is type 'string', expected object.`,
      ),
    );
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('logs an error and returns the original state if accounts is missing', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        AccountsController: {
          internalAccounts: {},
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(global.sentry.captureException).toHaveBeenCalledWith(
      new Error(
        `Migration ${version}: AccountsController.internalAccounts.accounts not found.`,
      ),
    );
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('logs an error and returns the original state if accounts is not an object', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        AccountsController: {
          internalAccounts: {
            accounts: 'not an object',
          },
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(global.sentry.captureException).toHaveBeenCalledWith(
      new Error(
        `Migration ${version}: AccountsController.internalAccounts.accounts is type 'string', expected object.`,
      ),
    );
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('does not modify accounts that already have scopes defined', async () => {
    const accountId = 'account-1';
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        AccountsController: {
          internalAccounts: {
            accounts: {
              [accountId]: {
                id: accountId,
                address: '0x123',
                type: EthAccountType.Eoa,
                scopes: ['eip155:1'],
                metadata: {
                  name: 'Account 1',
                  keyring: { type: 'HD Key Tree' },
                },
                methods: [],
              },
            },
            selectedAccount: accountId,
          },
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(
      // @ts-expect-error - accessing nested property for testing
      newStorage.data.AccountsController.internalAccounts.accounts[accountId]
        .scopes,
    ).toStrictEqual(['eip155:1']);
  });

  it('initializes scopes as empty array for accounts with undefined scopes', async () => {
    const accountId = 'account-1';
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        AccountsController: {
          internalAccounts: {
            accounts: {
              [accountId]: {
                id: accountId,
                address: '0x123',
                type: EthAccountType.Eoa,
                // scopes is intentionally missing
                metadata: {
                  name: 'Account 1',
                  keyring: { type: 'HD Key Tree' },
                },
                methods: [],
              },
            },
            selectedAccount: accountId,
          },
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(
      // @ts-expect-error - accessing nested property for testing
      newStorage.data.AccountsController.internalAccounts.accounts[accountId]
        .scopes,
    ).toStrictEqual([]);
  });

  it('initializes scopes as empty array for accounts with non-array scopes', async () => {
    const accountId = 'account-1';
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        AccountsController: {
          internalAccounts: {
            accounts: {
              [accountId]: {
                id: accountId,
                address: '0x123',
                type: EthAccountType.Eoa,
                scopes: null, // invalid scopes value
                metadata: {
                  name: 'Account 1',
                  keyring: { type: 'HD Key Tree' },
                },
                methods: [],
              },
            },
            selectedAccount: accountId,
          },
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(
      // @ts-expect-error - accessing nested property for testing
      newStorage.data.AccountsController.internalAccounts.accounts[accountId]
        .scopes,
    ).toStrictEqual([]);
  });

  it('fixes multiple accounts with undefined scopes', async () => {
    const account1Id = 'account-1';
    const account2Id = 'account-2';
    const account3Id = 'account-3';
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        AccountsController: {
          internalAccounts: {
            accounts: {
              [account1Id]: {
                id: account1Id,
                address: '0x123',
                type: EthAccountType.Eoa,
                // scopes missing
                metadata: {
                  name: 'Account 1',
                  keyring: { type: 'HD Key Tree' },
                },
                methods: [],
              },
              [account2Id]: {
                id: account2Id,
                address: '0x456',
                type: EthAccountType.Eoa,
                scopes: ['eip155:1'], // already has scopes
                metadata: {
                  name: 'Account 2',
                  keyring: { type: 'HD Key Tree' },
                },
                methods: [],
              },
              [account3Id]: {
                id: account3Id,
                address: '0x789',
                type: EthAccountType.Eoa,
                // scopes missing
                metadata: {
                  name: 'Account 3',
                  keyring: { type: 'HD Key Tree' },
                },
                methods: [],
              },
            },
            selectedAccount: account1Id,
          },
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    // Account 1 should have empty scopes
    expect(
      // @ts-expect-error - accessing nested property for testing
      newStorage.data.AccountsController.internalAccounts.accounts[account1Id]
        .scopes,
    ).toStrictEqual([]);

    // Account 2 should keep its original scopes
    expect(
      // @ts-expect-error - accessing nested property for testing
      newStorage.data.AccountsController.internalAccounts.accounts[account2Id]
        .scopes,
    ).toStrictEqual(['eip155:1']);

    // Account 3 should have empty scopes
    expect(
      // @ts-expect-error - accessing nested property for testing
      newStorage.data.AccountsController.internalAccounts.accounts[account3Id]
        .scopes,
    ).toStrictEqual([]);
  });

  it('handles empty accounts object', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        AccountsController: {
          internalAccounts: {
            accounts: {},
            selectedAccount: '',
          },
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(
      // @ts-expect-error - accessing nested property for testing
      newStorage.data.AccountsController.internalAccounts.accounts,
    ).toStrictEqual({});
  });

  it('skips non-object account entries', async () => {
    const accountId = 'account-1';
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        AccountsController: {
          internalAccounts: {
            accounts: {
              [accountId]: 'not an object', // invalid account
            },
            selectedAccount: accountId,
          },
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    // Should not crash, just skip the invalid entry
    expect(
      // @ts-expect-error - accessing nested property for testing
      newStorage.data.AccountsController.internalAccounts.accounts[accountId],
    ).toBe('not an object');
  });
});
