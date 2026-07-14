import {
  SentinelApiService,
  SentinelApiServiceMessenger,
} from '@metamask-previews/sentinel-api-service';
import { getRootMessenger } from '../lib/messenger';
import { MessengerClientInitRequest } from './types';
import { buildControllerInitRequestMock } from './test/utils';
import { getSentinelApiServiceMessenger } from './messengers/sentinel-api-service-messenger';
import { SentinelApiServiceInit } from './sentinel-api-service-init';

jest.mock('@metamask-previews/sentinel-api-service');

function getInitRequestMock(): jest.Mocked<
  MessengerClientInitRequest<SentinelApiServiceMessenger>
> {
  const baseMessenger = getRootMessenger<never, never>();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getSentinelApiServiceMessenger(baseMessenger),
    initMessenger: undefined,
  };

  return requestMock;
}

describe('SentinelApiServiceInit', () => {
  it('initializes the service', () => {
    const { messengerClient } = SentinelApiServiceInit(getInitRequestMock());
    expect(messengerClient).toBeInstanceOf(SentinelApiService);
  });

  it('passes the proper arguments to the service', () => {
    SentinelApiServiceInit(getInitRequestMock());

    const serviceMock = jest.mocked(SentinelApiService);
    expect(serviceMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      fetch: expect.any(Function),
      clientId: 'extension',
      clientVersion: process.env.METAMASK_VERSION,
    });
  });
});
