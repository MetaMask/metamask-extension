import { AccountsControllerGetSelectedAccountAction } from '@metamask/accounts-controller';
import { Messenger } from '@metamask/messenger';
import { type DelegationControllerMessenger } from '@metamask/delegation-controller';
import { type KeyringControllerSignTypedMessageAction } from '@metamask/keyring-controller';
import { TransactionControllerTransactionStatusUpdatedEvent } from '@metamask/transaction-controller';
import { RootMessenger } from '../../../lib/messenger';

export { type DelegationControllerMessenger } from '@metamask/delegation-controller';

export type DelegationControllerInitMessenger = ReturnType<
  typeof getDelegationControllerInitMessenger
>;

type AllowedActions =
  | KeyringControllerSignTypedMessageAction
  | AccountsControllerGetSelectedAccountAction;

type AllowedEvents = TransactionControllerTransactionStatusUpdatedEvent;

export function getDelegationControllerMessenger(
  messenger: RootMessenger<AllowedActions, AllowedEvents>,
): DelegationControllerMessenger {
  const controllerMessenger = new Messenger<
    'DelegationController',
    AllowedActions,
    AllowedEvents,
    typeof messenger
  >({
    namespace: 'DelegationController',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerMessenger,
    actions: [
      'AccountsController:getSelectedAccount',
      'KeyringController:signTypedMessage',
    ],
    events: ['TransactionController:transactionStatusUpdated'],
  });
  return controllerMessenger;
}

export function getDelegationControllerInitMessenger(
  messenger: RootMessenger<AllowedActions, AllowedEvents>,
) {
  const controllerInitMessenger = new Messenger<
    'DelegationControllerInit',
    AllowedActions,
    AllowedEvents,
    typeof messenger
  >({
    namespace: 'DelegationControllerInit',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerInitMessenger,
    events: ['TransactionController:transactionStatusUpdated'],
  });
  return controllerInitMessenger;
}
