import {
  ConfigRegistryController,
  ConfigRegistryControllerMessenger,
} from '@metamask/config-registry-controller';
import { getRootMessenger } from '../lib/messenger';
import { MessengerClientInitRequest } from './types';
import { buildControllerInitRequestMock } from './test/utils';
import { getConfigRegistryControllerMessenger } from './messengers';
import { ConfigRegistryControllerInit } from './config-registry-controller-init';

jest.mock('@metamask/config-registry-controller');

function getInitRequestMock(): jest.Mocked<
  MessengerClientInitRequest<ConfigRegistryControllerMessenger>
> {
  const baseMessenger = getRootMessenger<never, never>();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getConfigRegistryControllerMessenger(baseMessenger),
    initMessenger: undefined,
  };

  return requestMock;
}

describe('ConfigRegistryControllerInit', () => {
  it('initializes the controller', () => {
    const { messengerClient } =
      ConfigRegistryControllerInit(getInitRequestMock());
    expect(messengerClient).toBeInstanceOf(ConfigRegistryController);
  });

  it('passes the proper arguments to the controller', () => {
    ConfigRegistryControllerInit(getInitRequestMock());

    const controllerMock = jest.mocked(ConfigRegistryController);
    expect(controllerMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      state: undefined,
    });
  });
});
