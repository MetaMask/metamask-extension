import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../../lib/messenger';
import {
  ASSETS_CONTROLLER_INIT_DELEGATED_ACTIONS,
  getAssetsControllerMessenger,
  getAssetsControllerInitMessenger,
} from './assets-controller-messenger';

/**
 * Actions delegated by `@metamask/wallet`'s `assetsController.getMessenger`.
 */
const WALLET_ASSETS_CONTROLLER_ACTIONS = [
  'AccountsController:getSelectedAccount',
  'AccountTreeController:getAccountsFromSelectedAccountGroup',
  'AccountTreeController:isInitialized',
  'ClientController:getState',
  'ConfigRegistryController:getNetworkConfigByCaip2ChainId',
  'KeyringController:isUnlocked',
  'NetworkController:getNetworkClientById',
  'NetworkController:getState',
  'NetworkEnablementController:getState',
  'PermissionController:getPermissions',
  'PhishingController:bulkScanTokens',
  'RemoteFeatureFlagController:getState',
  'SnapController:getRunnableSnaps',
  'SnapController:handleRequest',
] as const;

/**
 * Events delegated by `@metamask/wallet`'s `assetsController.getMessenger`.
 */
const WALLET_ASSETS_CONTROLLER_EVENTS = [
  'AccountActivityService:balanceUpdated',
  'AccountActivityService:statusChanged',
  'AccountsController:accountBalancesUpdated',
  'AccountTreeController:initialized',
  'AccountTreeController:selectedAccountGroupChange',
  'AccountTreeController:uninitialized',
  'ClientController:stateChange',
  'KeyringController:lock',
  'KeyringController:unlock',
  'MultichainTransactionsController:transactionConfirmed',
  'NetworkController:networkAdded',
  'NetworkController:networkDidChange',
  'NetworkController:networkRemoved',
  'NetworkController:stateChange',
  'NetworkEnablementController:stateChange',
  'PermissionController:stateChange',
  'PreferencesController:stateChange',
  'RemoteFeatureFlagController:stateChange',
  'SnapController:snapInstalled',
  'TransactionController:transactionConfirmed',
  'TransactionController:unapprovedTransactionAdded',
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

  it('delegates the wallet AssetsController actions and events', () => {
    const messenger = getRootMessenger<never, never>();
    const delegateSpy = jest.spyOn(messenger, 'delegate');

    getAssetsControllerMessenger(messenger);

    expect(delegateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        actions: [...WALLET_ASSETS_CONTROLLER_ACTIONS],
        events: [...WALLET_ASSETS_CONTROLLER_EVENTS],
      }),
    );
  });

  // @ts-expect-error This is missing from the Mocha type definitions
  it.each(WALLET_ASSETS_CONTROLLER_ACTIONS)(
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
  it.each(WALLET_ASSETS_CONTROLLER_EVENTS)(
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

  it('does not delegate AccountTreeController:stateChange (core#10059)', () => {
    const messenger = getRootMessenger<never, never>();
    const delegateSpy = jest.spyOn(messenger, 'delegate');

    getAssetsControllerMessenger(messenger);

    const delegateCall = delegateSpy.mock.calls[0]?.[0] as {
      events?: string[];
    };
    expect(delegateCall.events).not.toContain(
      'AccountTreeController:stateChange',
    );
  });

  it('delegates MultichainTransactionsController transactionConfirmed (core#10585)', () => {
    const messenger = getRootMessenger<never, never>();
    const delegateSpy = jest.spyOn(messenger, 'delegate');

    getAssetsControllerMessenger(messenger);

    expect(delegateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        events: expect.arrayContaining([
          'MultichainTransactionsController:transactionConfirmed',
        ]),
      }),
    );
  });

  it('delegates core#10059 lifecycle getState/isUnlocked actions', () => {
    const messenger = getRootMessenger<never, never>();
    const delegateSpy = jest.spyOn(messenger, 'delegate');

    getAssetsControllerMessenger(messenger);

    expect(delegateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        actions: expect.arrayContaining([
          'AccountTreeController:isInitialized',
          'ClientController:getState',
          'KeyringController:isUnlocked',
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
