import { AccountsControllerState } from '@metamask/accounts-controller';
import { createMockInternalAccount } from '../../../test/jest/mocks';
import { migrate, version } from './126';

const oldVersion = 125;

const mockInternalAccount = createMockInternalAccount();
const mockAccountsControllerState: AccountsControllerState = {
  internalAccounts: {
    accounts: {
      [mockInternalAccount.id]: mockInternalAccount,
    },
    selectedAccount: mockInternalAccount.id,
  },
};

describe('migration #126', () => {
  afterEach(() => jest.resetAllMocks());

  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        AccountsController: mockAccountsControllerState,
      },
    };

    const newStorage = await migrate(oldStorage);
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

    const newStorage = await migrate(oldStorage);
    const {
      internalAccounts: { selectedAccount },
    } = newStorage.data.AccountsController as AccountsControllerState;
    expect(selectedAccount).toStrictEqual(mockInternalAccount.id);
    expect(newStorage.data.AccountsController).toStrictEqual(
      mockAccountsControllerState,
    );
  });

  it('does nothing if the selectedAccount is found in the list of accounts', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        AccountsController: mockAccountsControllerState,
      },
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.data.AccountsController).toStrictEqual(
      mockAccountsControllerState,
    );
  });
});
