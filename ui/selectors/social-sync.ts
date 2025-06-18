import { KeyringControllerState } from '@metamask/keyring-controller';
import {
  AuthConnection,
  SeedlessOnboardingControllerState,
} from '@metamask/seedless-onboarding-controller';

export type BackupState = {
  metamask: KeyringControllerState & SeedlessOnboardingControllerState;
};

export function getSocialLoginType(
  state: BackupState,
): AuthConnection | undefined {
  return state.metamask.authConnection;
}

export function getSocialLoginEmail(state: BackupState): string | undefined {
  return state.metamask.socialLoginEmail;
}
