import {
  Messenger,
  type MessengerActions,
  type MessengerEvents,
} from '@metamask/messenger';
import type { MoneyAccountControllerMessenger } from '@metamask/money-account-controller';
import type {
  KeyringControllerGetStateAction,
  KeyringControllerUnlockEvent,
} from '@metamask/keyring-controller';
import type {
  RemoteFeatureFlagControllerGetStateAction,
  RemoteFeatureFlagControllerStateChangeEvent,
} from '@metamask/remote-feature-flag-controller';
import type { RootMessenger } from '../../lib/messenger';

/**
 * Create a messenger for the MoneyAccountController, scoped to the actions and
 * events it is allowed to use.
 *
 * All three delegated actions are `KeyringController` ones: the controller reads
 * the keyring list to find the primary entropy source, creates the Money
 * keyring through `addNewKeyring`, and derives the account through
 * `withKeyring`.
 *
 * @param messenger - The root messenger.
 * @returns The MoneyAccountController messenger.
 */
export function getMoneyAccountControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<MoneyAccountControllerMessenger>,
    MessengerEvents<MoneyAccountControllerMessenger>
  >,
): MoneyAccountControllerMessenger {
  const controllerMessenger: MoneyAccountControllerMessenger = new Messenger({
    namespace: 'MoneyAccountController',
    parent: messenger,
  });

  messenger.delegate({
    messenger: controllerMessenger,
    actions: [
      'KeyringController:getState',
      'KeyringController:addNewKeyring',
      'KeyringController:withKeyring',
    ],
    events: [],
  });

  return controllerMessenger;
}

type AllowedInitializationActions =
  | KeyringControllerGetStateAction
  | RemoteFeatureFlagControllerGetStateAction;

type AllowedInitializationEvents =
  | KeyringControllerUnlockEvent
  | RemoteFeatureFlagControllerStateChangeEvent;

export type MoneyAccountControllerInitMessenger = ReturnType<
  typeof getMoneyAccountControllerInitMessenger
>;

/**
 * Create a messenger for the actions and events needed while initializing the
 * MoneyAccountController.
 *
 * Money account creation is gated on the feature flag and on the wallet being
 * unlocked, and neither is knowable at construction time — hence the flag
 * state change and the unlock event.
 *
 * @param messenger - The root messenger.
 * @returns The MoneyAccountController init messenger.
 */
export function getMoneyAccountControllerInitMessenger(
  messenger: RootMessenger<
    AllowedInitializationActions,
    AllowedInitializationEvents
  >,
) {
  const initMessenger = new Messenger<
    'MoneyAccountControllerInit',
    AllowedInitializationActions,
    AllowedInitializationEvents,
    typeof messenger
  >({
    namespace: 'MoneyAccountControllerInit',
    parent: messenger,
  });

  messenger.delegate({
    messenger: initMessenger,
    actions: [
      'KeyringController:getState',
      'RemoteFeatureFlagController:getState',
    ],
    events: [
      'KeyringController:unlock',
      'RemoteFeatureFlagController:stateChange',
    ],
  });

  return initMessenger;
}
