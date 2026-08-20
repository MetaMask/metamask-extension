import { SeedlessOnboardingControllerState } from '@metamask/seedless-onboarding-controller';
import { MetaMetricsEventAccountType } from '../../../shared/constants/metametrics';
import {
  AuthConnection,
  FirstTimeFlowType,
} from '../../../shared/constants/onboarding';
import { OnboardingControllerState } from '../../../shared/types/onboarding';
import { getIsSocialLoginFlow } from '../first-time-flow';

export type OnboardingState = {
  metamask: Partial<SeedlessOnboardingControllerState> &
    OnboardingControllerState;
};

export function getSocialLoginType(
  state: OnboardingState,
): AuthConnection | undefined {
  return state.metamask.authConnection;
}

export function getSocialLoginEmail(
  state: OnboardingState,
): string | undefined {
  return state.metamask.socialLoginEmail;
}

/**
 * Checks if the social login flow has been initialized and the user is authenticated.
 *
 * @param state - The backup state.
 * @returns True if the social login flow has been initialized and the user is authenticated, false otherwise.
 */
export function getIsSocialLoginUserAuthenticated(
  state: OnboardingState,
): boolean {
  const hasSocialLoginType = Boolean(getSocialLoginType(state));
  const hasSocialLoginEmail = Boolean(getSocialLoginEmail(state));

  return (
    Boolean(state.metamask.isSeedlessOnboardingUserAuthenticated) &&
    hasSocialLoginType &&
    hasSocialLoginEmail
  );
}

/**
 * Get the `account_type` property value for onboarding metrics.
 *
 * @param state - The backup state.
 * @returns The `account_type` property value for onboarding metrics.
 */
export function getAccountTypeForOnboardingMetrics(
  state: OnboardingState,
): string {
  const { firstTimeFlowType } = state.metamask;
  const baseType =
    firstTimeFlowType === FirstTimeFlowType.import
      ? MetaMetricsEventAccountType.Imported
      : MetaMetricsEventAccountType.Default;
  const socialLoginType = getSocialLoginType(state);
  const isSocialLoginFlow = getIsSocialLoginFlow(state);
  if (isSocialLoginFlow && socialLoginType) {
    const socialProvider = String(socialLoginType).toLowerCase();
    return `${baseType}_${socialProvider}`;
  }
  return baseType;
}
