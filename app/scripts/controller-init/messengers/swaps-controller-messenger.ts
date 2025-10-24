import { Messenger } from '@metamask/messenger';
import { NetworkControllerGetStateAction } from '@metamask/network-controller';
import { AllowedActions } from '../../controllers/swaps/swaps.types';
import { MetaMetricsControllerTrackEventAction } from '../../controllers/metametrics-controller';
import { RootMessenger } from '../../lib/messenger';

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
  messenger: RootMessenger<AllowedActions, never>,
) {
  const swapsControllerMessenger = new Messenger<
    'SwapsController',
    AllowedActions,
    never,
    typeof messenger
  >({
    namespace: 'SwapsController',
    parent: messenger,
  });
  messenger.delegate({
    messenger: swapsControllerMessenger,
    actions: [
      'NetworkController:getNetworkClientById',
      'NetworkController:getState',
      'TokenRatesController:getState',
    ],
  });
  return swapsControllerMessenger;
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
  messenger: RootMessenger<AllowedInitializationActions, never>,
) {
  const swapsControllerInitMessenger = new Messenger<
    'SwapsControllerInit',
    AllowedInitializationActions,
    never,
    typeof messenger
  >({
    namespace: 'SwapsControllerInit',
    parent: messenger,
  });
  messenger.delegate({
    messenger: swapsControllerInitMessenger,
    actions: ['MetaMetricsController:trackEvent', 'NetworkController:getState'],
  });
  return swapsControllerInitMessenger;
}
