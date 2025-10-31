import { AccountsControllerGetAccountByAddressAction } from '@metamask/accounts-controller';
import { Messenger } from '@metamask/messenger';
import { HandleSnapRequest } from '@metamask/snaps-controllers';
import { TransactionControllerUpdateCustodialTransactionAction } from '@metamask/transaction-controller';
import { InstitutionalSnapController } from '../../../controllers/institutional-snap/InstitutionalSnapController';
import { RootMessenger } from '../../../lib/messenger';

const controllerName = 'InstitutionalSnapController';

export type InstitutionalSnapControllerPublishHookAction = {
  type: `${typeof controllerName}:publishHook`;
  handler: InstitutionalSnapController['deferPublicationHook'];
};

export type InstitutionalSnapControllerBeforeCheckPendingTransactionHookAction =
  {
    type: `${typeof controllerName}:beforeCheckPendingTransactionHook`;
    handler: InstitutionalSnapController['beforeCheckPendingTransactionHook'];
  };

export type InstitutionalSnapRequestSearchParameters = {
  from: string;
  to: string;
  value: string;
  data: string;
  chainId: string;
};

type AllowedActions =
  | HandleSnapRequest
  | AccountsControllerGetAccountByAddressAction
  | TransactionControllerUpdateCustodialTransactionAction;

type Actions =
  | AllowedActions
  | InstitutionalSnapControllerPublishHookAction
  | InstitutionalSnapControllerBeforeCheckPendingTransactionHookAction;

export type InstitutionalSnapControllerMessenger = Messenger<
  'InstitutionalSnapControllerMessenger',
  Actions,
  never
>;

/**
 * Get a restricted controller messenger for the rate limit controller. This is
 * scoped to the actions and events that the rate limit controller is allowed to
 * handle.
 *
 * @param messenger - The root messenger.
 * @returns The controller messenger.
 */
export function getInstitutionalSnapControllerMessenger(
  messenger: RootMessenger<Actions, never>,
) {
  const institutionalSnapControllerMessenger = new Messenger<
    typeof controllerName,
    Actions,
    never,
    typeof messenger
  >({
    namespace: 'InstitutionalSnapController',
    parent: messenger,
  });
  messenger.delegate({
    messenger: institutionalSnapControllerMessenger,
    actions: [
      'AccountsController:getAccountByAddress',
      'SnapController:handleRequest',
      'TransactionController:updateCustodialTransaction',
    ],
  });
  return institutionalSnapControllerMessenger;
}
