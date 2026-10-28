import {
  SentinelApiService,
  type SentinelApiServiceMessenger,
} from '@metamask/sentinel-api-service';
import { getRootMessenger } from '../lib/messenger';
import { setSentinelApiMessenger } from '../lib/transaction/sentinel-api';
import type { MessengerClientInitRequest } from './types';
import { buildControllerInitRequestMock } from './test/utils';
import { getSentinelApiServiceMessenger } from './messengers';
import { SentinelApiServiceInit } from './sentinel-api-service-init';

jest.mock('@metamask/sentinel-api-service');
jest.mock('../lib/transaction/sentinel-api');

function getInitRequestMock(): jest.Mocked<
  MessengerClientInitRequest<SentinelApiServiceMessenger>
> {
  const baseMessenger = getRootMessenger<never, never>();

  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getSentinelApiServiceMessenger(baseMessenger),
    initMessenger: undefined,
  };
}

describe('SentinelApiServiceInit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes the service', () => {
    const { messengerClient } = SentinelApiServiceInit(getInitRequestMock());
    expect(messengerClient).toBeInstanceOf(SentinelApiService);
  });

  it('passes extension client metadata', () => {
    SentinelApiServiceInit(getInitRequestMock());

    const serviceMock = jest.mocked(SentinelApiService);
    expect(serviceMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      fetch: expect.any(Function),
      clientId: 'extension',
      clientVersion: process.env.METAMASK_VERSION,
    });
  });

  it('sets messenger for legacy Sentinel utils', () => {
    const request = getInitRequestMock();

    SentinelApiServiceInit(request);

    expect(setSentinelApiMessenger).toHaveBeenCalledWith(
      request.controllerMessenger,
    );
  });

  it('returns null for persistedStateKey', () => {
    const result = SentinelApiServiceInit(getInitRequestMock());
    expect(result.persistedStateKey).toBeNull();
  });

  it('returns null for memStateKey', () => {
    const result = SentinelApiServiceInit(getInitRequestMock());
    expect(result.memStateKey).toBeNull();
  });
});
