import { Messenger } from '@metamask/base-controller';
import { NetworkControllerStateChangeEvent } from '@metamask/network-controller';
import {
  AccountsControllerGetSelectedAccountAction,
  AccountsControllerSelectedAccountChangeEvent,
} from '@metamask/accounts-controller';

import {
  DeFiPositionsControllerActions,
  DeFiPositionsControllerEvents,
  DeFiPositionsControllerGetStateAction,
  DeFiPositionsControllerStateChangeEvent,
} from '@metamask/assets-controllers';

type Actions =
  | DeFiPositionsControllerGetStateAction
  | AccountsControllerGetSelectedAccountAction;

type Events =
  | NetworkControllerStateChangeEvent
  | AccountsControllerSelectedAccountChangeEvent
  | DeFiPositionsControllerStateChangeEvent;

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
  messenger: Messenger<Actions, Events>,
) {
  return messenger.getRestricted({
    name: 'DeFiPositionsController',
    allowedActions: [
      // 'DeFiPositionsController:getState',
      'AccountsController:getSelectedAccount',
    ],
    allowedEvents: [
      // 'DeFiPositionsController:stateChange',
      'AccountsController:selectedAccountChange',
      'NetworkController:stateChange',
    ],
  });
}
