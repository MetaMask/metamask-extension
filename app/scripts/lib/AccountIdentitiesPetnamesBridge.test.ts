import {
  FALLBACK_VARIATION,
  NameController,
  NameControllerState,
  NameType,
  NameOrigin,
} from '@metamask/name-controller';
import {
  PreferencesController,
  PreferencesControllerState,
} from '../controllers/preferences';
import { AccountIdentitiesPetnamesBridge } from './AccountIdentitiesPetnamesBridge';
import { PetnameEntry } from './AbstractPetnamesBridge';

const ADDRESS_MOCK = '0xabc';
const NAME_MOCK = 'name1';

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

const EMPTY_PREFERENCES_STATE = {
  identities: {},
} as PreferencesControllerState;

/**
 * Creates PreferencesControllerState containing a single identity with the given name and address.
 *
 * @param address
 * @param name
 */
function createPreferencesStateWithIdentity(
  address: string,
  name: string,
): PreferencesControllerState {
  return {
    ...EMPTY_PREFERENCES_STATE,
    identities: {
      [address]: {
        address,
        name,
      },
    },
  };
}

function createPreferencesControllerMock(
  initialState: PreferencesControllerState,
): jest.Mocked<PreferencesController> & {
  store: jest.Mocked<PreferencesController['store']>;
  updateMockStateAndTriggerListener(newState: PreferencesControllerState): void;
} {
  let state = initialState;
  return {
    store: {
      getState: jest.fn(() => state),
      subscribe: jest.fn(),
    },
    updateMockStateAndTriggerListener(newState) {
      state = newState;
      this.store.subscribe.mock.calls[0][0](state);
    },
  };
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
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('adds petnames entry when account id entry added', () => {
    const preferencesController = createPreferencesControllerMock(
      EMPTY_PREFERENCES_STATE,
    );
    const nameController = createNameControllerMock(EMPTY_NAME_STATE);
    const bridge = new AccountIdentitiesPetnamesBridge({
      preferencesController,
      nameController,
      messenger: {} as any,
    });
    bridge.init();

    preferencesController.updateMockStateAndTriggerListener(
      createPreferencesStateWithIdentity(ADDRESS_MOCK, NAME_MOCK),
    );

    expect(nameController.setName).toHaveBeenCalledTimes(1);
    expect(nameController.setName).toHaveBeenCalledWith(
      createAccountIdentityPetnameEntry(ADDRESS_MOCK, NAME_MOCK),
    );
  });

  it('updates entry when account id is updated', () => {
    const preferencesController = createPreferencesControllerMock(
      createPreferencesStateWithIdentity(ADDRESS_MOCK, NAME_MOCK),
    );
    const nameController = createNameControllerMock(
      createNameStateWithPetname(ADDRESS_MOCK, NAME_MOCK),
    );
    const bridge = new AccountIdentitiesPetnamesBridge({
      preferencesController,
      nameController,
      messenger: {} as any,
    });
    bridge.init();

    const UPDATED_NAME = 'updatedName';

    preferencesController.updateMockStateAndTriggerListener(
      createPreferencesStateWithIdentity(ADDRESS_MOCK, UPDATED_NAME),
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
        const preferencesController = createPreferencesControllerMock(
          EMPTY_PREFERENCES_STATE,
        );
        const nameController = createNameControllerMock(EMPTY_NAME_STATE);
        const bridge = new TestBridge({
          preferencesController,
          nameController,
          messenger: {} as any,
        });
        bridge.init();
        expect(bridge.shouldSyncPetname({ origin } as PetnameEntry)).toBe(
          expectedReturn,
        );
      },
    );
  });
});
