import { getRootMessenger } from '../lib/messenger';
import {
  LegacyBackgroundApiService,
  LegacyBackgroundApiServiceMessenger,
} from '../services/legacy-background-api-service';
import { MessengerClientInitRequest } from './types';
import { buildControllerInitRequestMock } from './test/utils';
import { LegacyBackgroundApiServiceInit } from './legacy-background-api-service-init';
import { getLegacyBackgroundApiServiceMessenger } from './messengers/legacy-background-api-service-messenger';

jest.mock('../services/legacy-background-api-service');

function getInitRequestMock(): jest.Mocked<
  MessengerClientInitRequest<LegacyBackgroundApiServiceMessenger>
> {
  const baseMessenger = getRootMessenger<never, never>();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getLegacyBackgroundApiServiceMessenger(baseMessenger),
    initMessenger: undefined,
  };

  return requestMock;
}

describe('LegacyBackgroundApiServiceInit', () => {
  it('initializes the service', () => {
    const { messengerClient } =
      LegacyBackgroundApiServiceInit(getInitRequestMock());
    expect(messengerClient).toBeInstanceOf(LegacyBackgroundApiService);
  });

  it('passes the proper arguments to the service', () => {
    LegacyBackgroundApiServiceInit(getInitRequestMock());

    const serviceMock = jest.mocked(LegacyBackgroundApiService);
    expect(serviceMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
    });
  });
});
