import type {
  AuthenticationControllerState,
  ProfileSignInInfo,
} from '@metamask/profile-sync-controller/auth';
import type { PreferencesController } from '../controllers/preferences-controller';
import {
  authenticationStateIncludesLinkedSocialLogin,
  profileAliasesIncludeSocialLogin,
  type AuthenticationControllerStateWithLinkedSocial,
} from '../../../shared/lib/linked-social-login-profile';
import type { RootMessenger } from './messenger';

type LinkedSocialLoginProfileSyncMessenger = RootMessenger<
  | {
      type: 'AuthenticationController:getState';
      handler: () => AuthenticationControllerState;
    }
  | {
      type: 'PreferencesController:consolidateBasicFunctionality';
      handler: () => void;
    },
  never
>;

/**
 * Persists linked-social-login state and re-runs consolidation repair when Core
 * exposes social identifiers after `performSignIn`.
 *
 * @param preferencesController - Preferences controller used to persist the flag.
 * @param hasLinkedSocialLogin - Whether linked social identifiers were detected.
 */
export function applyLinkedSocialLoginProfileDetection(
  preferencesController: PreferencesController,
  hasLinkedSocialLogin: boolean,
): void {
  if (!hasLinkedSocialLogin) {
    return;
  }

  const { hasLinkedSocialLoginProfile } =
    preferencesController.getPreferences();

  if (!hasLinkedSocialLoginProfile) {
    preferencesController.setPreference('hasLinkedSocialLoginProfile', true);
  }

  preferencesController.consolidateBasicFunctionality();
}

/**
 * Registers background listeners that mirror Core auth signals into the
 * `hasLinkedSocialLoginProfile` preference.
 *
 * Depends on Core exposing `pairedIdentifierIds` / `linkedSocialIdentifierTypes`
 * on `AuthenticationController` state after SRP login, and on
 * `AuthenticationController:profileSignIn` for multi-SRP alias events.
 *
 * @param messenger - Root controller messenger.
 * @param preferencesController - Preferences controller to update.
 */
export function registerLinkedSocialLoginProfileSync(
  messenger: LinkedSocialLoginProfileSyncMessenger,
  preferencesController: PreferencesController,
): void {
  messenger.subscribe(
    'AuthenticationController:profileSignIn',
    ({ profileAliases }: ProfileSignInInfo) => {
      applyLinkedSocialLoginProfileDetection(
        preferencesController,
        profileAliasesIncludeSocialLogin(profileAliases),
      );
    },
  );

  messenger.subscribe(
    'AuthenticationController:stateChange',
    (authState: AuthenticationControllerState) => {
      applyLinkedSocialLoginProfileDetection(
        preferencesController,
        authenticationStateIncludesLinkedSocialLogin(
          authState as AuthenticationControllerStateWithLinkedSocial,
        ),
      );
    },
  );
}
