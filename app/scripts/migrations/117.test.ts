import { createMockInternalAccount } from '../../../test/jest/mocks';
import { migrate, version } from './117';

const oldVersion = 116;
const newVersion = 117;

describe('migration #117', () => {
  it('should update the version metadata', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {},
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.meta).toStrictEqual({ version });
  });

  it('should add importTime to InternalAccount if it is not defined"', async () => {
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
                  importTime: expect.any(Number),
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

  it('should make no changes importTime already exists', async () => {
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
