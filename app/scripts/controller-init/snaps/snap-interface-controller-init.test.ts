import { Messenger } from '@metamask/base-controller';
import { SnapInterfaceController } from '@metamask/snaps-controllers';

import type { SnapInterfaceControllerMessenger } from '../messengers/snaps';
import { getSnapInterfaceControllerMessenger } from '../messengers/snaps';
import { buildControllerInitRequestMock } from '../test/utils';
import type { ControllerInitRequest } from '../types';
import { SnapInterfaceControllerInit } from './snap-interface-controller-init';

jest.mock('@metamask/snaps-controllers');

function getInitRequestMock(): jest.Mocked<
  ControllerInitRequest<SnapInterfaceControllerMessenger>
> {
  const baseMessenger = new Messenger<never, never>();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getSnapInterfaceControllerMessenger(baseMessenger),
    initMessenger: undefined,
  };

  return requestMock;
}

describe('SnapInterfaceControllerInit', () => {
  it('initializes the controller', () => {
    const { controller } = SnapInterfaceControllerInit(getInitRequestMock());
    expect(controller).toBeInstanceOf(SnapInterfaceController);
  });

  it('passes the proper arguments to the controller', () => {
    SnapInterfaceControllerInit(getInitRequestMock());

    const controllerMock = jest.mocked(SnapInterfaceController);
    expect(controllerMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      state: undefined,
    });
  });
});
