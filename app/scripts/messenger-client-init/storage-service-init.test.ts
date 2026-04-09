import { StorageService } from '@metamask/storage-service';
import { getRootMessenger } from '../lib/messenger';
import { BrowserStorageAdapter } from '../lib/stores/browser-storage-adapter';
import { ControllerInitRequest } from './types';
import { buildControllerInitRequestMock } from './test/utils';
import {
  getStorageServiceMessenger,
  StorageServiceMessenger,
} from './messengers';
import { StorageServiceInit } from './storage-service-init';

jest.mock('@metamask/storage-service');
jest.mock('../lib/stores/browser-storage-adapter');

function getInitRequestMock(): jest.Mocked<
  ControllerInitRequest<StorageServiceMessenger>
> {
  const baseMessenger = getRootMessenger();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getStorageServiceMessenger(baseMessenger),
    initMessenger: undefined,
  };

  return requestMock;
}

describe('StorageServiceInit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes the service', () => {
    const { controller } = StorageServiceInit(getInitRequestMock());
    expect(controller).toBeInstanceOf(StorageService);
  });

  it('passes the proper arguments to the service', () => {
    StorageServiceInit(getInitRequestMock());

    const serviceMock = jest.mocked(StorageService);
    expect(serviceMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      storage: expect.any(BrowserStorageAdapter),
    });
  });

  it('returns null for persistedStateKey (stateless)', () => {
    const result = StorageServiceInit(getInitRequestMock());
    expect(result.persistedStateKey).toBeNull();
  });

  it('returns null for memStateKey (stateless)', () => {
    const result = StorageServiceInit(getInitRequestMock());
    expect(result.memStateKey).toBeNull();
  });
});
