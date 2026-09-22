import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../../lib/messenger';
import {
  getAccountTreeControllerInitMessenger,
  getAccountTreeControllerMessenger,
} from './account-tree-controller-messenger';

const ACCOUNT_TREE_CONTROLLER_DELEGATED_ACTIONS = [
  'AccountsController:listMultichainAccounts',
  'AccountsController:getAccount',
  'AccountsController:getSelectedMultichainAccount',
  'AccountsController:setSelectedAccount',
  'UserStorageController:getState',
  'UserStorageController:performGetStorage',
  'UserStorageController:performGetStorageAllFeatureEntries',
  'UserStorageController:performSetStorage',
  'UserStorageController:performBatchSetStorage',
  'AuthenticationController:getSessionProfile',
  'MultichainAccountService:createMultichainAccountGroup',
  'MultichainAccountService:createMultichainAccountGroups',
  'MultichainAccountService:createMultichainAccountWallet',
  'SnapController:getSnap',
  'KeyringController:getState',
  'KeyringController:verifyPassword',
  'KeyringController:withController',
  'KeyringController:withKeyringV2',
  'KeyringController:withKeyringV2Unsafe',
] as const;

const ACCOUNT_TREE_CONTROLLER_DELEGATED_EVENTS = [
  'AccountsController:accountsAdded',
  'AccountsController:accountsRemoved',
  'AccountsController:selectedAccountChange',
  'UserStorageController:stateChange',
  'MultichainAccountService:walletStatusChange',
] as const;

const ACCOUNT_TREE_CONTROLLER_INIT_DELEGATED_ACTIONS = [
  'AccountsController:getAccount',
  'AccountOrderController:getState',
] as const;

describe('getAccountTreeControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const accountTreeControllerMessenger =
      getAccountTreeControllerMessenger(messenger);

    expect(accountTreeControllerMessenger).toBeInstanceOf(Messenger);
  });

  // @ts-expect-error This is missing from the Mocha type definitions
  it.each(ACCOUNT_TREE_CONTROLLER_DELEGATED_ACTIONS)(
    'delegates %s action',
    (action: string) => {
      const messenger = getRootMessenger<never, never>();
      const delegateSpy = jest.spyOn(messenger, 'delegate');

      getAccountTreeControllerMessenger(messenger);

      expect(delegateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          actions: expect.arrayContaining([action]),
        }),
      );
    },
  );

  // @ts-expect-error This is missing from the Mocha type definitions
  it.each(ACCOUNT_TREE_CONTROLLER_DELEGATED_EVENTS)(
    'delegates %s event',
    (event: string) => {
      const messenger = getRootMessenger<never, never>();
      const delegateSpy = jest.spyOn(messenger, 'delegate');

      getAccountTreeControllerMessenger(messenger);

      expect(delegateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          events: expect.arrayContaining([event]),
        }),
      );
    },
  );
});

describe('getAccountTreeControllerInitMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const accountTreeControllerInitMessenger =
      getAccountTreeControllerInitMessenger(messenger);

    expect(accountTreeControllerInitMessenger).toBeInstanceOf(Messenger);
  });

  // @ts-expect-error This is missing from the Mocha type definitions
  it.each(ACCOUNT_TREE_CONTROLLER_INIT_DELEGATED_ACTIONS)(
    'delegates %s action for initialization',
    (action: string) => {
      const messenger = getRootMessenger<never, never>();
      const delegateSpy = jest.spyOn(messenger, 'delegate');

      getAccountTreeControllerInitMessenger(messenger);

      expect(delegateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          actions: expect.arrayContaining([action]),
        }),
      );
    },
  );
});
