import {
  FALLBACK_VARIATION,
  NameController,
  NameControllerState,
  NameType,
  NameOrigin,
} from '@metamask/name-controller';
import {
  AccountsController,
  AccountsControllerMessenger,
  AccountsControllerState,
} from '@metamask/accounts-controller';
import { ControllerMessenger } from '@metamask/base-controller';
import {
  AccountIdentitiesPetNamesBridgeAllowedActions,
  AccountIdentitiesPetNamesBridgeAllowedEvents,
  AccountIdentitiesPetnamesBridge,
} from './AccountIdentitiesPetnamesBridge';
import {
  PetnameEntry,
  PetnamesBridgeAllowedEvents,
  PetnamesBridgeAllowedActions,
  PetnamesBridgeMessenger,
} from './AbstractPetnamesBridge';
import {
  KeyringControllerMessenger,
  KeyringTypes,
} from '@metamask/keyring-controller';
import { createMockInternalAccount } from '../../../test/jest/mocks';

const ADDRESS_MOCK = '0xabc';
const NAME_MOCK = 'Account 1';

const MOCK_INTERNAL_ACCOUNT = createMockInternalAccount({
  address: ADDRESS_MOCK,
  name: NAME_MOCK,
  keyringType: KeyringTypes.hd,
  is4337: false,
});

/**
 * Creates a PetnameEntry with the given name and address.
 *
 * @param address
 * @param name
 */
function createAccountIdentityPetnameEntry(
  address: string,
  name: string,
): PetnameEntry {
  return {
    value: address,
    name,
    type: NameType.ETHEREUM_ADDRESS,
    sourceId: undefined,
    variation: FALLBACK_VARIATION,
    origin: NameOrigin.ACCOUNT_IDENTITY,
  };
}

const EMPTY_NAME_STATE: NameControllerState = {
  names: {
    [NameType.ETHEREUM_ADDRESS]: {},
  },
  nameSources: {},
};

/**
 * Creates NameControllerState containing a single Petname with the given name and address.
 * This is used to simulate a NameController state where a Petname has been set
 * with a call to NameController.setName(createPetnameEntry(name) as SetNameRequest).
 *
 * @param address
 * @param name
 * @param sourceId
 * @param origin
 */
function createNameStateWithPetname(
  address: string,
  name: string,
  sourceId: string | null = null,
  origin: NameOrigin | null = null,
): NameControllerState {
  return {
    ...EMPTY_NAME_STATE,
    names: {
      [NameType.ETHEREUM_ADDRESS]: {
        [address]: {
          [FALLBACK_VARIATION]: {
            name,
            proposedNames: {},
            sourceId,
            origin,
          },
        },
      },
    },
  };
}

const EMPTY_ACCOUNTS_CONTROLLER_STATE: AccountsControllerState = {
  internalAccounts: { accounts: {}, selectedAccount: '' },
};

function setupAccountsController(
  messenger: AccountsControllerMessenger,
  state = EMPTY_ACCOUNTS_CONTROLLER_STATE,
) {
  return new AccountsController({ state, messenger });
}

function buildKeyringControllerMessenger(
  messenger,
): KeyringControllerMessenger {
  return messenger.getRestricted({
    name: 'KeyringController',
    allowedEvents: ['KeyringController:stateChange'],
    allowedActions: ['KeyringController:getKeyringsByType'],
  });
}

function buildAccountsControllerMessenger(
  messenger,
): AccountsControllerMessenger {
  return messenger.getRestricted({
    name: 'AccountsController',
    allowedEvents: [
      'SnapController:stateChange',
      'KeyringController:accountRemoved',
      'KeyringController:stateChange',
    ],
    allowedActions: [
      'KeyringController:getAccounts',
      'KeyringController:getKeyringForAccount',
      'KeyringController:getKeyringsByType',
    ],
  });
}

function buildPetNamesBridgeMessenger(
  messenger,
): PetnamesBridgeMessenger<
  PetnamesBridgeAllowedEvents<AccountIdentitiesPetNamesBridgeAllowedEvents>,
  PetnamesBridgeAllowedActions<AccountIdentitiesPetNamesBridgeAllowedActions>
> {
  return messenger.getRestricted({
    name: 'PetnamesBridge',
    allowedEvents: [
      'NameController:stateChange',
      'AccountsController:stateChange',
    ],
    allowedActions: ['AccountsController:listAccounts'],
  });
}

function createNameControllerMock(
  state: NameControllerState,
): jest.Mocked<NameController> {
  return {
    state,
    setName: jest.fn(),
  } as any;
}

describe('AccountIdentitiesPetnamesBridge', () => {
  let messenger;
  let accountsControllerMessenger: AccountsControllerMessenger;
  let petnamesBridgeMessenger: PetnamesBridgeMessenger<
    PetnamesBridgeAllowedEvents<AccountIdentitiesPetNamesBridgeAllowedEvents>,
    PetnamesBridgeAllowedActions<AccountIdentitiesPetNamesBridgeAllowedActions>
  >;

  beforeEach(() => {
    messenger = new ControllerMessenger();
    accountsControllerMessenger = buildAccountsControllerMessenger(messenger);
    petnamesBridgeMessenger = buildPetNamesBridgeMessenger(messenger);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('adds petnames entry when account id entry added', () => {
    const keyringControllerMessenger =
      buildKeyringControllerMessenger(messenger);
    const accountsController = setupAccountsController(
      accountsControllerMessenger,
      EMPTY_ACCOUNTS_CONTROLLER_STATE,
    );
    const nameController = createNameControllerMock(EMPTY_NAME_STATE);
    const bridge = new AccountIdentitiesPetnamesBridge({
      nameController,
      messenger: petnamesBridgeMessenger,
    });
    bridge.init();

    keyringControllerMessenger.publish(
      'KeyringController:stateChange',
      {
        isUnlocked: true,
        keyrings: [
          {
            type: KeyringTypes.hd,
            accounts: [ADDRESS_MOCK],
          },
        ],
      },
      [],
    );

    // Two events are published from the accounts controller when a new account is added
    // thus setName is called twice
    expect(nameController.setName).toHaveBeenCalledTimes(2);
    expect(nameController.setName).toHaveBeenCalledWith(
      createAccountIdentityPetnameEntry(ADDRESS_MOCK, NAME_MOCK),
    );
  });

  it('updates entry when account id is updated', () => {
    const accountsController = setupAccountsController(
      accountsControllerMessenger,
      {
        internalAccounts: {
          accounts: { [MOCK_INTERNAL_ACCOUNT.id]: MOCK_INTERNAL_ACCOUNT },
          selectedAccount: MOCK_INTERNAL_ACCOUNT.id,
        },
      },
    );
    const nameController = createNameControllerMock(
      createNameStateWithPetname(ADDRESS_MOCK, NAME_MOCK),
    );
    const bridge = new AccountIdentitiesPetnamesBridge({
      nameController,
      messenger: petnamesBridgeMessenger,
    });
    bridge.init();

    const UPDATED_NAME = 'updatedName';
    accountsController.setAccountName(MOCK_INTERNAL_ACCOUNT.id, UPDATED_NAME);

    expect(nameController.setName).toHaveBeenCalledTimes(1);
    expect(nameController.setName).toHaveBeenCalledWith(
      createAccountIdentityPetnameEntry(ADDRESS_MOCK, UPDATED_NAME),
    );
  });

  describe('shouldSyncPetname', () => {
    it.each([
      {
        origin: NameOrigin.ACCOUNT_IDENTITY,
        expectedReturn: true,
      },
      {
        origin: NameOrigin.API,
        expectedReturn: false,
      },
    ])(
      'returns $expectedReturn if origin is $origin',
      ({ origin, expectedReturn }) => {
        class TestBridge extends AccountIdentitiesPetnamesBridge {
          public shouldSyncPetname(entry: PetnameEntry): boolean {
            return super.shouldSyncPetname(entry);
          }
        }
        const nameController = createNameControllerMock(EMPTY_NAME_STATE);
        const bridge = new TestBridge({
          nameController,
          messenger: petnamesBridgeMessenger,
        });
        bridge.init();
        expect(bridge.shouldSyncPetname({ origin } as PetnameEntry)).toBe(
          expectedReturn,
        );
      },
    );
  });
});
