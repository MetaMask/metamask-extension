import { v4 as uuid } from 'uuid';
import { sha256FromString } from 'ethereumjs-util';
import { InternalAccount } from '@metamask/keyring-api';
import { ETH_EOA_METHODS } from '../../../shared/constants/eth-methods';
import { migrate } from './105';

const MOCK_ADDRESS = '0x0';
const MOCK_ADDRESS_2 = '0x1';

const sentryCaptureExceptionMock = jest.fn();

global.sentry = {
  startSession: jest.fn(),
  endSession: jest.fn(),
  toggleSession: jest.fn(),
  captureException: sentryCaptureExceptionMock,
};

function addressToUUID(address: string): string {
  return uuid({
    random: sha256FromString(address).slice(0, 16),
  });
}

type Identity = {
  name: string;
  address: string;
  lastSelected?: number;
};

type Identities = {
  [key: string]: Identity;
};

function createMockPreferenceControllerState(
  identities: Identity[] = [{ name: 'Account 1', address: MOCK_ADDRESS }],
  selectedAddress: string = MOCK_ADDRESS,
): {
  identities: Identities;
  selectedAddress: string;
} {
  const state: {
    identities: Identities;
    selectedAddress: string;
  } = {
    identities: {},
    selectedAddress,
  };

  identities.forEach(({ address, name, lastSelected }) => {
    state.identities[address] = {
      address,
      name,
      lastSelected,
    };
  });

  return state;
}

function expectedInternalAccount(
  address: string,
  nickname: string,
  lastSelected?: number,
): InternalAccount {
  return {
    address,
    id: addressToUUID(address),
    metadata: {
      name: nickname,
      keyring: {
        type: 'HD Key Tree',
      },
      lastSelected: lastSelected ? expect.any(Number) : undefined,
      importTime: 0,
    },
    options: {},
    methods: ETH_EOA_METHODS,
    type: 'eip155:eoa',
  };
}

function createMockState(
  preferenceState: {
    identities: Identities;
    selectedAddress: string;
  } = createMockPreferenceControllerState(),
) {
  return {
    PreferencesController: {
      ...preferenceState,
    },
  };
}

describe('migration #105', () => {
  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: { version: 104 },
      data: createMockState(),
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.meta).toStrictEqual({ version: 105 });
  });

  describe('createDefaultAccountsController', () => {
    it('creates default state for accounts controller', async () => {
      const oldData = createMockState();

      const oldStorage = {
        meta: { version: 104 },
        data: oldData,
      };

      const newStorage = await migrate(oldStorage);

      const expectedUUID = addressToUUID(MOCK_ADDRESS);
      const resultInternalAccount = expectedInternalAccount(
        MOCK_ADDRESS,
        'Account 1',
      );

      expect(newStorage.data.AccountsController).toStrictEqual({
        internalAccounts: {
          accounts: {
            [expectedUUID]: resultInternalAccount,
          },
          selectedAccount: expectedUUID,
        },
      });
    });
  });

  describe('createInternalAccountsForAccountsController', () => {
    const expectedUUID = addressToUUID(MOCK_ADDRESS);
    const expectedUUID2 = addressToUUID(MOCK_ADDRESS_2);

    it('should create the identities into AccountsController as internal accounts', async () => {
      const oldData = createMockState();

      const oldStorage = {
        meta: { version: 104 },
        data: oldData,
      };

      const newStorage = await migrate(oldStorage);

      expect(newStorage.data).toStrictEqual({
        AccountsController: {
          internalAccounts: {
            accounts: {
              [expectedUUID]: expectedInternalAccount(
                MOCK_ADDRESS,
                'Account 1',
              ),
            },
            selectedAccount: expectedUUID,
          },
        },
        PreferencesController: expect.any(Object),
      });
    });

    it('should keep the same name from the identities', async () => {
      const oldData = createMockState(
        createMockPreferenceControllerState([
          { name: 'a random name', address: MOCK_ADDRESS },
        ]),
      );
      const oldStorage = {
        meta: { version: 104 },
        data: oldData,
      };
      const newStorage = await migrate(oldStorage);
      expect(newStorage.data).toStrictEqual({
        PreferencesController: expect.any(Object),
        AccountsController: {
          internalAccounts: {
            accounts: {
              [expectedUUID]: expectedInternalAccount(
                MOCK_ADDRESS,
                'a random name',
              ),
            },
            selectedAccount: expectedUUID,
          },
        },
      });
    });

    it('should be able to handle multiple identities', async () => {
      const oldData = createMockState({
        identities: {
          [MOCK_ADDRESS]: { name: 'Account 1', address: MOCK_ADDRESS },
          [MOCK_ADDRESS_2]: { name: 'Account 2', address: MOCK_ADDRESS_2 },
        },
        selectedAddress: MOCK_ADDRESS,
      });

      const oldStorage = {
        meta: { version: 104 },
        data: oldData,
      };

      const newStorage = await migrate(oldStorage);

      expect(newStorage.data).toStrictEqual({
        AccountsController: {
          internalAccounts: {
            accounts: {
              [expectedUUID]: expectedInternalAccount(
                MOCK_ADDRESS,
                'Account 1',
              ),
              [expectedUUID2]: expectedInternalAccount(
                MOCK_ADDRESS_2,
                'Account 2',
              ),
            },
            selectedAccount: expectedUUID,
          },
        },
        PreferencesController: expect.any(Object),
      });
    });
  });

  describe('createSelectedAccountForAccountsController', () => {
    afterEach(() => {
      jest.resetAllMocks();
    });

    it('should select the same account as the selected address', async () => {
      const oldData = createMockState();
      const oldStorage = {
        meta: { version: 104 },
        data: oldData,
      };
      const newStorage = await migrate(oldStorage);
      expect(newStorage.data).toStrictEqual({
        PreferencesController: expect.any(Object),
        AccountsController: {
          internalAccounts: {
            accounts: expect.any(Object),
            selectedAccount: addressToUUID(MOCK_ADDRESS),
          },
        },
      });
    });

    it("should leave selectedAccount as empty if there aren't any selectedAddress", async () => {
      const oldData = {
        PreferencesController: {
          identities: {},
          selectedAddress: '',
        },
      };
      const oldStorage = {
        meta: { version: 104 },
        data: oldData,
      };
      const newStorage = await migrate(oldStorage);
      expect(newStorage.data).toStrictEqual({
        PreferencesController: expect.any(Object),
        AccountsController: {
          internalAccounts: {
            accounts: expect.any(Object),
            selectedAccount: '',
          },
        },
      });
    });

    it('captures an exception if the selectedAddress state is invalid', async () => {
      const oldData = {
        PreferencesController: {
          identities: {},
          selectedAddress: undefined,
        },
      };
      const oldStorage = {
        meta: { version: 104 },
        data: oldData,
      };
      await migrate(oldStorage);

      expect(sentryCaptureExceptionMock).toHaveBeenCalledTimes(1);
      expect(sentryCaptureExceptionMock).toHaveBeenCalledWith(
        new Error(`state.PreferencesController?.selectedAddress is undefined`),
      );
    });

    it('recovers from invalid selectedAddress state', async () => {
      const expectedUUID = addressToUUID(MOCK_ADDRESS);

      const oldData = {
        PreferencesController: {
          identities: {
            [MOCK_ADDRESS]: { name: 'Account 1', address: MOCK_ADDRESS },
          },
          selectedAddress: undefined,
        },
      };
      const oldStorage = {
        meta: { version: 104 },
        data: oldData,
      };

      const newStorage = await migrate(oldStorage);

      expect(newStorage.data).toStrictEqual({
        PreferencesController: expect.objectContaining({
          selectedAddress: MOCK_ADDRESS,
        }),
        AccountsController: {
          internalAccounts: {
            accounts: {
              [expectedUUID]: expectedInternalAccount(
                MOCK_ADDRESS,
                'Account 1',
              ),
            },
            selectedAccount: expectedUUID,
          },
        },
      });
    });
  });
});
