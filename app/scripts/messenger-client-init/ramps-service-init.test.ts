import {
  RampsService,
  type RampsServiceMessenger,
} from '@metamask/ramps-controller';
import { getRootMessenger } from '../lib/messenger';
import type { MessengerClientInitRequest } from './types';
import { buildControllerInitRequestMock } from './test/utils';
import { getRampsServiceMessenger } from './messengers';
import { RampsServiceInit } from './ramps-service-init';

jest.mock('@metamask/ramps-controller');
jest.mock('./ramps-environment', () => ({
  getRampsEnvironment: jest.fn(() => 'staging'),
}));

function getInitRequestMock(): jest.Mocked<
  MessengerClientInitRequest<RampsServiceMessenger>
> {
  const baseMessenger = getRootMessenger<never, never>();

  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getRampsServiceMessenger(baseMessenger),
    initMessenger: undefined,
  };
}

describe('RampsServiceInit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes the service', () => {
    const { messengerClient } = RampsServiceInit(getInitRequestMock());
    expect(messengerClient).toBeInstanceOf(RampsService);
  });

  it('passes extension ramps options', () => {
    RampsServiceInit(getInitRequestMock());

    const serviceMock = jest.mocked(RampsService);
    expect(serviceMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      environment: 'staging',
      context: 'extension',
      fetch: expect.any(Function),
    });
  });

  it('returns null for persistedStateKey', () => {
    const result = RampsServiceInit(getInitRequestMock());
    expect(result.persistedStateKey).toBeNull();
  });

  it('returns null for memStateKey', () => {
    const result = RampsServiceInit(getInitRequestMock());
    expect(result.memStateKey).toBeNull();
  });
});
