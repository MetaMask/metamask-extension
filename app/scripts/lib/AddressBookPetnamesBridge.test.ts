import {
  NameController,
  NameControllerState,
  NameOrigin,
  NameType,
  SetNameRequest,
} from '@metamask/name-controller';
import {
  AddressBookController,
  AddressBookState,
} from '@metamask/address-book-controller';
import { AddressBookPetnamesBridge } from './AddressBookPetnamesBridge';
import { PetnamesBridgeMessenger } from './AbstractPetnamesBridge';

const ADDRESS_MOCK = '0xabc';
const NAME_MOCK = 'testName';
const NAME_2_MOCK = 'testName2';
const CHAIN_ID_MOCK = '0x1';

function createAddressBookControllerMock(
  state: AddressBookState,
): jest.Mocked<AddressBookController> & {
  // Override the definition of state. Otherwise state is readonly.
  state: AddressBookState;
} {
  return {
    state,
    set: jest.fn(),
    delete: jest.fn(),
    subscribe: jest.fn(),
  } as unknown as jest.Mocked<AddressBookController>;
}

function createNameControllerMock(
  state: NameControllerState,
): jest.Mocked<NameController> {
  return {
    state,
    setName: jest.fn(),
  } as any;
}

function createMessengerMock(): jest.Mocked<PetnamesBridgeMessenger> {
  return {
    subscribe: jest.fn(),
  } as any;
}

const EMPTY_NAME_STATE: NameControllerState = {
  names: {
    [NameType.ETHEREUM_ADDRESS]: {},
  },
  nameSources: {},
};

/**
 * Creates NameControllerState containing a single Petname with the given name and address.
 *
 * @param address
 * @param name
 */
function createNameState(address: string, name: string): NameControllerState {
  return {
    ...EMPTY_NAME_STATE,
    names: {
      [NameType.ETHEREUM_ADDRESS]: {
        [address]: {
          [CHAIN_ID_MOCK]: {
            name,
            sourceId: null,
            proposedNames: {},
            origin: NameOrigin.ADDRESS_BOOK,
          },
        },
      },
    },
  };
}

const EMPTY_ADDRESS_BOOK_STATE: AddressBookState = {
  addressBook: {},
};

/**
 * Creates AddressBookState containing a single entry with the given name, address and isEns value.
 *
 * @param address
 * @param name
 * @param isEns
 */
function createAddressBookState(
  address: string,
  name: string,
  isEns: boolean,
): AddressBookState {
  return {
    ...EMPTY_ADDRESS_BOOK_STATE,
    addressBook: {
      [CHAIN_ID_MOCK]: {
        [address]: {
          address,
          name,
          isEns,
          chainId: CHAIN_ID_MOCK,
          memo: '',
        },
      },
    },
  };
}

describe('AddressBookPetnamesBridge', () => {
  let messenger: jest.Mocked<PetnamesBridgeMessenger>;

  beforeEach(() => {
    jest.resetAllMocks();

    messenger = createMessengerMock();
  });

  describe('NameController', () => {
    it('adds entry when address book entry added', () => {
      const addressBookController = createAddressBookControllerMock(
        EMPTY_ADDRESS_BOOK_STATE,
      );
      const nameController = createNameControllerMock(EMPTY_NAME_STATE);
      new AddressBookPetnamesBridge({
        addressBookController,
        nameController,
        messenger,
      }).init();

      addressBookController.state = createAddressBookState(
        ADDRESS_MOCK,
        NAME_MOCK,
        true,
      );
      const listener = addressBookController.subscribe.mock
        .calls[0][0] as () => void;
      listener();

      expect(nameController.setName).toHaveBeenCalledTimes(1);
      expect(nameController.setName).toHaveBeenCalledWith({
        value: ADDRESS_MOCK,
        type: NameType.ETHEREUM_ADDRESS,
        name: NAME_MOCK,
        sourceId: 'ens',
        variation: CHAIN_ID_MOCK,
        origin: NameOrigin.ADDRESS_BOOK,
      } as SetNameRequest);
    });

    it('updates entry when address book entry is updated', () => {
      const addressBookController = createAddressBookControllerMock(
        createAddressBookState(ADDRESS_MOCK, NAME_MOCK, true),
      );
      const nameController = createNameControllerMock(
        createNameState(ADDRESS_MOCK, NAME_MOCK),
      );

      new AddressBookPetnamesBridge({
        addressBookController,
        nameController,
        messenger,
      }).init();

      addressBookController.state = createAddressBookState(
        ADDRESS_MOCK,
        NAME_2_MOCK,
        false,
      );
      const listener = addressBookController.subscribe.mock
        .calls[0][0] as () => void;
      listener();

      expect(nameController.setName).toHaveBeenCalledTimes(1);
      expect(nameController.setName).toHaveBeenCalledWith({
        value: ADDRESS_MOCK,
        type: NameType.ETHEREUM_ADDRESS,
        name: NAME_2_MOCK,
        sourceId: undefined,
        variation: CHAIN_ID_MOCK,
        origin: NameOrigin.ADDRESS_BOOK,
      } as SetNameRequest);
    });

    it('deletes entry when address book entry is deleted', () => {
      const addressBookController = createAddressBookControllerMock(
        createAddressBookState(ADDRESS_MOCK, NAME_MOCK, true),
      );
      const nameController = createNameControllerMock(
        createNameState(ADDRESS_MOCK, NAME_MOCK),
      );
      new AddressBookPetnamesBridge({
        addressBookController,
        nameController,
        messenger,
      }).init();

      addressBookController.state = EMPTY_ADDRESS_BOOK_STATE;

      const listener = addressBookController.subscribe.mock
        .calls[0][0] as () => void;
      listener();

      expect(nameController.setName).toHaveBeenCalledTimes(1);
      expect(nameController.setName).toHaveBeenCalledWith({
        value: ADDRESS_MOCK,
        type: NameType.ETHEREUM_ADDRESS,
        name: null,
        sourceId: undefined,
        variation: CHAIN_ID_MOCK,
      } as SetNameRequest);
    });
  });

  describe('AddressBookController', () => {
    it('adds entry when petname added', () => {
      const addressBookController = createAddressBookControllerMock(
        EMPTY_ADDRESS_BOOK_STATE,
      );
      const nameController = createNameControllerMock(EMPTY_NAME_STATE);
      new AddressBookPetnamesBridge({
        addressBookController,
        nameController,
        messenger,
      }).init();

      nameController.state = createNameState(ADDRESS_MOCK, NAME_MOCK);

      const listener = messenger.subscribe.mock.calls[0][1] as () => void;
      listener();

      expect(addressBookController.set).toHaveBeenCalledTimes(1);
      expect(addressBookController.set).toHaveBeenCalledWith(
        ADDRESS_MOCK,
        NAME_MOCK,
        CHAIN_ID_MOCK,
      );
    });

    it('updates entry when petname updated', () => {
      const addressBookController = createAddressBookControllerMock(
        createAddressBookState(ADDRESS_MOCK, NAME_MOCK, false),
      );
      const nameController = createNameControllerMock(
        createNameState(ADDRESS_MOCK, NAME_MOCK),
      );
      new AddressBookPetnamesBridge({
        addressBookController,
        nameController,
        messenger,
      }).init();

      nameController.state = createNameState(ADDRESS_MOCK, NAME_2_MOCK);

      const listener = messenger.subscribe.mock.calls[0][1] as () => void;
      listener();

      expect(addressBookController.set).toHaveBeenCalledTimes(1);
      expect(addressBookController.set).toHaveBeenCalledWith(
        ADDRESS_MOCK,
        NAME_2_MOCK,
        CHAIN_ID_MOCK,
      );
    });

    it('deletes entry when petname deleted', () => {
      const addressBookController = createAddressBookControllerMock(
        createAddressBookState(ADDRESS_MOCK, NAME_MOCK, false),
      );
      const nameController = createNameControllerMock(
        createNameState(ADDRESS_MOCK, NAME_MOCK),
      );
      new AddressBookPetnamesBridge({
        addressBookController,
        nameController,
        messenger,
      }).init();

      nameController.state = EMPTY_NAME_STATE;

      const listener = messenger.subscribe.mock.calls[0][1] as () => void;
      listener();

      expect(addressBookController.delete).toHaveBeenCalledTimes(1);
      expect(addressBookController.delete).toHaveBeenCalledWith(
        CHAIN_ID_MOCK,
        ADDRESS_MOCK,
      );
    });
  });
});
