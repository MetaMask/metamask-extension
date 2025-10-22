import { Messenger } from '@metamask/base-controller';
import { AccountOrderControllerState } from '../../controllers/account-order';

export type AccountOrderControllerMessenger = ReturnType<
  typeof getAccountOrderControllerMessenger
>;

export type AccountOrderControllerGetStateAction = {
  type: 'AccountOrderController:getState';
  handler: () => AccountOrderControllerState;
};

export type AccountOrderAllowedActions = AccountOrderControllerGetStateAction;

/**
 * Create a messenger restricted to the allowed actions and events of the
 * account order controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getAccountOrderControllerMessenger(
  messenger: Messenger<AccountOrderAllowedActions, never>,
) {
  return messenger.getRestricted({
    name: 'AccountOrderController',

    // This controller does not call any actions or subscribe to any events.
    allowedActions: [],
    allowedEvents: [],
  });
}
