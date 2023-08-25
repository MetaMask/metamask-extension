import { v4 as uuid } from 'uuid';
import { sha256FromString } from 'ethereumjs-util';
import { InternalAccount } from '@metamask/eth-snap-keyring';
import { keyringTypeToName } from '../controllers/accounts-controller';
import { KeyringType } from '../../../shared/constants/keyring';
import { migrate } from './097';

const MOCK_ADDRESS = '0x0';

function addressToUUID(address: string): string {
  return uuid({
    random: sha256FromString(address).slice(0, 16),
  });
}

function createMockKeyring(
  keyringType: string,
  accounts: string[] = [MOCK_ADDRESS],
): { type: string; accounts: string[] } {
  return {
    type: keyringType,
    accounts,
  };
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
  keyringType: string,
  nickname: string,
  lastSelected?: number,
): InternalAccount {
  return {
    address,
    id: addressToUUID(address),
    metadata: {
      keyring: {
        type: keyringType,
      },
      lastSelected: lastSelected ? expect.any(Number) : null,
    },
    name: nickname,
    options: {},
    supportedMethods: [
      'personal_sign',
      'eth_sendTransaction',
      'eth_sign',
      'eth_signTransaction',
      'eth_signTypedData',
      'eth_signTypedData_v1',
      'eth_signTypedData_v2',
      'eth_signTypedData_v3',
      'eth_signTypedData_v4',
    ],
    type: 'eip155:eoa',
  };
}

function createMockState(
  keyrings: {
    type: string;
    accounts: string[];
  }[] = [createMockKeyring('HD Key Tree')],
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
    KeyringController: {
      keyrings,
    },
    PreferencesController: {
      ...preferenceState,
    },
  };

  return data;
}

describe('migration #96', () => {
  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: { version: 96 },
      data: createMockState(),
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.meta).toStrictEqual({ version: 97 });
  });

  describe('createDefaultAccountsController', () => {
    it('creates default state for accounts controller', async () => {
      const oldData = createMockState();

      const oldStorage = {
        meta: { version: 96 },
        data: oldData,
      };

      const newStorage = await migrate(oldStorage);

      const expectedUUID = addressToUUID(MOCK_ADDRESS);
      const resultInternalAccount = expectedInternalAccount(
        MOCK_ADDRESS,
        'HD Key Tree',
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
        meta: { version: 96 },
        data: oldData,
      };

      const newStorage = await migrate(oldStorage);

      expect(newStorage.data).toStrictEqual({
        AccountsController: {
          internalAccounts: {
            accounts: {
              [expectedUUID]: expectedInternalAccount(
                MOCK_ADDRESS,
                'HD Key Tree',
                `${keyringTypeToName('HD Key Tree')} 1`,
              ),
            },
            selectedAccount: expectedUUID,
          },
        },
        KeyringController: expect.any(Object),
        PreferencesController: expect.any(Object),
      });
    });

    it.each(
      Object.values(KeyringType).map((keyring) => [
        keyring,
        createMockKeyring(keyring),
      ]),
    )(
      'should assign the correct keyring type for each identity',
      async (keyringType, keyring) => {
        const oldData = createMockState(
          [keyring],
          createMockPreferenceControllerState(
            [
              {
                name: `${keyringTypeToName(keyringType)} 1`,
                address: MOCK_ADDRESS,
              },
            ],
            MOCK_ADDRESS,
          ),
        );
        const oldStorage = {
          meta: { version: 96 },
          data: oldData,
        };
        const newStorage = await migrate(oldStorage);

        expect(newStorage.data).toStrictEqual({
          KeyringController: expect.any(Object),
          PreferencesController: expect.any(Object),
          AccountsController: {
            internalAccounts: expect.objectContaining({
              accounts: {
                [expectedUUID]: expectedInternalAccount(
                  MOCK_ADDRESS,
                  keyringType,
                  `${keyringTypeToName(keyringType)} 1`,
                ),
              },
              selectedAccount: expectedUUID,
            }),
          },
        });
      },
    );

    it('should keep the same name from the idententities', async () => {
      const oldData = createMockState(
        [createMockKeyring('HD Key Tree')],
        createMockPreferenceControllerState([
          { name: 'a random name', address: MOCK_ADDRESS },
        ]),
      );
      const oldStorage = {
        meta: { version: 96 },
        data: oldData,
      };
      const newStorage = await migrate(oldStorage);
      expect(newStorage.data).toStrictEqual({
        KeyringController: expect.any(Object),
        PreferencesController: expect.any(Object),
        AccountsController: {
          internalAccounts: {
            accounts: {
              [expectedUUID]: expectedInternalAccount(
                MOCK_ADDRESS,
                'HD Key Tree',
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
        meta: { version: 96 },
        data: oldData,
      };
      const newStorage = await migrate(oldStorage);
      expect(newStorage.data).toStrictEqual({
        KeyringController: expect.any(Object),
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
        meta: { version: 96 },
        data: oldData,
      };
      const newStorage = await migrate(oldStorage);
      expect(newStorage.data).toStrictEqual({
        KeyringController: expect.any(Object),
        PreferencesController: expect.any(Object),
        AccountsController: {
          internalAccounts: {
            accounts: expect.any(Object),
            selectedAccount: addressToUUID(MOCK_ADDRESS),
          },
        },
      });
    });

    it('should throw an error if there is a selectedAddress and it is not found in the accounts map', async () => {
      const oldData = createMockState();
      const oldStorage = {
        meta: { version: 96 },
        data: oldData,
      };
      expect(await migrate(oldStorage)).toThrowError(
        `Account Id ${addressToUUID(MOCK_ADDRESS)} not found`,
      );
    });
  });

  describe('removeIdentitiesAndSelectedAddressFromPreferencesController', () => {
    it('removes identities and selectedAddress in PreferenceController state', async () => {
      const oldData = createMockState();

      const oldStorage = {
        meta: { version: 96 },
        data: oldData,
      };

      const newStorage = await migrate(oldStorage);

      expect(newStorage.data).toStrictEqual({
        AccountsController: expect.any(Object),
        KeyringController: expect.any(Object),
        PreferencesController: {},
      });
    });
  });
});
