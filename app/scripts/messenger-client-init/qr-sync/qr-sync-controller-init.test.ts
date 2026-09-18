import { QrSyncController } from '../../controllers/qr-sync/qr-sync-controller';
import { RELAY_URL } from '../../controllers/qr-sync/constants';
import { KeyManager } from '../../controllers/qr-sync/key-manager';
import { getDefaultQrSyncControllerState } from '../../controllers/qr-sync/metadata';
import type { QrSyncControllerMessenger } from '../../controllers/qr-sync/types';
import { getRootMessenger } from '../../lib/messenger';
import { getQrSyncControllerMessenger } from '../messengers/qr-sync/qr-sync-controller-messenger';
import { buildControllerInitRequestMock } from '../test/utils';
import type { MessengerClientInitRequest } from '../types';
import { QrSyncControllerInit } from './qr-sync-controller-init';

jest.mock('../../controllers/qr-sync/qr-sync-controller');
jest.mock('../../controllers/qr-sync/key-manager');

function buildInitRequestMock(): jest.Mocked<
  MessengerClientInitRequest<QrSyncControllerMessenger>
> {
  const baseControllerMessenger = getRootMessenger<never, never>();
  const qrSyncState = getDefaultQrSyncControllerState();

  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getQrSyncControllerMessenger(baseControllerMessenger),
    initMessenger: undefined,
    persistedState: {
      QrSyncController: qrSyncState,
    },
  } as jest.Mocked<MessengerClientInitRequest<QrSyncControllerMessenger>>;
}

describe('QrSyncControllerInit', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('initializes the controller', () => {
    const request = buildInitRequestMock();
    const { messengerClient } = QrSyncControllerInit(request);

    expect(messengerClient).toBeInstanceOf(QrSyncController);
  });

  it('passes the proper arguments to the controller', () => {
    const request = buildInitRequestMock();

    QrSyncControllerInit(request);

    expect(jest.mocked(QrSyncController)).toHaveBeenCalledWith({
      messenger: request.controllerMessenger,
      keyManager: expect.any(KeyManager),
      relayUrl: RELAY_URL,
      state: request.persistedState.QrSyncController,
    });
  });
});
