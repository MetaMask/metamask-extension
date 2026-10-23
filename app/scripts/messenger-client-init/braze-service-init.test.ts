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
  it('returns the service without state', () => {
    const requestMock = buildInitRequestMock();

    const result = BrazeServiceInit(requestMock);

    expect(result.messengerClient).toBeInstanceOf(BrazeService);
    expect(result.memStateKey).toBeNull();
    expect(result.persistedStateKey).toBeNull();
  });

  it('waits for the offscreen document', () => {
    const requestMock = buildInitRequestMock();

    BrazeServiceInit(requestMock);

    expect(BrazeService).toHaveBeenCalledWith({
      messenger: requestMock.controllerMessenger,
      offscreenReady: requestMock.offscreenPromise,
    });
  });
});
