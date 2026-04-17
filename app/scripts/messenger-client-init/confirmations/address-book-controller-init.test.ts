import { AddressBookController } from '@metamask/address-book-controller';
import { MessengerClientInitRequest } from '../types';
import { buildControllerInitRequestMock } from '../test/utils';
import {
  getAddressBookControllerMessenger,
  AddressBookControllerMessenger,
} from '../messengers';
import { getRootMessenger } from '../../lib/messenger';
import { AddressBookControllerInit } from './address-book-controller-init';

jest.mock('@metamask/address-book-controller');

function getInitRequestMock(): jest.Mocked<
  MessengerClientInitRequest<AddressBookControllerMessenger>
> {
  const baseMessenger = getRootMessenger();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getAddressBookControllerMessenger(baseMessenger),
    initMessenger: undefined,
  };

  return requestMock;
}

describe('AddressBookControllerInit', () => {
  it('initializes the controller', () => {
    const { messengerClient } = AddressBookControllerInit(getInitRequestMock());
    expect(messengerClient).toBeInstanceOf(AddressBookController);
  });

  it('passes the proper arguments to the controller', () => {
    AddressBookControllerInit(getInitRequestMock());

    const controllerMock = jest.mocked(AddressBookController);
    expect(controllerMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      state: undefined,
    });
  });
});
