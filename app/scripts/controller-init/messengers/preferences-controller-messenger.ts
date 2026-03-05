import { Messenger } from '@metamask/messenger';
import { AllowedActions } from '../../controllers/preferences-controller';
import { RootMessenger } from '../../lib/messenger';

export type PreferencesControllerMessenger = ReturnType<
  typeof getPreferencesControllerMessenger
>;

/**
 * Create a messenger with delegated actions and events of the
 * preferences controller.
 *
 * @param messenger - The controller messenger to restrict.
 * @returns The controller messenger.
 */
export function getPreferencesControllerMessenger(
  messenger: RootMessenger<AllowedActions>,
) {
  const preferencesControllerMessenger = new Messenger<
    'PreferencesController',
    AllowedActions,
    never,
    typeof messenger
  >({
    namespace: 'PreferencesController',
    parent: messenger,
  });
  messenger.delegate({
    messenger: preferencesControllerMessenger,
    actions: [
      'AccountsController:getAccountByAddress',
      'AccountsController:setAccountName',
    ],
  });
  return preferencesControllerMessenger;
}
