import { EnsController } from '@metamask/ens-controller';
import { MessengerClientInitRequest } from '../types';
import { buildControllerInitRequestMock } from '../test/utils';
import {
  getEnsControllerMessenger,
  EnsControllerMessenger,
  getEnsControllerInitMessenger,
  EnsControllerInitMessenger,
} from '../messengers';
import { getRootMessenger } from '../../lib/messenger';
import { EnsControllerInit } from './ens-controller-init';

jest.mock('@metamask/ens-controller');

function getInitRequestMock(): jest.Mocked<
  MessengerClientInitRequest<EnsControllerMessenger, EnsControllerInitMessenger>
> {
  const baseMessenger = getRootMessenger<never, never>();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getEnsControllerMessenger(baseMessenger),
    initMessenger: getEnsControllerInitMessenger(baseMessenger),
  };

  return requestMock;
}

describe('EnsControllerInit', () => {
  it('initializes the controller', () => {
    const { messengerClient } = EnsControllerInit(getInitRequestMock());
    expect(messengerClient).toBeInstanceOf(EnsController);
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
