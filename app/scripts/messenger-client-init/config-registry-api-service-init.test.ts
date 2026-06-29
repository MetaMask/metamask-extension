import { SDK } from '@metamask/profile-sync-controller';
import {
  ConfigRegistryApiService,
  ConfigRegistryApiServiceMessenger,
} from '@metamask/config-registry-controller';
import { getRootMessenger } from '../lib/messenger';
import { MessengerClientInitRequest } from './types';
import { buildControllerInitRequestMock } from './test/utils';
import { getConfigRegistryApiServiceMessenger } from './messengers/config-registry-api-service-messenger';
import { ConfigRegistryApiServiceInit } from './config-registry-api-service-init';

jest.mock('@metamask/config-registry-controller');

function getInitRequestMock(): jest.Mocked<
  MessengerClientInitRequest<ConfigRegistryApiServiceMessenger>
> {
  const baseMessenger = getRootMessenger<never, never>();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getConfigRegistryApiServiceMessenger(baseMessenger),
    initMessenger: undefined,
  };

  return requestMock;
}

describe('ConfigRegistryApiServiceInit', () => {
  it('initializes the service', () => {
    const { messengerClient } =
      ConfigRegistryApiServiceInit(getInitRequestMock());
    expect(messengerClient).toBeInstanceOf(ConfigRegistryApiService);
  });

  it('passes the proper arguments to the controller', () => {
    ConfigRegistryApiServiceInit(getInitRequestMock());

    const controllerMock = jest.mocked(ConfigRegistryApiService);
    expect(controllerMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      fetch: expect.any(Function),
      env: SDK.Env.PRD,
    });
  });
});
