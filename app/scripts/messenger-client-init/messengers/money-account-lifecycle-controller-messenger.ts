import {
  Messenger,
  type MessengerActions,
  type MessengerEvents,
} from '@metamask/messenger';
import type { MoneyAccountLifecycleControllerMessenger } from '@metamask/money-account-lifecycle-controller';
import type {
  OnboardingControllerGetStateAction,
  OnboardingControllerStateChangeEvent,
} from '../../controllers/onboarding';
import type {
  PreferencesControllerGetStateAction,
  PreferencesControllerStateChangeEvent,
} from '../../controllers/preferences-controller';
import type { RootMessenger } from '../../lib/messenger';

/**
 * Create a messenger for the MoneyAccountLifecycleController.
 *
 * @param messenger - The root messenger.
 * @returns The MoneyAccountLifecycleController messenger.
 */
export function getMoneyAccountLifecycleControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<MoneyAccountLifecycleControllerMessenger>,
    MessengerEvents<MoneyAccountLifecycleControllerMessenger>
  >,
): MoneyAccountLifecycleControllerMessenger {
  const controllerMessenger: MoneyAccountLifecycleControllerMessenger =
    new Messenger({
      namespace: 'MoneyAccountLifecycleController',
      parent: messenger,
    });

  messenger.delegate({
    messenger: controllerMessenger,
    actions: [
      'ChompApiService:getDerivedIdentities',
      'ChompApiService:getDerivedIdentityByAddress',
      'ChompApiService:startFundsTransfer',
      'KeyringController:getState',
      'MoneyAccountController:createMoneyAccount',
      'MoneyAccountController:getMoneyAccount',
      'MoneyAccountController:setDefaultMoneyAccount',
      'MoneyAccountUpgradeController:getRegistrationStatus',
      'MoneyAccountUpgradeController:registerMigrationIntents',
      'MoneyAccountUpgradeController:upgradeAccount',
      'MoneyAccountUpgradeController:upgradeSuccessorAccount',
      'RemoteFeatureFlagController:getState',
      'SubscriptionController:getPricing',
      'SubscriptionController:getSubscriptions',
      'SubscriptionController:updatePaymentMethod',
      'SubscriptionDelegationService:prepareDelegation',
    ],
    events: [
      'KeyringController:stateChange',
      'MoneyAccountController:stateChange',
      'RemoteFeatureFlagController:stateChange',
    ],
  });

  return controllerMessenger;
}

type AllowedInitializationActions =
  | OnboardingControllerGetStateAction
  | PreferencesControllerGetStateAction;

type AllowedInitializationEvents =
  | OnboardingControllerStateChangeEvent
  | PreferencesControllerStateChangeEvent;

export type MoneyAccountLifecycleControllerInitMessenger = ReturnType<
  typeof getMoneyAccountLifecycleControllerInitMessenger
>;

/**
 * Create a messenger for the client gates the MoneyAccountLifecycleController
 * is enabled by.
 *
 * The controller itself watches keyring and feature-flag changes; the
 * extension additionally gates on onboarding being complete with basic
 * functionality enabled and re-runs the sync when either changes.
 *
 * @param messenger - The root messenger.
 * @returns The MoneyAccountLifecycleController init messenger.
 */
export function getMoneyAccountLifecycleControllerInitMessenger(
  messenger: RootMessenger<
    AllowedInitializationActions,
    AllowedInitializationEvents
  >,
) {
  const initMessenger = new Messenger<
    'MoneyAccountLifecycleControllerInit',
    AllowedInitializationActions,
    AllowedInitializationEvents,
    typeof messenger
  >({
    namespace: 'MoneyAccountLifecycleControllerInit',
    parent: messenger,
  });

  messenger.delegate({
    messenger: initMessenger,
    actions: [
      'OnboardingController:getState',
      'PreferencesController:getState',
    ],
    events: [
      'OnboardingController:stateChange',
      'PreferencesController:stateChange',
    ],
  });

  return initMessenger;
}
