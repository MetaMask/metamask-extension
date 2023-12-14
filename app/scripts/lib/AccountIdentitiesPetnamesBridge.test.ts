import { NameController } from '@metamask/name-controller';
import {
  PreferencesController,
  PreferencesControllerState,
} from '../controllers/preferences';
import setupAccountLabelsPetnamesBridge, {
  ACCOUNT_LABEL_NAME_TYPE,
  ACCOUNT_LABEL_CHAIN_ID,
} from './setupAccountLabelsPetnamesBridge';

const ADDRESS_MOCK = '0xabc';
const NAME_MOCK = 'testName';
const NAME_2_MOCK = 'testName2';

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

describe('setupAccountLabelsPetnamesBridge', () => {
  let preferencesControllerDefault: MockPreferencesController;
  let nameControllerDefault: NameController;

  beforeEach(() => {
    jest.resetAllMocks();

    preferencesControllerDefault = createPreferencesControllerMock();
    nameControllerDefault = createNameControllerMock();
  });

  it('adds entry when account id entry added', () => {
    setupAccountLabelsPetnamesBridge(
      preferencesControllerDefault,
      nameControllerDefault,
    );

    preferencesControllerDefault.store.subscribe.mock.calls[0][0]({
      identities: {
        [ADDRESS_MOCK]: {
          address: ADDRESS_MOCK,
          name: NAME_MOCK,
        },
      },
    });

    expect(nameControllerDefault.setName).toHaveBeenCalledTimes(1);
    expect(nameControllerDefault.setName).toHaveBeenCalledWith({
      value: ADDRESS_MOCK,
      type: ACCOUNT_LABEL_NAME_TYPE,
      variation: ACCOUNT_LABEL_CHAIN_ID,
      name: NAME_MOCK,
    });
  });

  it('updates entry when account id is updated', () => {
    nameControllerDefault = createNameControllerMock({
      [ADDRESS_MOCK]: {
        [ACCOUNT_LABEL_CHAIN_ID]: {
          name: NAME_MOCK,
          proposedNames: {},
        },
      },
    });

    preferencesControllerDefault = createPreferencesControllerMock({
      [ADDRESS_MOCK]: {
        address: ADDRESS_MOCK,
        name: NAME_MOCK,
      },
    });

    setupAccountLabelsPetnamesBridge(
      preferencesControllerDefault,
      nameControllerDefault,
    );

    preferencesControllerDefault.store.subscribe.mock.calls[0][0]({
      identities: {
        [ADDRESS_MOCK]: {
          address: ADDRESS_MOCK,
          name: NAME_2_MOCK,
        },
      },
    });

    expect(nameControllerDefault.setName).toHaveBeenCalledTimes(1);
    expect(nameControllerDefault.setName).toHaveBeenCalledWith({
      value: ADDRESS_MOCK,
      type: ACCOUNT_LABEL_NAME_TYPE,
      name: NAME_2_MOCK,
      sourceId: undefined,
      variation: ACCOUNT_LABEL_CHAIN_ID,
    });
  });

  it('deletes entry when address book entry is deleted', () => {
    nameControllerDefault = createNameControllerMock({
      [ADDRESS_MOCK]: {
        [ACCOUNT_LABEL_CHAIN_ID]: {
          name: NAME_MOCK,
          proposedNames: {},
        } as any,
      },
    });

    preferencesControllerDefault = createPreferencesControllerMock({
      [ADDRESS_MOCK]: {
        address: ADDRESS_MOCK,
        name: NAME_MOCK,
      },
    });

    setupAccountLabelsPetnamesBridge(
      preferencesControllerDefault,
      nameControllerDefault,
    );

    preferencesControllerDefault.store.subscribe.mock.calls[0][0]({
      identities: {},
    });

    expect(nameControllerDefault.setName).toHaveBeenCalledTimes(1);
    expect(nameControllerDefault.setName).toHaveBeenCalledWith({
      value: ADDRESS_MOCK,
      type: ACCOUNT_LABEL_NAME_TYPE,
      name: null,
      sourceId: undefined,
      variation: ACCOUNT_LABEL_CHAIN_ID,
    });
  });
});
