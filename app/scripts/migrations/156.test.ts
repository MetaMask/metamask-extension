import { createMockInternalAccount } from '../../../test/jest/mocks';
import { migrate, version } from './156';

const oldVersion = 155;

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
      data: {},
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.meta).toStrictEqual({ version });
  });

  describe(`migration #${version}`, () => {
    it('logs an error and returns the original state if TokensController is missing', async () => {
      const oldStorage = {
        meta: { version: oldVersion },
        data: {},
      };

      const newStorage = await migrate(oldStorage);

      expect(global.sentry.captureException).toHaveBeenCalledWith(
        new Error(`Migration ${version}: TokensController not found.`),
      );
      expect(newStorage.data).toStrictEqual(oldStorage.data);
    });

    it('logs an error and returns the original state if AccountsController is missing', async () => {
      const oldStorage = {
        meta: { version: oldVersion },
        data: {
          TokensController: {},
        },
      };

      const newStorage = await migrate(oldStorage);

      expect(global.sentry.captureException).toHaveBeenCalledWith(
        new Error(`Migration ${version}: AccountsController not found.`),
      );
      expect(newStorage.data).toStrictEqual(oldStorage.data);
    });

    it('logs an error and returns the original state if TokensController is not an object', async () => {
      const oldStorage = {
        meta: { version: oldVersion },
        data: {
          TokensController: 'not an object',
          AccountsController: {},
        },
      };

      const newStorage = await migrate(oldStorage);

      expect(global.sentry.captureException).toHaveBeenCalledWith(
        new Error(
          `Migration ${version}: TokensController is type 'string', expected object.`,
        ),
      );
      expect(newStorage.data).toStrictEqual(oldStorage.data);
    });

    it('logs an error and returns the original state if AccountsController is not an object', async () => {
      const oldStorage = {
        meta: { version: oldVersion },
        data: {
          TokensController: {},
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

    it('does not remove any tokens from state if all accounts in TokensController state exist in AccountsController state', async () => {
      const mockInternalAccount = createMockInternalAccount();
      console.log('🚀 ~ it ~ mockInternalAccount:', mockInternalAccount);
      const oldStorage = {
        meta: { version: oldVersion },
        data: {
          TokensController: {},
          AccountsController: {
            internalAccounts: {
              accounts: {
                [mockInternalAccount.id]: mockInternalAccount,
              },
              selectedAccount: mockInternalAccount.id,
            },
          },
        },
      };
    });
  });
});
