import { NameController } from '@metamask/name-controller';
import {
  PreferencesController,
  PreferencesControllerState,
} from '../controllers/preferences';
import { AccountIdentitiesPetnamesBridge } from './AccountIdentitiesPetnamesBridge';

const ADDRESS_A = '0xabc';
const NAME_1 = 'name1';
const NAME_2 = 'name2';

interface MockPreferencesController extends jest.Mocked<PreferencesController> {
  store: jest.Mocked<PreferencesController['store']>;
}

function createPreferencesControllerMock(
  identities: PreferencesControllerState['identities'] = {},
): MockPreferencesController {
  return {
    store: {
      getState: jest.fn(() => ({ identities })),
      subscribe: jest.fn(),
    },
  };
}

function createNameControllerMock(
  state: any = {},
): jest.Mocked<NameController> {
  return {
    state: {
      names: {
        ethereumAddress: state,
      },
    },
    setName: jest.fn(),
  } as any;
}

describe('AccountIdentitiesPetnamesBridge', () => {
  let preferencesController: MockPreferencesController;
  let nameController: NameController;

  beforeEach(() => {
    jest.resetAllMocks();

    preferencesController = createPreferencesControllerMock();
    nameController = createNameControllerMock();
  });

  it('adds petnames entry when account id entry added', () => {
    const bridge = new AccountIdentitiesPetnamesBridge({
      preferencesController,
      nameController,
      messenger: {} as any,
    });
    bridge.init();

    preferencesController.store.subscribe.mock.calls[0][0]({
      identities: {
        [ADDRESS_A]: {
          address: ADDRESS_A,
          name: NAME_1,
        },
      },
    });

    expect(nameController.setName).toHaveBeenCalledTimes(1);
    expect(nameController.setName).toHaveBeenCalledWith({
      value: ADDRESS_A,
      type: ACCOUNT_LABEL_NAME_TYPE,
      variation: ACCOUNT_LABEL_CHAIN_ID,
      name: NAME_1,
    });
  });

  it('updates entry when account id is updated', () => {
    nameController = createNameControllerMock({
      [ADDRESS_A]: {
        [ACCOUNT_LABEL_CHAIN_ID]: {
          name: NAME_1,
          proposedNames: {},
        },
      },
    });

    preferencesController = createPreferencesControllerMock({
      [ADDRESS_A]: {
        address: ADDRESS_A,
        name: NAME_1,
      },
    });

    setupAccountLabelsPetnamesBridge(
      preferencesController,
      nameController,
    );

    preferencesController.store.subscribe.mock.calls[0][0]({
      identities: {
        [ADDRESS_A]: {
          address: ADDRESS_A,
          name: NAME_2,
        },
      },
    });

    expect(nameController.setName).toHaveBeenCalledTimes(1);
    expect(nameController.setName).toHaveBeenCalledWith({
      value: ADDRESS_A,
      type: ACCOUNT_LABEL_NAME_TYPE,
      name: NAME_2,
      sourceId: undefined,
      variation: ACCOUNT_LABEL_CHAIN_ID,
    });
  });

  it('deletes entry when address book entry is deleted', () => {
    nameController = createNameControllerMock({
      [ADDRESS_A]: {
        [ACCOUNT_LABEL_CHAIN_ID]: {
          name: NAME_1,
          proposedNames: {},
        } as any,
      },
    });

    preferencesController = createPreferencesControllerMock({
      [ADDRESS_A]: {
        address: ADDRESS_A,
        name: NAME_1,
      },
    });

    setupAccountLabelsPetnamesBridge(
      preferencesController,
      nameController,
    );

    preferencesController.store.subscribe.mock.calls[0][0]({
      identities: {},
    });

    expect(nameController.setName).toHaveBeenCalledTimes(1);
    expect(nameController.setName).toHaveBeenCalledWith({
      value: ADDRESS_A,
      type: ACCOUNT_LABEL_NAME_TYPE,
      name: null,
      sourceId: undefined,
      variation: ACCOUNT_LABEL_CHAIN_ID,
    });
  });
});
