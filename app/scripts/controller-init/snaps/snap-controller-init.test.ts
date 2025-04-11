import { Messenger } from '@metamask/base-controller';
import { SnapController } from '@metamask/snaps-controllers';

import type {
  SnapControllerInitMessenger,
  SnapControllerMessenger} from '../messengers/snaps';
import {
  getSnapControllerInitMessenger,
  getSnapControllerMessenger
} from '../messengers/snaps';
import { buildControllerInitRequestMock } from '../test/utils';
import type { ControllerInitRequest } from '../types';
import { SnapControllerInit } from './snap-controller-init';

jest.mock('@metamask/snaps-controllers');

function getInitRequestMock(): jest.Mocked<
  ControllerInitRequest<SnapControllerMessenger, SnapControllerInitMessenger>
> {
  const baseMessenger = new Messenger<never, never>();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getSnapControllerMessenger(baseMessenger),
    initMessenger: getSnapControllerInitMessenger(baseMessenger),
  };

  return requestMock;
}

describe('SnapControllerInit', () => {
  it('initializes the controller', () => {
    const { controller } = SnapControllerInit(getInitRequestMock());
    expect(controller).toBeInstanceOf(SnapController);
  });

  it('passes the proper arguments to the controller', () => {
    SnapControllerInit(getInitRequestMock());

    const controllerMock = jest.mocked(SnapController);
    expect(controllerMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      state: undefined,
      closeAllConnections: expect.any(Function),
      dynamicPermissions: ['endowment:caip25'],
      encryptor: expect.any(Object),
      environmentEndowmentPermissions: expect.any(Array),
      excludedPermissions: expect.any(Object),
      featureFlags: {
        allowLocalSnaps: false,
        rejectInvalidPlatformVersion: false,
        requireAllowlist: false,
      },
      getFeatureFlags: expect.any(Function),
      getMnemonicSeed: expect.any(Function),
      preinstalledSnaps: expect.any(Array),
    });
  });
});
