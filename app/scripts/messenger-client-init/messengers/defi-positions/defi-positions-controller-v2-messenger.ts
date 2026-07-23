import {
  Messenger,
  type MessengerActions,
  type MessengerEvents,
} from '@metamask/messenger';
import {
  DeFiPositionsControllerV2Messenger,
  CurrencyRateControllerGetStateAction,
} from '@metamask/assets-controllers';
import { RemoteFeatureFlagControllerGetStateAction } from '@metamask/remote-feature-flag-controller';
import { AuthenticationControllerGetBearerTokenAction } from '@metamask/profile-sync-controller/auth';
import { RootMessenger } from '../../../lib/messenger';

/**
 * Get a restricted messenger for the DeFi Positions V2 controller. This is
 * scoped to the actions and events that the controller is allowed to handle.
 *
 * @param messenger - The controller messenger to restrict.
 * @returns The restricted controller messenger.
 */
export function getDeFiPositionsControllerV2Messenger(
  messenger: RootMessenger<
    MessengerActions<DeFiPositionsControllerV2Messenger>,
    MessengerEvents<DeFiPositionsControllerV2Messenger>
  >,
): DeFiPositionsControllerV2Messenger {
  const controllerMessenger: DeFiPositionsControllerV2Messenger = new Messenger(
    {
      namespace: 'DeFiPositionsControllerV2',
      parent: messenger,
    },
  );
  messenger.delegate({
    messenger: controllerMessenger,
    actions: ['AccountTreeController:getAccountsFromSelectedAccountGroup'],
  });
  return controllerMessenger;
}

type AllowedInitializationActions =
  | RemoteFeatureFlagControllerGetStateAction
  | CurrencyRateControllerGetStateAction
  | AuthenticationControllerGetBearerTokenAction;

export type DeFiPositionsControllerV2InitMessenger = ReturnType<
  typeof getDeFiPositionsControllerV2InitMessenger
>;

export function getDeFiPositionsControllerV2InitMessenger(
  messenger: RootMessenger<AllowedInitializationActions, never>,
) {
  const controllerInitMessenger = new Messenger<
    'DeFiPositionsControllerV2Init',
    AllowedInitializationActions,
    never,
    typeof messenger
  >({
    namespace: 'DeFiPositionsControllerV2Init',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerInitMessenger,
    actions: [
      'RemoteFeatureFlagController:getState',
      'CurrencyRateController:getState',
      'AuthenticationController:getBearerToken',
    ],
  });
  return controllerInitMessenger;
}
