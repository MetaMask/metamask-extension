import { Messenger } from '@metamask/base-controller';
import { JsonSnapsRegistry } from '@metamask/snaps-controllers';
import { ControllerInitRequest } from '../types';
import { buildControllerInitRequestMock } from '../test/utils';
import {
  getSnapsRegistryMessenger,
  SnapsRegistryMessenger,
} from '../messengers/snaps';
import { SnapsRegistryInit } from './snaps-registry-init';

jest.mock('@metamask/snaps-controllers');

function getInitRequestMock(): jest.Mocked<
  ControllerInitRequest<SnapsRegistryMessenger>
> {
  const baseMessenger = new Messenger<never, never>();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getSnapsRegistryMessenger(baseMessenger),
    initMessenger: undefined,
  };

  return requestMock;
}

describe('SnapsRegistryInit', () => {
  it('initializes the controller', () => {
    const { controller } = SnapsRegistryInit(getInitRequestMock());
    expect(controller).toBeInstanceOf(JsonSnapsRegistry);
  });

  it('passes the proper arguments to the controller', () => {
    SnapsRegistryInit(getInitRequestMock());

    const controllerMock = jest.mocked(JsonSnapsRegistry);
    expect(controllerMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      state: undefined,
      refetchOnAllowlistMiss: false,
    });
  });
});
