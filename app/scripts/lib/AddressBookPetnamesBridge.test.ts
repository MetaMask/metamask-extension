import { NameController, NameType } from '@metamask/name-controller';
import { AddressBookController } from '@metamask/address-book-controller';
import {
  AddressBookPetnamesBridge,
  AddressBookPetnamesBridgeMessenger,
} from './AddressBookPetnamesBridge';

const ADDRESS_MOCK = '0xabc';
const NAME_MOCK = 'testName';
const NAME_2_MOCK = 'testName2';
const CHAIN_ID_MOCK = '0x1';

function createAddressBookControllerMock(
  state: any = {},
): jest.Mocked<AddressBookController> {
  return {
    state: {
      addressBook: state,
    },
    set: jest.fn(),
    delete: jest.fn(),
    subscribe: jest.fn(),
  } as any;
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

function createMessengerMock(): jest.Mocked<AddressBookPetnamesBridgeMessenger> {
  return {
    subscribe: jest.fn(),
  } as any;
}

describe('AddressBookPetnamesBridge', () => {
  let addressBookControllerDefault;
  let nameControllerDefault;
  let messengerDefault;
  let options: any;

  beforeEach(() => {
    jest.resetAllMocks();

    addressBookControllerDefault = createAddressBookControllerMock();
    nameControllerDefault = createNameControllerMock();
    messengerDefault = createMessengerMock();

    options = {
      addressBookController: addressBookControllerDefault,
      nameController: nameControllerDefault,
      messenger: messengerDefault,
    };
  });

  describe('NameController', () => {
    it('adds entry when address book entry added', () => {
      new AddressBookPetnamesBridge(options).init();

      addressBookControllerDefault.subscribe.mock.calls[0][0]({
        addressBook: {
          [CHAIN_ID_MOCK]: {
            [ADDRESS_MOCK]: {
              address: ADDRESS_MOCK,
              name: NAME_MOCK,
              chainId: CHAIN_ID_MOCK,
              isEns: true,
            } as any,
          },
        },
      });

      expect(nameControllerDefault.setName).toHaveBeenCalledTimes(1);
      expect(nameControllerDefault.setName).toHaveBeenCalledWith({
        value: ADDRESS_MOCK,
        type: NameType.ETHEREUM_ADDRESS,
        name: NAME_MOCK,
        sourceId: 'ens',
        variation: CHAIN_ID_MOCK,
      });
    });

    it('updates entry when address book entry is updated', () => {
      const nameController = createNameControllerMock({
        [ADDRESS_MOCK]: {
          [CHAIN_ID_MOCK]: {
            name: NAME_MOCK,
            sourceId: null,
            proposedNames: {},
          },
        },
      });

      new AddressBookPetnamesBridge({
        ...options,
        nameController,
      }).init();

      addressBookControllerDefault.subscribe.mock.calls[0][0]({
        addressBook: {
          [CHAIN_ID_MOCK]: {
            [ADDRESS_MOCK]: {
              address: ADDRESS_MOCK,
              name: NAME_2_MOCK,
              chainId: CHAIN_ID_MOCK,
              isEns: false,
            } as any,
          },
        },
      });

      expect(nameController.setName).toHaveBeenCalledTimes(1);
      expect(nameController.setName).toHaveBeenCalledWith({
        value: ADDRESS_MOCK,
        type: NameType.ETHEREUM_ADDRESS,
        name: NAME_2_MOCK,
        sourceId: undefined,
        variation: CHAIN_ID_MOCK,
      });
    });

    it('deletes entry when address book entry is deleted', () => {
      const nameController = createNameControllerMock({
        [ADDRESS_MOCK]: {
          [CHAIN_ID_MOCK]: {
            name: NAME_MOCK,
            sourceId: null,
            proposedNames: {},
          } as any,
        },
      });

      new AddressBookPetnamesBridge({
        ...options,
        nameController,
      }).init();

      addressBookControllerDefault.subscribe.mock.calls[0][0]({
        addressBook: {},
      });

      expect(nameController.setName).toHaveBeenCalledTimes(1);
      expect(nameController.setName).toHaveBeenCalledWith({
        value: ADDRESS_MOCK,
        type: NameType.ETHEREUM_ADDRESS,
        name: null,
        sourceId: undefined,
        variation: CHAIN_ID_MOCK,
      });
    });
  });

  describe('AddressBookController', () => {
    it('adds entry when petname added', () => {
      new AddressBookPetnamesBridge(options).init();

      messengerDefault.subscribe.mock.calls[0][1](
        {
          names: {
            [NameType.ETHEREUM_ADDRESS]: {
              [ADDRESS_MOCK]: {
                [CHAIN_ID_MOCK]: {
                  name: NAME_MOCK,
                  sourceId: null,
                  proposedNames: {},
                },
              },
            },
          },
        },
        undefined,
      );

      expect(addressBookControllerDefault.set).toHaveBeenCalledTimes(1);
      expect(addressBookControllerDefault.set).toHaveBeenCalledWith(
        ADDRESS_MOCK,
        NAME_MOCK,
        CHAIN_ID_MOCK,
      );
    });

    it('updates entry when petname updated', () => {
      const addressBookController = createAddressBookControllerMock({
        [CHAIN_ID_MOCK]: {
          [ADDRESS_MOCK]: {
            address: ADDRESS_MOCK,
            name: NAME_MOCK,
            chainId: CHAIN_ID_MOCK,
            isEns: false,
          } as any,
        },
      });

      new AddressBookPetnamesBridge({
        ...options,
        addressBookController,
      }).init();

      messengerDefault.subscribe.mock.calls[0][1](
        {
          names: {
            [NameType.ETHEREUM_ADDRESS]: {
              [ADDRESS_MOCK]: {
                [CHAIN_ID_MOCK]: {
                  name: NAME_2_MOCK,
                  sourceId: null,
                  proposedNames: {},
                },
              },
            },
          },
        },
        undefined,
      );

      expect(addressBookController.set).toHaveBeenCalledTimes(1);
      expect(addressBookController.set).toHaveBeenCalledWith(
        ADDRESS_MOCK,
        NAME_2_MOCK,
        CHAIN_ID_MOCK,
      );
    });

    it('deletes entry when petname deleted', () => {
      const addressBookController = createAddressBookControllerMock({
        [CHAIN_ID_MOCK]: {
          [ADDRESS_MOCK]: {
            address: ADDRESS_MOCK,
            name: NAME_MOCK,
            chainId: CHAIN_ID_MOCK,
            isEns: false,
          } as any,
        },
      });

      new AddressBookPetnamesBridge({
        ...options,
        addressBookController,
      }).init();

      messengerDefault.subscribe.mock.calls[0][1](
        {
          names: {
            [NameType.ETHEREUM_ADDRESS]: {},
          },
        },
        undefined,
      );

      expect(addressBookController.delete).toHaveBeenCalledTimes(1);
      expect(addressBookController.delete).toHaveBeenCalledWith(
        CHAIN_ID_MOCK,
        ADDRESS_MOCK,
      );
    });
  });
});
