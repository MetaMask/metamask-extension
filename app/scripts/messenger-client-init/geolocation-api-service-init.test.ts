import {
  GeolocationApiService,
  Env,
  type GeolocationApiServiceMessenger,
} from '@metamask/geolocation-controller';
import { isProduction } from '../../../shared/lib/environment';
import { getRootMessenger } from '../lib/messenger';
import type { MessengerClientInitRequest } from './types';
import { buildControllerInitRequestMock } from './test/utils';
import { getGeolocationApiServiceMessenger } from './messengers';
import { GeolocationApiServiceInit } from './geolocation-api-service-init';

jest.mock('@metamask/geolocation-controller');
jest.mock('../../../shared/lib/environment');

const isProductionMock = jest.mocked(isProduction);

function getInitRequestMock(): jest.Mocked<
  MessengerClientInitRequest<GeolocationApiServiceMessenger>
> {
  const baseMessenger = getRootMessenger<never, never>();

  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getGeolocationApiServiceMessenger(baseMessenger),
    initMessenger: undefined,
  };
}

describe('GeolocationApiServiceInit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    isProductionMock.mockReturnValue(false);
  });

  it('initializes the service', () => {
    const { messengerClient } = GeolocationApiServiceInit(getInitRequestMock());
    expect(messengerClient).toBeInstanceOf(GeolocationApiService);
  });

  it('passes DEV env when not in production', () => {
    GeolocationApiServiceInit(getInitRequestMock());

    const serviceMock = jest.mocked(GeolocationApiService);
    expect(serviceMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      env: Env.DEV,
      fetch: expect.any(Function),
    });
  });

  it('passes PRD env when in production', () => {
    isProductionMock.mockReturnValue(true);
    GeolocationApiServiceInit(getInitRequestMock());

    const serviceMock = jest.mocked(GeolocationApiService);
    expect(serviceMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      env: Env.PRD,
      fetch: expect.any(Function),
    });
  });

  it('returns null for persistedStateKey', () => {
    const result = GeolocationApiServiceInit(getInitRequestMock());
    expect(result.persistedStateKey).toBeNull();
  });

  it('returns null for memStateKey', () => {
    const result = GeolocationApiServiceInit(getInitRequestMock());
    expect(result.memStateKey).toBeNull();
  });
});
