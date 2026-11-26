import { getRootMessenger } from '../lib/messenger';
import { BrazeService, BrazeServiceMessenger } from '../services/braze-service';
import { MessengerClientInitRequest } from './types';
import { buildControllerInitRequestMock } from './test/utils';
import { BrazeServiceInit } from './braze-service-init';
import { getBrazeServiceMessenger } from './messengers/braze-service-messenger';

jest.mock('../services/braze-service');

function buildInitRequestMock(): jest.Mocked<
  MessengerClientInitRequest<BrazeServiceMessenger>
> {
  const baseControllerMessenger = getRootMessenger<never, never>();

  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getBrazeServiceMessenger(baseControllerMessenger),
    initMessenger: undefined,
  };
}

describe('BrazeServiceInit', () => {
  it('initializes BrazeService with the controller messenger and no state', () => {
    const requestMock = buildInitRequestMock();

    const result = BrazeServiceInit(requestMock);

    expect(result.messengerClient).toBeInstanceOf(BrazeService);
    expect(result.memStateKey).toBeNull();
    expect(result.persistedStateKey).toBeNull();
    expect(BrazeService).toHaveBeenCalledWith({
      messenger: requestMock.controllerMessenger,
    });
  });
});
