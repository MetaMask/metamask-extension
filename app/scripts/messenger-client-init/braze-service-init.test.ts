import { getRootMessenger } from '../lib/messenger';
import { BrazeService, BrazeServiceMessenger } from '../services/braze-service';
import { MessengerClientInitRequest } from './types';
import { buildControllerInitRequestMock } from './test/utils';
import { BrazeServiceInit } from './braze-service-init';
import { getBrazeServiceMessenger } from './messengers/braze-service-messenger';

jest.mock('../services/braze-service');

let mockIsManifestV3 = true;
jest.mock('../../../shared/lib/mv3.utils', () => ({
  get isManifestV3() {
    return mockIsManifestV3;
  },
}));

const mockCreateOffscreenBrazeClient = jest.fn();
const mockCreateBrazeHost = jest.fn();
jest.mock('../../offscreen/braze-client', () => ({
  createOffscreenBrazeClient: (...args: unknown[]) =>
    mockCreateOffscreenBrazeClient(...args),
}));
jest.mock('../../braze/braze-host', () => ({
  createBrazeHost: (...args: unknown[]) => mockCreateBrazeHost(...args),
}));

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
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsManifestV3 = true;
    mockCreateOffscreenBrazeClient.mockReturnValue(jest.fn());
    mockCreateBrazeHost.mockReturnValue(jest.fn());
  });

  it('returns the service without state', () => {
    const requestMock = buildInitRequestMock();

    const result = BrazeServiceInit(requestMock);

    expect(result.messengerClient).toBeInstanceOf(BrazeService);
    expect(result.memStateKey).toBeNull();
    expect(result.persistedStateKey).toBeNull();
  });

  it('messages the offscreen document on MV3', () => {
    const requestMock = buildInitRequestMock();
    const syncUser = jest.fn();
    mockCreateOffscreenBrazeClient.mockReturnValueOnce(syncUser);

    BrazeServiceInit(requestMock);

    expect(mockCreateOffscreenBrazeClient).toHaveBeenCalledWith(
      requestMock.offscreenPromise,
    );
    expect(mockCreateBrazeHost).not.toHaveBeenCalled();
    expect(BrazeService).toHaveBeenCalledWith({
      messenger: requestMock.controllerMessenger,
      syncUser,
    });
  });

  it('calls the host directly on MV2', () => {
    mockIsManifestV3 = false;
    const requestMock = buildInitRequestMock();
    const syncUser = jest.fn();
    mockCreateBrazeHost.mockReturnValueOnce(syncUser);

    BrazeServiceInit(requestMock);

    expect(mockCreateBrazeHost).toHaveBeenCalledWith();
    expect(mockCreateOffscreenBrazeClient).not.toHaveBeenCalled();
    expect(BrazeService).toHaveBeenCalledWith({
      messenger: requestMock.controllerMessenger,
      syncUser,
    });
  });
});
