import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../../lib/messenger';
import {
  getAssetsControllerMessenger,
  getAssetsControllerInitMessenger,
} from './assets-controller-messenger';

const ASSETS_CONTROLLER_DELEGATED_ACTIONS = [
  'AccountTreeController:getAccountsFromSelectedAccountGroup',
  'NetworkEnablementController:getState',
  'NetworkController:getState',
  'NetworkController:getNetworkClientById',
  'ConfigRegistryController:getNetworkConfigByCaip2ChainId',
  'SnapController:handleRequest',
  'SnapController:getRunnableSnaps',
  'PermissionController:getPermissions',
  'PhishingController:bulkScanTokens',
  'AccountsController:getSelectedAccount',
  'RemoteFeatureFlagController:getState',
] as const;

const ASSETS_CONTROLLER_DELEGATED_EVENTS = [
  'AccountTreeController:selectedAccountGroupChange',
  'AccountTreeController:stateChange',
  'ClientController:stateChange',
  'NetworkEnablementController:stateChange',
  'KeyringController:lock',
  'KeyringController:unlock',
  'NetworkController:stateChange',
  'NetworkController:networkDidChange',
  'NetworkController:networkRemoved',
  'NetworkController:networkAdded',
  'AccountsController:accountBalancesUpdated',
  'PermissionController:stateChange',
  'SnapController:snapInstalled',
  'PreferencesController:stateChange',
  'TransactionController:transactionConfirmed',
  'TransactionController:unapprovedTransactionAdded',
  'AccountActivityService:balanceUpdated',
  'AccountActivityService:statusChanged',
  'RemoteFeatureFlagController:stateChange',
] as const;

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
          ...ASSETS_CONTROLLER_DELEGATED_ACTIONS,
        ]),
      }),
    );
  });

  it('does not delegate BackendWebSocketService (owned by AccountActivityService)', () => {
    const messenger = getRootMessenger<never, never>();
    const delegateSpy = jest.spyOn(messenger, 'delegate');

    getAssetsControllerMessenger(messenger);

    const [{ actions = [], events = [] }] = delegateSpy.mock.calls[0];
    expect(actions).not.toContain('BackendWebSocketService:subscribe');
    expect(actions).not.toContain('BackendWebSocketService:getConnectionInfo');
    expect(actions).not.toContain(
      'BackendWebSocketService:findSubscriptionsByChannelPrefix',
    );
    expect(actions).not.toContain('BackendWebSocketService:addChannelCallback');
    expect(actions).not.toContain(
      'BackendWebSocketService:removeChannelCallback',
    );
    expect(events).not.toContain(
      'BackendWebSocketService:connectionStateChanged',
    );
  });

  it('delegates AccountsController accountBalancesUpdated event', () => {
    const messenger = getRootMessenger<never, never>();
    const delegateSpy = jest.spyOn(messenger, 'delegate');

    getAssetsControllerMessenger(messenger);

    expect(delegateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        events: expect.arrayContaining([
          'AccountsController:accountBalancesUpdated',
        ]),
      }),
    );
  });

  it('delegates AccountActivityService balanceUpdated and statusChanged events', () => {
    const messenger = getRootMessenger<never, never>();
    const delegateSpy = jest.spyOn(messenger, 'delegate');

    getAssetsControllerMessenger(messenger);

    expect(delegateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        events: expect.arrayContaining([
          'AccountActivityService:balanceUpdated',
          'AccountActivityService:statusChanged',
        ]),
      }),
    );
  });

  it('delegates ConfigRegistryController getNetworkConfigByCaip2ChainId action', () => {
    const messenger = getRootMessenger<never, never>();
    const delegateSpy = jest.spyOn(messenger, 'delegate');

    getAssetsControllerMessenger(messenger);

    expect(delegateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        actions: expect.arrayContaining([
          'ConfigRegistryController:getNetworkConfigByCaip2ChainId',
        ]),
      }),
    );
  });

  it('delegates core#9388 account-group and network-enablement events', () => {
    const messenger = getRootMessenger<never, never>();
    const delegateSpy = jest.spyOn(messenger, 'delegate');

    getAssetsControllerMessenger(messenger);

    expect(delegateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        events: expect.arrayContaining([
          'AccountTreeController:selectedAccountGroupChange',
          'AccountTreeController:stateChange',
          'NetworkEnablementController:stateChange',
        ]),
      }),
    );
  });

  it('delegates NetworkController networkDidChange event', () => {
    const messenger = getRootMessenger<never, never>();
    const delegateSpy = jest.spyOn(messenger, 'delegate');

    getAssetsControllerMessenger(messenger);

    expect(delegateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        events: expect.arrayContaining(['NetworkController:networkDidChange']),
      }),
    );
  });

  it('delegates NetworkController stateChange event', () => {
    const messenger = getRootMessenger<never, never>();
    const delegateSpy = jest.spyOn(messenger, 'delegate');

    getAssetsControllerMessenger(messenger);

    expect(delegateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        events: expect.arrayContaining(['NetworkController:stateChange']),
      }),
    );
  });

  it('delegates required events for AssetsController', () => {
    const messenger = getRootMessenger<never, never>();
    const delegateSpy = jest.spyOn(messenger, 'delegate');

    getAssetsControllerMessenger(messenger);

    expect(delegateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        events: expect.arrayContaining([...ASSETS_CONTROLLER_DELEGATED_EVENTS]),
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
          'OnboardingController:getState',
          'RemoteFeatureFlagController:getState',
        ]),
      }),
    );
  });
});
