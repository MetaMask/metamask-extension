import { createMockInternalAccount } from '../../../test/jest/mocks';
import { migrate, version } from './119';

const mockTimeStamp = 1716972230;
jest.useFakeTimers().setSystemTime(new Date(mockTimeStamp));

const oldVersion = 118;
const newVersion = version;

describe('migration #119', () => {
  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {},
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.meta).toStrictEqual({ version });
  });

  it('returns the default state if the AccountsController state is undefined', async () => {
    const defaultState = {
      internalAccounts: {
        accounts: {},
        selectedAccount: '',
      },
    };

    const oldStorage = {
      meta: {
        version: oldVersion,
      },
      data: {
        AccountsController: defaultState,
      },
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage).toStrictEqual({
      meta: {
        version: newVersion,
      },
      data: {
        AccountsController: defaultState,
      },
    });
    expect(newStorage);
  });

  it('adds importTime attribute to InternalAccount if it is not defined"', async () => {
    const mockInternalAccount = createMockInternalAccount();
    // @ts-expect-error forcing the importTime to be undefined for migration test.
    mockInternalAccount.metadata.importTime = undefined;

    const oldStorage = {
      meta: {
        version: oldVersion,
      },
      data: {
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

    const newStorage = await migrate(oldStorage);
    expect(newStorage).toStrictEqual({
      meta: {
        version: newVersion,
      },
      data: {
        AccountsController: {
          internalAccounts: {
            accounts: {
              [mockInternalAccount.id]: {
                ...mockInternalAccount,
                metadata: {
                  ...mockInternalAccount.metadata,
                  importTime: mockTimeStamp,
                },
              },
            },
            selectedAccount: mockInternalAccount.id,
          },
        },
      },
    });
    expect(newStorage);
  });

  it('does not change the importTime attribute if it already exists', async () => {
    const mockInternalAccount = createMockInternalAccount();
    const mockAccountsControllerState = {
      internalAccounts: {
        accounts: {
          [mockInternalAccount.id]: mockInternalAccount,
        },
        selectedAccount: mockInternalAccount.id,
      },
    };
    const oldStorage = {
      meta: {
        version: oldVersion,
      },
      data: {
        AccountsController: mockAccountsControllerState,
      },
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage).toStrictEqual({
      meta: {
        version: newVersion,
      },
      data: {
        AccountsController: mockAccountsControllerState,
      },
    });
  });
});
