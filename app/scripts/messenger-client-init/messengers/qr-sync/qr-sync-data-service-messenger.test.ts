import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../../lib/messenger';
import { getQrSyncDataServiceMessenger } from './qr-sync-data-service-messenger';

describe('getQrSyncDataServiceMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const qrSyncDataServiceMessenger = getQrSyncDataServiceMessenger(messenger);

    expect(qrSyncDataServiceMessenger).toBeInstanceOf(Messenger);
  });

  it('delegates keyring and account lookup actions', () => {
    const messenger = getRootMessenger<never, never>();
    const delegateSpy = jest.spyOn(messenger, 'delegate');

    getQrSyncDataServiceMessenger(messenger);

    expect(delegateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        actions: expect.arrayContaining([
          'KeyringController:withKeyringV2',
          'KeyringController:exportSeedPhrase',
          'KeyringController:exportAccount',
          'AccountTreeController:getAccountGroupObject',
          'AccountTreeController:getAccountWalletObject',
          'AccountsController:getAccount',
        ]),
      }),
    );
  });
});
