import { KeyringControllerState } from '@metamask/keyring-controller';
import { SeedlessOnboardingControllerState } from '@metamask/seedless-onboarding-controller';

export type BackupState = {
  metamask: KeyringControllerState & SeedlessOnboardingControllerState;
};

export function getSocialLoginEmail(state: BackupState): string | undefined {
  return state.metamask.socialLoginEmail;
}
