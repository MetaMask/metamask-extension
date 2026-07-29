import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../../lib/messenger';
import { getQrSyncControllerMessenger } from './qr-sync-controller-messenger';

describe('getQrSyncControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const qrSyncControllerMessenger = getQrSyncControllerMessenger(messenger);

    expect(qrSyncControllerMessenger).toBeInstanceOf(Messenger);
  });

  it('delegates QrSyncDataService:buildWalletExportEntries', () => {
    const messenger = getRootMessenger<never, never>();
    const delegateSpy = jest.spyOn(messenger, 'delegate');

    getQrSyncControllerMessenger(messenger);

    expect(delegateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        actions: expect.arrayContaining([
          'QrSyncDataService:buildWalletExportEntries',
        ]),
      }),
    );
  });
});
