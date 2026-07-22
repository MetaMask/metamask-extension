import { QrSyncDataService } from '../../controllers/qr-sync/qr-sync-data-service';
import type { QrSyncDataServiceMessenger } from '../../controllers/qr-sync/types';
import { getRootMessenger } from '../../lib/messenger';
import { getQrSyncDataServiceMessenger } from '../messengers/qr-sync/qr-sync-data-service-messenger';
import { buildControllerInitRequestMock } from '../test/utils';
import type { MessengerClientInitRequest } from '../types';
import { QrSyncDataServiceInit } from './qr-sync-data-service-init';

jest.mock('../../controllers/qr-sync/qr-sync-data-service');

function buildInitRequestMock(): jest.Mocked<
  MessengerClientInitRequest<QrSyncDataServiceMessenger>
> {
  const baseControllerMessenger = getRootMessenger<never, never>();

  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getQrSyncDataServiceMessenger(baseControllerMessenger),
    initMessenger: undefined,
  } as jest.Mocked<MessengerClientInitRequest<QrSyncDataServiceMessenger>>;
}

describe('QrSyncDataServiceInit', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('initializes the data service', () => {
    const request = buildInitRequestMock();
    const { messengerClient } = QrSyncDataServiceInit(request);

    expect(messengerClient).toBeInstanceOf(QrSyncDataService);
  });

  it('passes the proper arguments to the data service', () => {
    const request = buildInitRequestMock();

    QrSyncDataServiceInit(request);

    expect(jest.mocked(QrSyncDataService)).toHaveBeenCalledWith({
      messenger: request.controllerMessenger,
    });
  });

  it('returns null persisted and memory state keys', () => {
    const request = buildInitRequestMock();
    const initResult = QrSyncDataServiceInit(request);

    expect(initResult.persistedStateKey).toBeNull();
    expect(initResult.memStateKey).toBeNull();
  });
});
