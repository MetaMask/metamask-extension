import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../../lib/messenger';
import {
  getAssetsControllerMessenger,
  getAssetsControllerInitMessenger,
} from './assets-controller-messenger';

describe('getAssetsControllerMessenger', () => {
  it('returns a messenger instance', () => {
    const messenger = getRootMessenger<never, never>();
    const assetsControllerMessenger = getAssetsControllerMessenger(messenger);
    expect(assetsControllerMessenger).toBeInstanceOf(Messenger);
  });

  it('creates messenger with AssetsController namespace', () => {
    const messenger = getRootMessenger<never, never>();
    const assetsControllerMessenger = getAssetsControllerMessenger(messenger);

    // The messenger should have the namespace property accessible
    expect(assetsControllerMessenger).toBeDefined();
  });

  it('delegates required actions for AssetsController', () => {
    const messenger = getRootMessenger<never, never>();
    const delegateSpy = jest.spyOn(messenger, 'delegate');

    getAssetsControllerMessenger(messenger);

    expect(delegateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        actions: expect.arrayContaining([
          // Core dependencies
          'AccountTreeController:getAccountsFromSelectedAccountGroup',
          'NetworkEnablementController:getState',
          // Network dependencies
          'NetworkController:getState',
          'NetworkController:getNetworkClientById',
          // Token list dependencies
          'TokenListController:getState',
          // Backend WebSocket dependencies
          'BackendWebSocketService:subscribe',
          'BackendWebSocketService:getConnectionInfo',
          'BackendWebSocketService:findSubscriptionsByChannelPrefix',
          // SnapDataSource dependencies
          'SnapController:handleRequest',
          'SnapController:getRunnableSnaps',
          'PermissionController:getPermissions',
        ]),
      }),
    );
  });

  it('delegates required events for AssetsController', () => {
    const messenger = getRootMessenger<never, never>();
    const delegateSpy = jest.spyOn(messenger, 'delegate');

    getAssetsControllerMessenger(messenger);

    expect(delegateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        events: expect.arrayContaining([
          // Core events
          'AccountTreeController:selectedAccountGroupChange',
          'NetworkEnablementController:stateChange',
          'KeyringController:lock',
          'KeyringController:unlock',
          // Data source events
          'NetworkController:stateChange',
          'BackendWebSocketService:connectionStateChanged',
          'AccountsController:accountBalancesUpdated',
          'PermissionController:stateChange',
        ]),
      }),
    );
  });
});

describe('getAssetsControllerInitMessenger', () => {
  it('returns a messenger instance', () => {
    const messenger = getRootMessenger<never, never>();
    const assetsControllerInitMessenger =
      getAssetsControllerInitMessenger(messenger);
    expect(assetsControllerInitMessenger).toBeInstanceOf(Messenger);
  });

  it('creates messenger with AssetsControllerInit namespace', () => {
    const messenger = getRootMessenger<never, never>();
    const assetsControllerInitMessenger =
      getAssetsControllerInitMessenger(messenger);

    // The messenger should have the namespace property accessible
    expect(assetsControllerInitMessenger).toBeDefined();
  });

  it('delegates required actions for initialization', () => {
    const messenger = getRootMessenger<never, never>();
    const delegateSpy = jest.spyOn(messenger, 'delegate');

    getAssetsControllerInitMessenger(messenger);

    expect(delegateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        actions: expect.arrayContaining([
          'AuthenticationController:getBearerToken',
          'SnapController:handleRequest',
          'PreferencesController:getState',
        ]),
      }),
    );
  });
});
