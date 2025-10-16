import { Messenger } from '@metamask/base-controller';
import { NetworkControllerGetStateAction } from '@metamask/network-controller';
import { AllowedActions } from '../../controllers/swaps/swaps.types';
import { MetaMetricsControllerTrackEventAction } from '../../controllers/metametrics-controller';

export type SwapsControllerMessenger = ReturnType<
  typeof getSwapsControllerMessenger
>;

/**
 * Create a messenger restricted to the allowed actions and events of the
 * swaps controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getSwapsControllerMessenger(
  messenger: Messenger<AllowedActions, never>,
) {
  return messenger.getRestricted({
    name: 'SwapsController',
    allowedActions: [
      'NetworkController:getNetworkClientById',
      'NetworkController:getState',
      'TokenRatesController:getState',
    ],
    allowedEvents: [],
  });
}

type AllowedInitializationActions =
  | MetaMetricsControllerTrackEventAction
  | NetworkControllerGetStateAction;

export type SwapsControllerInitMessenger = ReturnType<
  typeof getSwapsControllerInitMessenger
>;

/**
 * Create a messenger restricted to the allowed actions and events needed to
 * initialize the swaps controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getSwapsControllerInitMessenger(
  messenger: Messenger<AllowedInitializationActions, never>,
) {
  return messenger.getRestricted({
    name: 'SwapsControllerInit',
    allowedActions: [
      'MetaMetricsController:trackEvent',
      'NetworkController:getState',
    ],
    allowedEvents: [],
  });
}
