import { AccountsControllerGetAccountByAddressAction } from '@metamask/accounts-controller';
import { Messenger } from '@metamask/messenger';
import { SnapControllerHandleRequestAction } from '@metamask/snaps-controllers';
import { TransactionControllerUpdateCustodialTransactionAction } from '@metamask/transaction-controller';

import { InstitutionalSnapControllerMethodActions } from '../../../controllers/institutional-snap/InstitutionalSnapController-method-action-types';
import { RootMessenger } from '../../../lib/messenger';

export type InstitutionalSnapRequestSearchParameters = {
  from: string;
  to: string;
  value: string;
  data: string;
  chainId: string;
};

type Actions =
  | SnapControllerHandleRequestAction
  | AccountsControllerGetAccountByAddressAction
  | TransactionControllerUpdateCustodialTransactionAction
  | InstitutionalSnapControllerMethodActions;

export type InstitutionalSnapControllerMessenger = ReturnType<
  typeof getInstitutionalSnapControllerMessenger
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
    'InstitutionalSnapController',
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
