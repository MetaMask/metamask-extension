import { MessengerClientInitRequest } from './types';
import { buildControllerInitRequestMock } from './test/utils';
import { getRootMessenger } from '../lib/messenger';
import {
  BackgroundApiService,
  BackgroundApiServiceMessenger,
} from '../services/background-api-service';
import { BackgroundApiServiceInit } from './background-api-service-init';
import { getBackgroundApiServiceMessenger } from './messengers/background-api-service-messenger';

jest.mock('../services/background-api-service');

function getInitRequestMock(): jest.Mocked<
  MessengerClientInitRequest<BackgroundApiServiceMessenger>
> {
  const baseMessenger = getRootMessenger<never, never>();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getBackgroundApiServiceMessenger(baseMessenger),
    initMessenger: undefined,
  };

  return requestMock;
}

describe('BackgroundApiServiceInit', () => {
  it('initializes the service', () => {
    const { controller } = BackgroundApiServiceInit(getInitRequestMock());
    expect(controller).toBeInstanceOf(BackgroundApiService);
  });

  it('passes the proper arguments to the service', () => {
    BackgroundApiServiceInit(getInitRequestMock());

    const serviceMock = jest.mocked(BackgroundApiService);
    expect(serviceMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
    });
  });
});
