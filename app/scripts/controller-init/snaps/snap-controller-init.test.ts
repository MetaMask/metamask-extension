import { SnapController } from '@metamask/snaps-controllers';
import { Messenger } from '@metamask/base-controller';
import { ControllerInitRequest } from '../types';
import { buildControllerInitRequestMock } from '../test/utils';
import {
  getSnapControllerInitMessenger,
  getSnapControllerMessenger,
  SnapControllerInitMessenger,
  SnapControllerMessenger,
} from '../messengers/snaps';
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
    preinstalledSnaps: [],
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
        useCaip25Permission: true,
        forcePreinstalledSnaps: false,
      },
      getFeatureFlags: expect.any(Function),
      getMnemonicSeed: expect.any(Function),
      preinstalledSnaps: expect.any(Array),
      trackEvent: expect.any(Function),
    });
  });
});
