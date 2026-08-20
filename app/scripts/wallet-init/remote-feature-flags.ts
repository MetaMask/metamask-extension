import { Messenger } from '@metamask/messenger';
import {
  type RemoteFeatureFlagControllerEnableAction,
  type RemoteFeatureFlagControllerDisableAction,
  type RemoteFeatureFlagControllerUpdateRemoteFeatureFlagsAction,
} from '@metamask/remote-feature-flag-controller';
import { previousValueComparator } from '../lib/util';
import { RootMessenger } from '../lib/messenger';
import type {
  PreferencesControllerState,
  PreferencesControllerStateChangeEvent,
} from '../controllers/preferences-controller';
import type {
  OnboardingControllerState,
  OnboardingControllerStateChangeEvent,
} from '../controllers/onboarding';

type RemoteFeatureFlagToggleActions =
  | RemoteFeatureFlagControllerEnableAction
  | RemoteFeatureFlagControllerDisableAction
  | RemoteFeatureFlagControllerUpdateRemoteFeatureFlagsAction;

type RemoteFeatureFlagToggleParentMessenger = RootMessenger<
  RemoteFeatureFlagToggleActions,
  PreferencesControllerStateChangeEvent | OnboardingControllerStateChangeEvent
>;

/**
 * Wire the extension-side enable/disable orchestration for the wallet-owned
 * `RemoteFeatureFlagController`.
 *
 * The controller is constructed (through `@metamask/wallet`) with an initial
 * `disabled` value; this keeps it in sync as the user completes onboarding or
 * toggles the external-services preference, and refreshes the flags whenever
 * the controller is (re-)enabled. Flags are only fetched once onboarding is
 * complete and external services are enabled. The controller is driven entirely
 * over the messenger, so no controller instance needs to be passed in.
 *
 * @param options - Options bag.
 * @param options.messenger - The root messenger to delegate from; a namespaced
 * child is created internally, subscribed on, and used to call the
 * `RemoteFeatureFlagController` enable/disable/update actions.
 * @param options.preferencesState - The initial `PreferencesController` state.
 * @param options.onboardingState - The initial `OnboardingController` state.
 */
export function setupRemoteFeatureFlagToggle({
  messenger,
  preferencesState,
  onboardingState,
}: {
  messenger: RemoteFeatureFlagToggleParentMessenger;
  preferencesState: Pick<PreferencesControllerState, 'useExternalServices'>;
  onboardingState: Pick<OnboardingControllerState, 'completedOnboarding'>;
}): void {
  const toggleMessenger = new Messenger<
    'RemoteFeatureFlagToggle',
    RemoteFeatureFlagToggleActions,
    | PreferencesControllerStateChangeEvent
    | OnboardingControllerStateChangeEvent,
    RemoteFeatureFlagToggleParentMessenger
  >({
    namespace: 'RemoteFeatureFlagToggle',
    parent: messenger,
  });
  messenger.delegate({
    messenger: toggleMessenger,
    actions: [
      'RemoteFeatureFlagController:enable',
      'RemoteFeatureFlagController:disable',
      'RemoteFeatureFlagController:updateRemoteFeatureFlags',
    ],
    events: [
      'PreferencesController:stateChange',
      'OnboardingController:stateChange',
    ],
  });

  let canUseExternalServices = preferencesState.useExternalServices === true;
  let hasCompletedOnboarding = onboardingState.completedOnboarding === true;

  const toggle = () => {
    if (!hasCompletedOnboarding || !canUseExternalServices) {
      toggleMessenger.call('RemoteFeatureFlagController:disable');
    } else {
      toggleMessenger.call('RemoteFeatureFlagController:enable');
      toggleMessenger
        .call('RemoteFeatureFlagController:updateRemoteFeatureFlags')
        .catch((error) => {
          console.error('Failed to update remote feature flags:', error);
        });
    }
  };

  toggleMessenger.subscribe(
    'PreferencesController:stateChange',
    previousValueComparator((prevState, currState) => {
      const { useExternalServices: prev } = prevState;
      const { useExternalServices: curr } = currState;
      if (curr !== prev) {
        canUseExternalServices = curr === true;
        toggle();
      }
      return true;
    }, preferencesState),
  );

  toggleMessenger.subscribe(
    'OnboardingController:stateChange',
    previousValueComparator((prevState, currState) => {
      const { completedOnboarding: prev } = prevState;
      const { completedOnboarding: curr } = currState;
      if (curr !== prev) {
        hasCompletedOnboarding = curr === true;
        toggle();
      }
      return true;
    }, onboardingState),
  );
}
