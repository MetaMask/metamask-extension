import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../lib/messenger';
import { getPerpsControllerMessenger } from './perps-controller-messenger';

describe('getPerpsControllerMessenger', () => {
  it('returns a messenger instance', () => {
    const messenger = getRootMessenger<never, never>();
    const perpsControllerMessenger = getPerpsControllerMessenger(messenger);

    expect(perpsControllerMessenger).toBeInstanceOf(Messenger);
  });

  it('delegates required actions for PerpsController', () => {
    const messenger = getRootMessenger<never, never>();
    const delegateSpy = jest.spyOn(messenger, 'delegate');

    getPerpsControllerMessenger(messenger);

    expect(delegateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        actions: expect.arrayContaining([
          'NetworkController:getState',
          'NetworkController:getNetworkClientById',
          'NetworkController:findNetworkClientIdByChainId',
          'KeyringController:getState',
          'KeyringController:signTypedMessage',
          'TransactionController:addTransaction',
          'RemoteFeatureFlagController:getState',
          'AccountTreeController:getAccountsFromSelectedAccountGroup',
          'GeolocationController:getGeolocation',
          'AuthenticationController:getBearerToken',
          'MetaMetricsController:trackEvent',
          'StorageService:getItem',
          'StorageService:setItem',
          'StorageService:removeItem',
          'AuthenticatedUserStorageService:getNotificationPreferences',
          'AuthenticatedUserStorageService:putNotificationPreferences',
        ]),
      }),
    );
  });

  it('registers AuthenticatedUserStorageService stubs that keep the perps watchlist local-only', async () => {
    const messenger = getRootMessenger();
    const perpsControllerMessenger = getPerpsControllerMessenger(messenger);

    // perps-controller@9 reads notification preferences to sync the watchlist;
    // the stub returns null so the controller skips the remote read-merge-write
    // and never reverts the optimistic toggle.
    await expect(
      perpsControllerMessenger.call(
        'AuthenticatedUserStorageService:getNotificationPreferences',
      ),
    ).resolves.toBeNull();
    await expect(
      perpsControllerMessenger.call(
        'AuthenticatedUserStorageService:putNotificationPreferences',
        {},
      ),
    ).resolves.toBeUndefined();
  });

  it('delegates required events for PerpsController', () => {
    const messenger = getRootMessenger<never, never>();
    const delegateSpy = jest.spyOn(messenger, 'delegate');

    getPerpsControllerMessenger(messenger);

    expect(delegateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        events: expect.arrayContaining([
          'RemoteFeatureFlagController:stateChange',
          'AccountTreeController:selectedAccountGroupChange',
        ]),
      }),
    );
  });
});
