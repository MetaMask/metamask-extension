import {
  MoneyAccountLifecycleController,
  type MoneyAccountLifecycleControllerMessenger,
} from '@metamask/money-account-lifecycle-controller';
import { isMoneyAccountEnabled } from '../../../shared/lib/money/feature-flags';
import type { MoneyAccountLifecycleControllerInitMessenger } from './messengers/money-account-lifecycle-controller-messenger';
import type { MessengerClientInitFunction } from './types';

/**
 * Initialize the MoneyAccountLifecycleController.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.initMessenger - The messenger for the client gates.
 * @returns The initialized controller.
 */
export const MoneyAccountLifecycleControllerInit: MessengerClientInitFunction<
  MoneyAccountLifecycleController,
  MoneyAccountLifecycleControllerMessenger,
  MoneyAccountLifecycleControllerInitMessenger
> = ({ controllerMessenger, initMessenger }) => {
  const areExternalServicesAllowed = () => {
    const { completedOnboarding } = initMessenger.call(
      'OnboardingController:getState',
    );
    const { useExternalServices } = initMessenger.call(
      'PreferencesController:getState',
    );

    return completedOnboarding && Boolean(useExternalServices);
  };

  const messengerClient = new MoneyAccountLifecycleController({
    messenger: controllerMessenger,
    hooks: {
      isEnabled: (remoteFeatureFlags) =>
        areExternalServicesAllowed() &&
        isMoneyAccountEnabled(remoteFeatureFlags),
    },
  });

  const onClientGateChange = () => {
    messengerClient.refresh().catch(() => undefined);
  };
  initMessenger.subscribe(
    'OnboardingController:stateChange',
    onClientGateChange,
  );
  initMessenger.subscribe(
    'PreferencesController:stateChange',
    onClientGateChange,
  );

  return { messengerClient, persistedStateKey: null, memStateKey: null };
};
