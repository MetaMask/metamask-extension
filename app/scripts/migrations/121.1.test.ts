import { AccountsControllerState } from '@metamask/accounts-controller';
import { cloneDeep } from 'lodash';
import { createMockInternalAccount } from '../../../test/jest/mocks';
import { migrate, version } from './121.1';

const sentryCaptureExceptionMock = jest.fn();

global.sentry = {
  captureException: sentryCaptureExceptionMock,
};

const oldVersion = 121;

const mockInternalAccount = createMockInternalAccount();
const mockAccountsControllerState: AccountsControllerState = {
  internalAccounts: {
    accounts: {
      [mockInternalAccount.id]: mockInternalAccount,
    },
    selectedAccount: mockInternalAccount.id,
  },
};

describe('migration #121.1', () => {
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

  it('updates selected account if it is not found in the list of accounts', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        AccountsController: {
          ...mockAccountsControllerState,
          internalAccounts: {
            ...mockAccountsControllerState.internalAccounts,
            selectedAccount: 'unknown id',
          },
        },
      },
    };

    const newStorage = await migrate(cloneDeep(oldStorage));

    expect(newStorage.data.AccountsController).toStrictEqual({
      ...mockAccountsControllerState,
      internalAccounts: {
        ...mockAccountsControllerState.internalAccounts,
        selectedAccount: mockInternalAccount.id,
      },
    });
  });

  it('does nothing if the selectedAccount is found in the list of accounts', async () => {
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

  it('does nothing if there are no accounts', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        AccountsController: {
          ...mockAccountsControllerState,
          internalAccounts: {
            ...mockAccountsControllerState.internalAccounts,
            accounts: {},
          },
        },
      },
    };

    const newStorage = await migrate(cloneDeep(oldStorage));

    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('does nothing if selectedAccount is unset', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        AccountsController: {
          ...mockAccountsControllerState,
          internalAccounts: {
            ...mockAccountsControllerState.internalAccounts,
            selectedAccount: '',
          },
        },
      },
    };

    const newStorage = await migrate(cloneDeep(oldStorage));

    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  const invalidState = [
    {
      errorMessage: `Migration ${version}: Invalid AccountsController state of type 'string'`,
      label: 'AccountsController type',
      state: { AccountsController: 'invalid' },
    },
    {
      errorMessage: `Migration ${version}: Invalid AccountsController state, missing internalAccounts`,
      label: 'Missing internalAccounts',
      state: { AccountsController: {} },
    },
    {
      errorMessage: `Migration ${version}: Invalid AccountsController internalAccounts state of type 'string'`,
      label: 'Invalid internalAccounts',
      state: { AccountsController: { internalAccounts: 'invalid' } },
    },
    {
      errorMessage: `Migration ${version}: Invalid AccountsController internalAccounts state, missing selectedAccount`,
      label: 'Missing selectedAccount',
      state: { AccountsController: { internalAccounts: { accounts: {} } } },
    },
    {
      errorMessage: `Migration ${version}: Invalid AccountsController internalAccounts.selectedAccount state of type 'object'`,
      label: 'Invalid selectedAccount',
      state: {
        AccountsController: {
          internalAccounts: { accounts: {}, selectedAccount: {} },
        },
      },
    },
    {
      errorMessage: `Migration ${version}: Invalid AccountsController internalAccounts state, missing accounts`,
      label: 'Missing accounts',
      state: {
        AccountsController: {
          internalAccounts: { selectedAccount: '' },
        },
      },
    },
    {
      errorMessage: `Migration ${version}: Invalid AccountsController internalAccounts.accounts state of type 'string'`,
      label: 'Missing accounts',
      state: {
        AccountsController: {
          internalAccounts: { accounts: 'invalid', selectedAccount: '' },
        },
      },
    },
    {
      errorMessage: `Migration ${version}: Invalid AccountsController internalAccounts.accounts state, entry found of type 'string'`,
      label: 'Account entry type',
      state: {
        AccountsController: {
          internalAccounts: {
            accounts: { [mockInternalAccount.id]: 'invalid' },
            selectedAccount: 'unknown id',
          },
        },
      },
    },
    {
      errorMessage: `Migration ${version}: Invalid AccountsController internalAccounts.accounts state, entry found that is missing an id`,
      label: 'Account entry missing ID',
      state: {
        AccountsController: {
          internalAccounts: {
            accounts: { [mockInternalAccount.id]: {} },
            selectedAccount: 'unknown id',
          },
        },
      },
    },
    {
      errorMessage: `Migration ${version}: Invalid AccountsController internalAccounts.accounts state, entry found with an id of type 'object'`,
      label: 'Account entry missing ID',
      state: {
        AccountsController: {
          internalAccounts: {
            accounts: { [mockInternalAccount.id]: { id: {} } },
            selectedAccount: 'unknown id',
          },
        },
      },
    },
  ];

  // @ts-expect-error 'each' function missing from type definitions, but it does exist
  it.each(invalidState)(
    'captures error when state is invalid due to: $label',
    async ({
      errorMessage,
      state,
    }: {
      errorMessage: string;
      state: Record<string, unknown>;
    }) => {
      const oldStorage = {
        meta: { version: oldVersion },
        data: state,
      };

      const newStorage = await migrate(cloneDeep(oldStorage));

      expect(sentryCaptureExceptionMock).toHaveBeenCalledWith(
        new Error(errorMessage),
      );
      expect(newStorage.data).toStrictEqual(oldStorage.data);
    },
  );
});
