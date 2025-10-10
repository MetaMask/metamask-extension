import { Messenger } from '@metamask/base-controller';
import { AddressBookController } from '@metamask/address-book-controller';
import { ControllerInitRequest } from '../types';
import { buildControllerInitRequestMock } from '../test/utils';
import {
  getAddressBookControllerMessenger,
  AddressBookControllerMessenger,
} from '../messengers';
import { AddressBookControllerInit } from './address-book-controller-init';

jest.mock('@metamask/address-book-controller');

function getInitRequestMock(): jest.Mocked<
  ControllerInitRequest<AddressBookControllerMessenger>
> {
  const baseMessenger = new Messenger<never, never>();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getAddressBookControllerMessenger(baseMessenger),
    initMessenger: undefined,
  };

  return requestMock;
}

describe('AddressBookControllerInit', () => {
  it('initializes the controller', () => {
    const { controller } = AddressBookControllerInit(getInitRequestMock());
    expect(controller).toBeInstanceOf(AddressBookController);
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
