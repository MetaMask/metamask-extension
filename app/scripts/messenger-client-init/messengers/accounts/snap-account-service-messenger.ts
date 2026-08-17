import {
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';
import { SnapAccountServiceMessenger as ServiceMessenger } from '@metamask/snap-account-service';
import { RootMessenger } from '../../../lib/messenger';

type Actions = MessengerActions<ServiceMessenger>;
type Events = MessengerEvents<ServiceMessenger>;

export type SnapAccountServiceMessenger = ServiceMessenger;

/**
 * Get a restricted messenger for the snap account service. This is scoped to the
 * actions and events that this service is allowed to handle.
 *
 * @param messenger - The controller messenger to restrict.
 * @returns The restricted controller messenger.
 */
export function getSnapAccountServiceMessenger(
  messenger: RootMessenger<Actions, Events>,
): SnapAccountServiceMessenger {
  const serviceMessenger = new Messenger<
    'SnapAccountService',
    Actions,
    Events,
    typeof messenger
  >({
    namespace: 'SnapAccountService',
    parent: messenger,
  });
  messenger.delegate({
    messenger: serviceMessenger,
    actions: [
      'KeyringController:withController',
      'KeyringController:withKeyringV2',
      'KeyringController:withKeyringV2Unsafe',
      'KeyringController:getState',
      'SnapController:getState',
      'SnapController:getSnap',
      'SnapController:getRunnableSnaps',
      'SnapController:handleRequest',
      'AccountTreeController:getAccountGroupObject',
      'AccountTreeController:getSelectedAccountGroup',
    ],
    events: [
      'KeyringController:stateChange',
      'KeyringController:unlock',
      'SnapController:stateChange',
      'SnapController:snapInstalled',
      'SnapController:snapEnabled',
      'SnapController:snapDisabled',
      'SnapController:snapBlocked',
      'SnapController:snapUnblocked',
      'SnapController:snapUninstalled',
      'AccountTreeController:selectedAccountGroupChange',
      'AccountTreeController:accountGroupCreated',
      'AccountTreeController:accountGroupUpdated',
      'AccountTreeController:accountGroupRemoved',
    ],
  });
  return serviceMessenger;
}
