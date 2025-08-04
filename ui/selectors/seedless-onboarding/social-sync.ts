import {
  AuthConnection,
  SeedlessOnboardingControllerState,
} from '@metamask/seedless-onboarding-controller';

export type BackupState = {
  metamask: SeedlessOnboardingControllerState;
};

export function getSocialLoginType(
  state: BackupState,
): AuthConnection | undefined {
  return state.metamask.authConnection;
}

export function getSocialLoginEmail(state: BackupState): string | undefined {
  return state.metamask.socialLoginEmail;
}

/**
 * Checks if the social login flow has been initialized and the user is authenticated.
 *
 * @param state - The backup state.
 * @returns True if the social login flow has been initialized and the user is authenticated, false otherwise.
 */
export function getIsSocialLoginFlowInitialized(state: BackupState): boolean {
  const hasSocialLoginType = Boolean(getSocialLoginType(state));
  const hasSocialLoginEmail = Boolean(getSocialLoginEmail(state));

  // below is the assertion that the user is authenticated
  // and the SeedlessOnboardingController has necessary state data to proceed with the create/import flow
  const isUserAuthenticated =
    Array.isArray(state.metamask.nodeAuthTokens) &&
    typeof state.metamask.userId === 'string' &&
    typeof state.metamask.accessToken === 'string' &&
    typeof state.metamask.refreshToken === 'string';
  return hasSocialLoginType && hasSocialLoginEmail && isUserAuthenticated;
}
