import { Messenger } from '@metamask/base-controller';
import { EnsController } from '@metamask/ens-controller';
import { ControllerInitRequest } from '../types.ts';
import { buildControllerInitRequestMock } from '../test/utils.ts';
import {
  getEnsControllerMessenger,
  EnsControllerMessenger,
  getEnsControllerInitMessenger,
  EnsControllerInitMessenger,
} from '../messengers';
import { EnsControllerInit } from './ens-controller-init.ts';

jest.mock('@metamask/ens-controller');

function getInitRequestMock(): jest.Mocked<
  ControllerInitRequest<EnsControllerMessenger, EnsControllerInitMessenger>
> {
  const baseMessenger = new Messenger<never, never>();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getEnsControllerMessenger(baseMessenger),
    initMessenger: getEnsControllerInitMessenger(baseMessenger),
  };

  return requestMock;
}

describe('EnsControllerInit', () => {
  it('initializes the controller', () => {
    const { controller } = EnsControllerInit(getInitRequestMock());
    expect(controller).toBeInstanceOf(EnsController);
  });

  it('passes the proper arguments to the controller', () => {
    EnsControllerInit(getInitRequestMock());

    const controllerMock = jest.mocked(EnsController);
    expect(controllerMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      state: undefined,
      onNetworkDidChange: expect.any(Function),
    });
  });
});
