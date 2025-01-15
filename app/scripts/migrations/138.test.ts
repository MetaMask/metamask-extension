import { cloneDeep } from 'lodash';
import {
  EthAccountType,
  BtcAccountType,
  SolAccountType,
} from '@metamask/keyring-api';
import { Json } from '@metamask/utils';
import { createMockInternalAccount } from '../../../test/jest/mocks';
import { KeyringType } from '../../../shared/constants/keyring';
import { migrate, version } from './138';

const sentryCaptureExceptionMock = jest.fn();

global.sentry = {
  captureException: sentryCaptureExceptionMock,
};

const oldVersion = 137;

// Hardcode types to avoid conflicting with future type updates.
type KeyringAccount = {
  type: string;
  id: string;
  options: Record<string, Json>;
  address: string;
  scopes: string[];
  methods: string[];
};

type InternalAccount = KeyringAccount & {
  metadata: Record<string, Json | undefined>;
};

type AccountsControllerState = {
  AccountsController: {
    internalAccounts: {
      accounts: Record<string, InternalAccount>;
      selectedAccount: string;
    };
  };
};

const mockEvmEoaAccount: InternalAccount = createMockInternalAccount({
  type: EthAccountType.Eoa,
});

const mockEvmErc4337Account: InternalAccount = createMockInternalAccount({
  type: EthAccountType.Erc4337,
});

const mockBtcP2wpkhMainnetAccount: InternalAccount = createMockInternalAccount({
  type: BtcAccountType.P2wpkh,
  address: 'bc1qwl8399fz829uqvqly9tcatgrgtwp3udnhxfq4k',
  keyringType: KeyringType.snap,
});

const mockBtcP2wpkhTestnetAccount: InternalAccount = createMockInternalAccount({
  type: BtcAccountType.P2wpkh,
  address: 'tb1q6rmsq3vlfdhjdhtkxlqtuhhlr6pmj09y6w43g8',
  keyringType: KeyringType.snap,
});

const mockSolDataAccount: InternalAccount = createMockInternalAccount({
  type: SolAccountType.DataAccount,
  address: 'BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP',
  keyringType: KeyringType.snap,
});

function noAddress(mockAccount: InternalAccount): InternalAccount {
  const { address: _, ...mockAccountWithoutAddress } = mockAccount;

  return mockAccountWithoutAddress as unknown as InternalAccount;
}

function noScopes(mockAccount: InternalAccount): InternalAccount {
  const { scopes: _, ...mockAccountWithoutScopes } = mockAccount;

  return mockAccountWithoutScopes as unknown as InternalAccount;
}

function mockAccountsControllerState(
  mockAccount: InternalAccount,
  moreMockAccounts: InternalAccount[] = [],
): AccountsControllerState {
  const defaultAccounts = {
    [mockAccount.id]: mockAccount,
  };

  const accounts = moreMockAccounts.reduce((mocks, moreMockAccount) => {
    mocks[moreMockAccount.id] = moreMockAccount;
    return mocks;
  }, defaultAccounts);

  return {
    AccountsController: {
      internalAccounts: {
        accounts,
        selectedAccount: mockAccount.id,
      },
    },
  };
}

describe(`migration #${version}`, () => {
  afterEach(() => jest.resetAllMocks());

  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: mockAccountsControllerState(mockEvmEoaAccount),
    };

    const newStorage = await migrate(cloneDeep(oldStorage));
    expect(newStorage.meta).toStrictEqual({ version });
  });

  it('does nothing if all accounts have scopes already', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: mockAccountsControllerState(mockEvmEoaAccount),
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

  // @ts-expect-error 'each' function missing from type definitions, but it does exist
  it.each([
    {
      label: 'AccountsController type',
      message: `Invalid AccountsController state of type 'string'`,
      state: { AccountsController: 'invalid' },
    },
    {
      label: 'Missing internalAccounts',
      message: `Invalid AccountsController state, missing internalAccounts`,
      state: { AccountsController: {} },
    },
    {
      label: 'Invalid internalAccounts',
      message: `Invalid AccountsController internalAccounts state of type 'string'`,
      state: { AccountsController: { internalAccounts: 'invalid' } },
    },
    {
      label: 'Missing accounts',
      message: `Invalid AccountsController internalAccounts state, missing accounts`,
      state: {
        AccountsController: {
          internalAccounts: {},
        },
      },
    },
    {
      label: 'Invalid accounts',
      message: `Invalid AccountsController internalAccounts.accounts state of type 'string'`,
      state: {
        AccountsController: {
          internalAccounts: { accounts: 'invalid' },
        },
      },
    },
    {
      label: 'Invalid accounts entry',
      message: `Invalid AccountsController's account (object) type, is 'string'`,
      state: {
        AccountsController: {
          internalAccounts: {
            accounts: { [mockEvmEoaAccount.id]: 'invalid' },
          },
        },
      },
    },
    {
      label: 'Missing type in accounts entry',
      message: `Invalid AccountsController's account missing 'type' property`,
      state: {
        AccountsController: {
          internalAccounts: {
            accounts: { [mockEvmEoaAccount.id]: {} },
          },
        },
      },
    },
    {
      label: 'Invalid type for accounts entry',
      message: `Invalid AccountsController's account.type type, is 'object'`,
      state: {
        AccountsController: {
          internalAccounts: {
            accounts: { [mockEvmEoaAccount.id]: { type: {} } },
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
        new Error(`Migration ${version}: ${message}`),
      );
      // Since there was an error, the storage's data remains the same.
      expect(newStorage.data).toStrictEqual(oldStorage.data);
    },
  );

  // @ts-expect-error 'each' function missing from type definitions, but it does exist
  it.each([
    {
      label: 'Invalid scopes type for accounts entry',
      message: `Migration ${version}: Invalid AccountsController's account.scopes type, is 'object'`,
      oldState: mockAccountsControllerState({
        ...mockEvmEoaAccount,
        scopes: {},
      } as unknown as InternalAccount),
      newState: mockAccountsControllerState(mockEvmEoaAccount),
    },
    {
      label: 'Invalid scopes type for accounts entry item',
      message: `Migration ${version}: Invalid AccountsController's account.scopes item type, is 'number'`,
      oldState: mockAccountsControllerState({
        ...mockEvmEoaAccount,
        scopes: [0],
      } as unknown as InternalAccount),
      newState: mockAccountsControllerState(mockEvmEoaAccount),
    },
  ])(
    'migrates and captures error log when state is invalid due to: $label',
    async ({
      message,
      oldState,
      newState,
    }: {
      message: string;
      oldState: AccountsControllerState;
      newState: AccountsControllerState;
    }) => {
      const newStorage = await migrate(
        cloneDeep({
          meta: { version: oldVersion },
          data: oldState,
        }),
      );

      if (message) {
        // We might still log some "warnings" during the migration. It's only for logging purposes since the
        // state will still be migrated properly.
        expect(sentryCaptureExceptionMock).toHaveBeenCalledWith(
          new Error(message),
        );
      }
      expect(newStorage.data).toStrictEqual(newState);
    },
  );

  // @ts-expect-error 'each' function missing from type definitions, but it does exist
  it.each([
    {
      label: 'EOA account has no scope',
      oldState: mockAccountsControllerState(noScopes(mockEvmEoaAccount)),
      newState: mockAccountsControllerState(mockEvmEoaAccount),
    },
    {
      label: 'ERC4337 account has no scope',
      message:
        'Injecting EVM scope for ERC4337 account (should never happen for now)',
      oldState: mockAccountsControllerState(noScopes(mockEvmErc4337Account)),
      newState: mockAccountsControllerState(mockEvmErc4337Account),
    },
    {
      label: 'Bitcoin account without address defaults to mainnet',
      message:
        'Invalid Bitcoin account, could not use "address" (should never happen)',
      oldState: mockAccountsControllerState(
        noAddress(noScopes(mockBtcP2wpkhMainnetAccount)),
      ),
      newState: mockAccountsControllerState(
        noAddress(mockBtcP2wpkhMainnetAccount),
      ),
    },
    {
      label: 'Bitcoin mainnet account has no scope',
      oldState: mockAccountsControllerState(
        noScopes(mockBtcP2wpkhMainnetAccount),
      ),
      newState: mockAccountsControllerState(mockBtcP2wpkhMainnetAccount),
    },
    {
      label: 'Bitcoin testnet account has no scope',
      oldState: mockAccountsControllerState(
        noScopes(mockBtcP2wpkhTestnetAccount),
      ),
      newState: mockAccountsControllerState(mockBtcP2wpkhTestnetAccount),
    },
    {
      label: 'Solana account has no scope',
      oldState: mockAccountsControllerState(noScopes(mockSolDataAccount)),
      newState: mockAccountsControllerState(mockSolDataAccount),
    },
    {
      label:
        'Unknown account type with no scope defaults to an EVM namespace scope',
      message:
        'Injecting EVM scope for unknown account type (should never happen)',
      oldState: mockAccountsControllerState({
        ...noScopes(mockEvmEoaAccount),
        type: 'unknown:account-type',
      }),
      newState: mockAccountsControllerState({
        ...mockEvmEoaAccount,
        type: 'unknown:account-type',
      }),
    },
  ])(
    'migrates when: $label',
    async ({
      message,
      oldState,
      newState,
    }: {
      message: string;
      oldState: AccountsControllerState;
      newState: AccountsControllerState;
    }) => {
      const newStorage = await migrate(
        cloneDeep({
          meta: { version: oldVersion },
          data: oldState,
        }),
      );

      if (message) {
        // We might still log some "warnings" during the migration. It's only for logging purposes since the
        // state will still be migrated properly.
        expect(sentryCaptureExceptionMock).toHaveBeenCalledWith(
          new Error(`Migration ${version}: ${message}`),
        );
      }
      expect(newStorage.data).toStrictEqual(newState);
    },
  );
});
