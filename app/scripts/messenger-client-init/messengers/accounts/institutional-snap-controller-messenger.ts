import {
  Messenger,
  type MessengerActions,
  type MessengerEvents,
} from '@metamask/messenger';
import { RootMessenger } from '../../../lib/messenger';
import type { InstitutionalSnapControllerMessenger } from '../../../controllers/institutional-snap/InstitutionalSnapController';

/**
 * Get a restricted controller messenger for the rate limit controller. This is
 * scoped to the actions and events that the rate limit controller is allowed to
 * handle.
 *
 * @param messenger - The root messenger.
 * @returns The controller messenger.
 */
export function getInstitutionalSnapControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<InstitutionalSnapControllerMessenger>,
    MessengerEvents<InstitutionalSnapControllerMessenger>
  >,
) {
  const institutionalSnapControllerMessenger: InstitutionalSnapControllerMessenger =
    new Messenger({
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
