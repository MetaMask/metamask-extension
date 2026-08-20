import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../../lib/messenger';
import {
  getAssetsControllerMessenger,
  getAssetsControllerInitMessenger,
} from './assets-controller-messenger';

const ASSETS_CONTROLLER_DELEGATED_ACTIONS = [
  'AccountTreeController:getAccountsFromSelectedAccountGroup',
  'ConfigRegistryController:getNetworkConfigByCaip2ChainId',
  'NetworkEnablementController:getState',
  'NetworkController:getState',
  'NetworkController:getNetworkClientById',
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

const ASSETS_CONTROLLER_INIT_DELEGATED_ACTIONS = [
  'AuthenticationController:getBearerToken',
  'SnapController:handleRequest',
  'PreferencesController:getState',
  'OnboardingController:getState',
  'RemoteFeatureFlagController:getState',
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

  // @ts-expect-error This is missing from the Mocha type definitions
  it.each(ASSETS_CONTROLLER_DELEGATED_ACTIONS)(
    'delegates %s action',
    (action: string) => {
      const messenger = getRootMessenger<never, never>();
      const delegateSpy = jest.spyOn(messenger, 'delegate');

      getAssetsControllerMessenger(messenger);

      expect(delegateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          actions: expect.arrayContaining([action]),
        }),
      );
    },
  );

  // @ts-expect-error This is missing from the Mocha type definitions
  it.each(ASSETS_CONTROLLER_DELEGATED_EVENTS)(
    'delegates %s event',
    (event: string) => {
      const messenger = getRootMessenger<never, never>();
      const delegateSpy = jest.spyOn(messenger, 'delegate');

      getAssetsControllerMessenger(messenger);

      expect(delegateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          events: expect.arrayContaining([event]),
        }),
      );
    },
  );
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

  // @ts-expect-error This is missing from the Mocha type definitions
  it.each(ASSETS_CONTROLLER_INIT_DELEGATED_ACTIONS)(
    'delegates %s action for initialization',
    (action: string) => {
      const messenger = getRootMessenger<never, never>();
      const delegateSpy = jest.spyOn(messenger, 'delegate');

      getAssetsControllerInitMessenger(messenger);

      expect(delegateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          actions: expect.arrayContaining([action]),
        }),
      );
    },
  );
});
