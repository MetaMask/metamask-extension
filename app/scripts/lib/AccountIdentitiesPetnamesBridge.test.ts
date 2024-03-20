import {
  FALLBACK_VARIATION,
  NameController,
  NameControllerState,
  NameType,
  NameOrigin,
} from '@metamask/name-controller';
import { cloneDeep } from 'lodash';
import { AccountsControllerState } from '@metamask/accounts-controller';
import { KeyringTypes } from '@metamask/keyring-controller';
import { createMockInternalAccount } from '../../../test/jest/mocks';
import {
  AccountIdentitiesPetnamesBridgeActions,
  AccountIdentitiesPetnamesBridgeEvents,
  AccountIdentitiesPetnamesBridge,
  AccountIdentitiesPetnamesBridgeMessenger,
} from './AccountIdentitiesPetnamesBridge';
import {
  PetnameEntry,
  PetnamesBridgeMessenger,
} from './AbstractPetnamesBridge';

const ADDRESS_MOCK = '0xabc';
const NAME_MOCK = 'Account 1';

const MOCK_INTERNAL_ACCOUNT = createMockInternalAccount({
  address: ADDRESS_MOCK,
  name: NAME_MOCK,
  keyringType: KeyringTypes.hd,
  is4337: false,
  snapOptions: undefined,
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

function createMessengerMock(): jest.Mocked<AccountIdentitiesPetnamesBridgeMessenger> {
  return {
    publish: jest.fn(),
    subscribe: jest.fn(),
    call: jest.fn(),
  } as unknown as jest.Mocked<AccountIdentitiesPetnamesBridgeMessenger>;
}

function createNameControllerMock(
  state: NameControllerState,
): jest.Mocked<NameController> {
  return {
    state,
    setName: jest.fn(),
  } as any;
}

function simulateSubscribe(
  messenger: jest.Mocked<AccountIdentitiesPetnamesBridgeMessenger>,
  stateChange: AccountsControllerState,
  patch: any[],
) {
  const listener = messenger.subscribe.mock.calls[0][1] as (
    stateChange: AccountsControllerState,
    patch: any[],
  ) => void;
  listener(stateChange, patch);
}

describe('AccountIdentitiesPetnamesBridge', () => {
  let messenger: jest.Mocked<
    PetnamesBridgeMessenger<
      AccountIdentitiesPetnamesBridgeEvents,
      AccountIdentitiesPetnamesBridgeActions
    >
  >;

  beforeEach(() => {
    messenger = createMessengerMock();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('adds petnames entry when account id entry added', () => {
    const nameController = createNameControllerMock(EMPTY_NAME_STATE);
    const bridge = new AccountIdentitiesPetnamesBridge({
      nameController,
      messenger,
    });
    bridge.init();

    // mock listAccounts call
    messenger.call.mockReturnValue([MOCK_INTERNAL_ACCOUNT]);

    simulateSubscribe(
      messenger,
      {
        internalAccounts: {
          accounts: { [MOCK_INTERNAL_ACCOUNT.id]: MOCK_INTERNAL_ACCOUNT },
          selectedAccount: MOCK_INTERNAL_ACCOUNT.id,
        },
      },
      [],
    );

    expect(nameController.setName).toHaveBeenCalledTimes(1);
    expect(nameController.setName).toHaveBeenCalledWith(
      createAccountIdentityPetnameEntry(ADDRESS_MOCK, NAME_MOCK),
    );
  });

  it('updates entry when account id is updated', () => {
    const nameController = createNameControllerMock(
      createNameStateWithPetname(ADDRESS_MOCK, NAME_MOCK),
    );
    const bridge = new AccountIdentitiesPetnamesBridge({
      nameController,
      messenger,
    });
    bridge.init();

    const UPDATED_NAME = 'updatedName';
    const updatedMock = cloneDeep(MOCK_INTERNAL_ACCOUNT);
    updatedMock.metadata.name = UPDATED_NAME;

    // mock listAccounts call
    messenger.call.mockReturnValue([updatedMock]);

    simulateSubscribe(
      messenger,
      {
        internalAccounts: {
          accounts: { [updatedMock.id]: updatedMock },
          selectedAccount: updatedMock.id,
        },
      },
      [],
    );

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
          messenger,
        });
        bridge.init();
        expect(bridge.shouldSyncPetname({ origin } as PetnameEntry)).toBe(
          expectedReturn,
        );
      },
    );
  });
});
