import { Messenger } from '@metamask/messenger';
import type {
  AuthenticationControllerState,
  AuthenticationControllerStateChangeEvent,
} from '@metamask/profile-sync-controller/auth';
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

type RemoteFeatureFlagToggleEvents =
  | PreferencesControllerStateChangeEvent
  | OnboardingControllerStateChangeEvent
  | AuthenticationControllerStateChangeEvent;

type RemoteFeatureFlagToggleParentMessenger = RootMessenger<
  RemoteFeatureFlagToggleActions,
  RemoteFeatureFlagToggleEvents
>;

/**
 * Read the canonical profile id used for threshold flag segmentation.
 *
 * @param srpSessionData - Persisted SRP session map from AuthenticationController.
 * @returns The first session's canonical profile id, or an empty string.
 */
function getCanonicalProfileId(
  srpSessionData: AuthenticationControllerState['srpSessionData'],
): string {
  return (
    Object.entries(srpSessionData ?? {})?.[0]?.[1]?.profile
      ?.canonicalProfileId ?? ''
  );
}

/**
 * Wire the extension-side enable/disable orchestration for the wallet-owned
 * `RemoteFeatureFlagController`.
 *
 * The controller is constructed (through `@metamask/wallet`) with an initial
 * `disabled` value; this keeps it in sync as the user completes onboarding or
 * toggles the external-services preference, and refreshes the flags whenever
 * the controller is (re-)enabled. Flags are only fetched once onboarding is
 * complete and external services are enabled. When a canonical profile id
 * becomes available (or changes), flags are force-refreshed so threshold
 * segmentation can reprocess against that id. The controller is driven
 * entirely over the messenger, so no controller instance needs to be passed in.
 *
 * @param options - Options bag.
 * @param options.messenger - The root messenger to delegate from; a namespaced
 * child is created internally, subscribed on, and used to call the
 * `RemoteFeatureFlagController` enable/disable/update actions.
 * @param options.preferencesState - The initial `PreferencesController` state.
 * @param options.onboardingState - The initial `OnboardingController` state.
 * @param options.authenticationState - The initial `AuthenticationController`
 * state, used to seed the canonical-profile-id comparison so a returning
 * signed-in user does not trigger a redundant force refresh.
 */
export function setupRemoteFeatureFlagToggle({
  messenger,
  preferencesState,
  onboardingState,
  authenticationState,
}: {
  messenger: RemoteFeatureFlagToggleParentMessenger;
  preferencesState: Pick<PreferencesControllerState, 'useExternalServices'>;
  onboardingState: Pick<OnboardingControllerState, 'completedOnboarding'>;
  authenticationState: Pick<AuthenticationControllerState,'srpSessionData'>;
}): void {
  const toggleMessenger = new Messenger<
    'RemoteFeatureFlagToggle',
    RemoteFeatureFlagToggleActions,
    RemoteFeatureFlagToggleEvents,
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
      'AuthenticationController:stateChange',
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

  // Force-refresh flags when a canonical profile id first becomes available
  // or later changes. `force: true` bypasses the fetch cache so threshold
  // flags reprocess against the new id; a no-op if the controller is disabled.
  toggleMessenger.subscribe(
    'AuthenticationController:stateChange',
    previousValueComparator((prevState, currState) => {
      const prev = getCanonicalProfileId(prevState.srpSessionData);
      const curr = getCanonicalProfileId(currState.srpSessionData);
      if (curr !== prev) {
        toggleMessenger
          .call('RemoteFeatureFlagController:updateRemoteFeatureFlags', true)
          .catch((error) => {
            console.error('Failed to update remote feature flags:', error);
          });
      }
      return true;
    }, authenticationState),
  );
}
