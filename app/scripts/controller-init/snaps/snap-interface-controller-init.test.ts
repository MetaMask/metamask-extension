import { SnapInterfaceController } from '@metamask/snaps-controllers';
import { ControllerMessenger } from '@metamask/base-controller';
import { ControllerInitRequest } from '../types';
import { buildControllerInitRequestMock } from '../test/utils';
import { SnapInterfaceControllerInit } from './snap-interface-controller-init';
import {
  getSnapInterfaceControllerMessenger,
  SnapInterfaceControllerMessenger,
} from './snap-interface-controller-messenger';

jest.mock('@metamask/snaps-controllers');

function getInitRequestMock(): jest.Mocked<
  ControllerInitRequest<SnapInterfaceControllerMessenger>
> {
  const baseControllerMessenger = new ControllerMessenger<never, never>();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getSnapInterfaceControllerMessenger(
      baseControllerMessenger,
    ),
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
