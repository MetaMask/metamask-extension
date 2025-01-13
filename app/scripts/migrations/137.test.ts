import { AccountsControllerState } from '@metamask/accounts-controller';
import { cloneDeep } from 'lodash';
import { createMockInternalAccount } from '../../../test/jest/mocks';
import { migrate, version } from './137';

const sentryCaptureExceptionMock = jest.fn();

global.sentry = {
  captureException: sentryCaptureExceptionMock,
};

const oldVersion = 136;

const mockInternalAccount = createMockInternalAccount();
const mockAccountsControllerState: AccountsControllerState = {
  internalAccounts: {
    accounts: {
      [mockInternalAccount.id]: mockInternalAccount,
    },
    selectedAccount: mockInternalAccount.id,
  },
};

describe(`migration #${version}`, () => {
  afterEach(() => jest.resetAllMocks());

  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        AccountsController: mockAccountsControllerState,
      },
    };

    const newStorage = await migrate(cloneDeep(oldStorage));
    expect(newStorage.meta).toStrictEqual({ version });
  });

  it('does nothing if all accounts have scopes already', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        AccountsController: mockAccountsControllerState,
      },
    };

    const newStorage = await migrate(cloneDeep(oldStorage));
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('does nothing if AccountsController state is missing', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        OtherController: {},
      },
    };

    const newStorage = await migrate(cloneDeep(oldStorage));
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it.only('adds a scopes if it is missing on an account', async () => {
    const { scopes: _, ...mockInternalAccountWithoutScopes } =
      mockInternalAccount;
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        AccountsController: {
          internalAccounts: {
            accounts: {
              [mockInternalAccountWithoutScopes.id]:
                mockInternalAccountWithoutScopes,
            },
            selectedAccount: mockInternalAccountWithoutScopes.id,
          },
        },
      },
    };

    const newStorage = await migrate(cloneDeep(oldStorage));
    expect(newStorage.data).toStrictEqual({
      // This mock state already has the expected scope
      AccountsController: mockAccountsControllerState,
    });
  });

  // @ts-expect-error 'each' function missing from type definitions, but it does exist
  it.each([
    {
      label: 'AccountsController type',
      message: `Migration ${version}: Invalid AccountsController state of type 'string'`,
      state: { AccountsController: 'invalid' },
    },
    {
      label: 'Missing internalAccounts',
      message: `Migration ${version}: Invalid AccountsController state, missing internalAccounts`,
      state: { AccountsController: {} },
    },
    {
      label: 'Invalid internalAccounts',
      message: `Migration ${version}: Invalid AccountsController internalAccounts state of type 'string'`,
      state: { AccountsController: { internalAccounts: 'invalid' } },
    },
    {
      label: 'Missing accounts',
      message: `Migration ${version}: Invalid AccountsController internalAccounts state, missing accounts`,
      state: {
        AccountsController: {
          internalAccounts: {},
        },
      },
    },
    {
      label: 'Invalid accounts',
      message: `Migration ${version}: Invalid AccountsController internalAccounts.accounts state of type 'string'`,
      state: {
        AccountsController: {
          internalAccounts: { accounts: 'invalid' },
        },
      },
    },
    {
      label: 'Invalid accounts entry',
      message: `Migration ${version}: Invalid AccountsController's account (object) type, is 'string'`,
      state: {
        AccountsController: {
          internalAccounts: {
            accounts: { [mockInternalAccount.id]: 'invalid' },
          },
        },
      },
    },
    {
      label: 'Missing type in accounts entry',
      message: `Migration ${version}: Invalid AccountsController's account missing 'type' property`,
      state: {
        AccountsController: {
          internalAccounts: {
            accounts: { [mockInternalAccount.id]: {} },
          },
        },
      },
    },
    {
      label: 'Invalid type for accounts entry',
      message: `Migration ${version}: Invalid AccountsController's account.type type, is 'object'`,
      state: {
        AccountsController: {
          internalAccounts: {
            accounts: { [mockInternalAccount.id]: { type: {} } },
          },
        },
      },
    },
  ])(
    'captures error when state is invalid due to: $label',
    async ({
      message,
      state,
    }: {
      message: string;
      state: Record<string, unknown>;
    }) => {
      const oldStorage = {
        meta: { version: oldVersion },
        data: state,
      };

      const newStorage = await migrate(cloneDeep(oldStorage));
      expect(sentryCaptureExceptionMock).toHaveBeenCalledWith(
        new Error(message),
      );
      expect(newStorage.data).toStrictEqual(oldStorage.data);
    },
  );
});
