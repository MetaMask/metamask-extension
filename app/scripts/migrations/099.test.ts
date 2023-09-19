import { v4 as uuid } from 'uuid';
import { sha256FromString } from 'ethereumjs-util';
import { EthMethod, InternalAccount } from '@metamask/keyring-api';
import { migrate } from './099';

const MOCK_ADDRESS = '0x0';

function addressToUUID(address: string): string {
  return uuid({
    random: sha256FromString(address).slice(0, 16),
  });
}

interface Identity {
  name: string;
  address: string;
  lastSelected?: number;
}

function createMockPreferenceControllerState(
  identities: Identity[] = [{ name: 'Account 1', address: MOCK_ADDRESS }],
  selectedAddress: string = MOCK_ADDRESS,
): {
  identities: {
    [key: string]: { name: string; lastSelected?: number; address: string };
  };
  selectedAddress: string;
} {
  const state: {
    identities: {
      [key: string]: { name: string; lastSelected?: number; address: string };
    };
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
      lastSelected: lastSelected ? expect.any(Number) : null,
    },
    options: {},
    methods: [...Object.values(EthMethod)],
    type: 'eip155:eoa',
  };
}

function createMockState(
  preferenceState: {
    identities: {
      [key: string]: {
        lastSelected?: number;
        name: string;
        address: string;
      };
    };
    selectedAddress: string;
  } = createMockPreferenceControllerState(),
) {
  const data = {
    PreferencesController: {
      ...preferenceState,
    },
  };

  return data;
}

describe('migration #99', () => {
  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: { version: 98 },
      data: createMockState(),
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.meta).toStrictEqual({ version: 99 });
  });

  describe('createDefaultAccountsController', () => {
    it('creates default state for accounts controller', async () => {
      const oldData = createMockState();

      const oldStorage = {
        meta: { version: 98 },
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

  describe('moveIdentitiesToAccountsController', () => {
    const expectedUUID = addressToUUID(MOCK_ADDRESS);
    it('should move the identities into AccountsController as internal accounts', async () => {
      const oldData = createMockState();

      const oldStorage = {
        meta: { version: 98 },
        data: oldData,
      };

      const newStorage = await migrate(oldStorage);

      expect(newStorage.data).toStrictEqual({
        AccountsController: {
          internalAccounts: {
            accounts: {
              [expectedUUID]: expectedInternalAccount(
                MOCK_ADDRESS,
                `Account 1`,
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
        meta: { version: 98 },
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
                `a random name`,
              ),
            },
            selectedAccount: expectedUUID,
          },
        },
      });
    });
  });

  describe('moveSelectedAddressToAccountsController', () => {
    it('should select the same account as the selected address', async () => {
      const oldData = createMockState();
      const oldStorage = {
        meta: { version: 98 },
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

    it("should leave selectedAccount as empty is there aren't any selectedAddress", async () => {
      const oldData = createMockState();
      const oldStorage = {
        meta: { version: 98 },
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
  });

  describe('removeIdentitiesAndSelectedAddressFromPreferencesController', () => {
    it('removes identities and selectedAddress in PreferenceController state', async () => {
      const oldData = createMockState();

      const oldStorage = {
        meta: { version: 98 },
        data: oldData,
      };

      const newStorage = await migrate(oldStorage);

      expect(newStorage.data).toStrictEqual({
        AccountsController: expect.any(Object),
        PreferencesController: {},
      });
    });
  });
});
