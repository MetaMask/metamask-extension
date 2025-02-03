import { ControllerMessenger } from '@metamask/base-controller';
import { JsonSnapsRegistry } from '@metamask/snaps-controllers';
import { ControllerInitRequest } from '../types';
import { buildControllerInitRequestMock } from '../test/utils';
import {
  getSnapsRegistryMessenger,
  SnapsRegistryMessenger,
} from './snaps-registry-messenger';
import { SnapsRegistryInit } from './snaps-registry-init';

jest.mock('@metamask/snaps-controllers');

function getInitRequestMock(): jest.Mocked<
  ControllerInitRequest<SnapsRegistryMessenger>
> {
  const baseControllerMessenger = new ControllerMessenger<never, never>();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getSnapsRegistryMessenger(baseControllerMessenger),
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
      publicKey:
        '0x025b65308f0f0fb8bc7f7ff87bfc296e0330eee5d3c1d1ee4a048b2fd6a86fa0a6',
      url: {
        registry: 'https://acl.execution.metamask.io/latest/registry.json',
        signature: 'https://acl.execution.metamask.io/latest/signature.json',
      },
    });
  });
});
