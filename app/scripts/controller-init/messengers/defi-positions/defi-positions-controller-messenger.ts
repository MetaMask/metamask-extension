import { Messenger } from '@metamask/base-controller';
import {
  DeFiPositionsControllerAllowedActions,
  DeFiPositionsControllerAllowedEvents,
} from '@metamask/assets-controllers';

export type DefiPositionsControllerMessenger = ReturnType<
  typeof getDeFiPositionsControllerMessenger
>;

/**
 * Get a restricted messenger for the Defi Positions controller. This is scoped to the
 * actions and events that the Defi Positions controller is allowed to handle.
 *
 * @param messenger - The controller messenger to restrict.
 * @returns The restricted controller messenger.
 */
export function getDeFiPositionsControllerMessenger(
  messenger: Messenger<
    DeFiPositionsControllerAllowedActions,
    DeFiPositionsControllerAllowedEvents
  >,
) {
  return messenger.getRestricted({
    name: 'DeFiPositionsController',
    allowedActions: ['AccountsController:listAccounts'],
    allowedEvents: [
      'KeyringController:unlock',
      'KeyringController:lock',
      'TransactionController:transactionConfirmed',
      'AccountsController:accountAdded',
    ],
  });
}
