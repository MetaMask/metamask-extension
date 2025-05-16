import { AccountsControllerGetAccountByAddressAction } from '@metamask/accounts-controller';
import { Messenger, RestrictedMessenger } from '@metamask/base-controller';
import { HandleSnapRequest } from '@metamask/snaps-controllers';
import { TransactionControllerUpdateCustodialTransactionAction } from '@metamask/transaction-controller';
import { InstitutionalSnapController } from '../../../controllers/institutional-snap/InstitutionalSnapController';

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

export type InstitutionalSnapControllerMessenger = RestrictedMessenger<
  'InstitutionalSnapControllerMessenger',
  Actions,
  never,
  Actions['type'],
  never
>;

/**
 * Get a restricted controller messenger for the rate limit controller. This is
 * scoped to the actions and events that the rate limit controller is allowed to
 * handle.
 *
 * @param messenger - The messenger to restrict.
 * @returns The restricted controller messenger.
 */
export function getInstitutionalSnapControllerMessenger(
  messenger: Messenger<Actions, never>,
) {
  return messenger.getRestricted({
    name: 'InstitutionalSnapController',
    allowedActions: [
      'AccountsController:getAccountByAddress',
      'SnapController:handleRequest',
      'TransactionController:updateCustodialTransaction',
    ],
    allowedEvents: [],
  });
}
