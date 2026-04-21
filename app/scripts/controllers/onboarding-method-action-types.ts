/**
 * This file is auto generated.
 * Do not edit manually.
 */

import type { OnboardingController } from './onboarding';

/**
 * Setter for the `seedPhraseBackedUp` property
 *
 * @param newSeedPhraseBackUpState - Indicates if the seedphrase is backup by the user or not
 */
export type OnboardingControllerSetSeedPhraseBackedUpAction = {
  type: `OnboardingController:setSeedPhraseBackedUp`;
  handler: OnboardingController['setSeedPhraseBackedUp'];
};

/**
 * Sets the completedOnboarding state to true, indicating that the user has completed the
 * onboarding process.
 */
export type OnboardingControllerCompleteOnboardingAction = {
  type: `OnboardingController:completeOnboarding`;
  handler: OnboardingController['completeOnboarding'];
};

/**
 * Setter for the `firstTimeFlowType` property
 *
 * @param type - Indicates the type of first time flow - create or import - the user wishes to follow
 */
export type OnboardingControllerSetFirstTimeFlowTypeAction = {
  type: `OnboardingController:setFirstTimeFlowType`;
  handler: OnboardingController['setFirstTimeFlowType'];
};

/**
 * Registering a site as having initiated onboarding
 *
 * @param location - The location of the site registering
 * @param tabId - The id of the tab registering
 */
export type OnboardingControllerRegisterOnboardingAction = {
  type: `OnboardingController:registerOnboarding`;
  handler: OnboardingController['registerOnboarding'];
};

/**
 * Check if the user onboarding flow is Social login flow or not.
 *
 * @returns true if the user onboarding flow is Social loing flow, otherwise false.
 */
export type OnboardingControllerGetIsSocialLoginFlowAction = {
  type: `OnboardingController:getIsSocialLoginFlow`;
  handler: OnboardingController['getIsSocialLoginFlow'];
};

/**
 * Reset the onboarding controller state.
 */
export type OnboardingControllerResetOnboardingAction = {
  type: `OnboardingController:resetOnboarding`;
  handler: OnboardingController['resetOnboarding'];
};

/**
 * Union of all OnboardingController action types.
 */
export type OnboardingControllerMethodActions =
  | OnboardingControllerSetSeedPhraseBackedUpAction
  | OnboardingControllerCompleteOnboardingAction
  | OnboardingControllerSetFirstTimeFlowTypeAction
  | OnboardingControllerRegisterOnboardingAction
  | OnboardingControllerGetIsSocialLoginFlowAction
  | OnboardingControllerResetOnboardingAction;
