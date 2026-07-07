import {
  Messenger,
  type MessengerActions,
  type MessengerEvents,
} from '@metamask/messenger';
import { DeFiPositionsControllerMessenger } from '@metamask/assets-controllers';
import { RemoteFeatureFlagControllerGetStateAction } from '@metamask/remote-feature-flag-controller';
import { MetaMetricsControllerTrackEventAction } from '../../../controllers/metametrics-controller-method-action-types';
import { RootMessenger } from '../../../lib/messenger';

/**
 * Get a restricted messenger for the Defi Positions controller. This is scoped to the
 * actions and events that the Defi Positions controller is allowed to handle.
 *
 * @param messenger - The controller messenger to restrict.
 * @returns The restricted controller messenger.
 */
export function getDeFiPositionsControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<DeFiPositionsControllerMessenger>,
    MessengerEvents<DeFiPositionsControllerMessenger>
  >,
): DeFiPositionsControllerMessenger {
  const controllerMessenger: DeFiPositionsControllerMessenger = new Messenger({
    namespace: 'DeFiPositionsController',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerMessenger,
    actions: ['AccountTreeController:getAccountsFromSelectedAccountGroup'],
    events: [
      'KeyringController:lock',
      'TransactionController:transactionConfirmed',
      'AccountTreeController:selectedAccountGroupChange',
    ],
  });
  return controllerMessenger;
}

type AllowedInitializationActions =
  | RemoteFeatureFlagControllerGetStateAction
  | MetaMetricsControllerTrackEventAction;

export type DeFiPositionsControllerInitMessenger = ReturnType<
  typeof getDeFiPositionsControllerInitMessenger
>;

export function getDeFiPositionsControllerInitMessenger(
  messenger: RootMessenger<AllowedInitializationActions, never>,
) {
  const controllerInitMessenger = new Messenger<
    'DeFiPositionsControllerInit',
    AllowedInitializationActions,
    never,
    typeof messenger
  >({
    namespace: 'DeFiPositionsControllerInit',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerInitMessenger,
    actions: [
      'RemoteFeatureFlagController:getState',
      'MetaMetricsController:trackEvent',
    ],
  });
  return controllerInitMessenger;
}
