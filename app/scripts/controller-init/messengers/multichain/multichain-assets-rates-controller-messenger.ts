import { Messenger } from '@metamask/messenger';
import {
  AccountsControllerAccountAddedEvent,
  AccountsControllerGetSelectedMultichainAccountAction,
  AccountsControllerListMultichainAccountsAction,
} from '@metamask/accounts-controller';
import {
  CurrencyRateStateChange,
  GetCurrencyRateState,
  MultichainAssetsControllerAccountAssetListUpdatedEvent,
  MultichainAssetsControllerGetStateAction,
} from '@metamask/assets-controllers';
import {
  KeyringControllerLockEvent,
  KeyringControllerUnlockEvent,
} from '@metamask/keyring-controller';
import { HandleSnapRequest } from '@metamask/snaps-controllers';
import { RootMessenger } from '../../../lib/messenger';

type Actions =
  | HandleSnapRequest
  | AccountsControllerListMultichainAccountsAction
  | GetCurrencyRateState
  | MultichainAssetsControllerGetStateAction
  | AccountsControllerGetSelectedMultichainAccountAction;

type Events =
  | KeyringControllerLockEvent
  | KeyringControllerUnlockEvent
  | AccountsControllerAccountAddedEvent
  | CurrencyRateStateChange
  | MultichainAssetsControllerAccountAssetListUpdatedEvent;

export type MultichainAssetsRatesControllerMessenger = ReturnType<
  typeof getMultichainAssetsRatesControllerMessenger
>;

/**
 * Get a restricted messenger for the Multichain Assets Rate controller. This is scoped to the
 * actions and events that the multichain Assets Rate controller is allowed to handle.
 *
 * @param messenger - The controller messenger to restrict.
 * @returns The restricted controller messenger.
 */
export function getMultichainAssetsRatesControllerMessenger(
  messenger: RootMessenger<Actions, Events>,
) {
  const controllerMessenger = new Messenger<
    'MultichainAssetsRatesController',
    Actions,
    Events,
    typeof messenger
  >({
    namespace: 'MultichainAssetsRatesController',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerMessenger,
    events: [
      'AccountsController:accountAdded',
      'KeyringController:lock',
      'KeyringController:unlock',
      'CurrencyRateController:stateChange',
      'MultichainAssetsController:accountAssetListUpdated',
    ],
    actions: [
      'AccountsController:listMultichainAccounts',
      'SnapController:handleRequest',
      'CurrencyRateController:getState',
      'MultichainAssetsController:getState',
      'AccountsController:getSelectedMultichainAccount',
    ],
  });
  return controllerMessenger;
}
