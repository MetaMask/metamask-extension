import { Messenger } from '@metamask/base-controller';
import { NameController } from '@metamask/name-controller';
import { ControllerInitRequest } from '../types';
import { buildControllerInitRequestMock } from '../test/utils';
import {
  getNameControllerMessenger,
  NameControllerMessenger,
  getNameControllerInitMessenger,
  NameControllerInitMessenger,
} from '../messengers';
import { NameControllerInit } from './name-controller-init';

jest.mock('@metamask/name-controller');

function getInitRequestMock(): jest.Mocked<
  ControllerInitRequest<NameControllerMessenger, NameControllerInitMessenger>
> {
  const baseMessenger = new Messenger<never, never>();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getNameControllerMessenger(baseMessenger),
    initMessenger: getNameControllerInitMessenger(baseMessenger),
  };

  // @ts-expect-error: Partial mock.
  requestMock.getController.mockImplementation((name: string) => {
    if (name === 'EnsController') {
      return {
        reverseResolveAddress: jest.fn(),
      };
    }

    if (name === 'SnapsNameProvider') {
      return {};
    }

    throw new Error(`Controller ${name} not found.`);
  });

  return requestMock;
}

describe('NameControllerInit', () => {
  it('initializes the controller', () => {
    const { controller } = NameControllerInit(getInitRequestMock());
    expect(controller).toBeInstanceOf(NameController);
  });

  it('passes the proper arguments to the controller', () => {
    NameControllerInit(getInitRequestMock());

    const controllerMock = jest.mocked(NameController);
    expect(controllerMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      state: undefined,
      providers: expect.any(Array),
    });
  });
});
