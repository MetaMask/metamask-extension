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
 * Records that the user has been shown the onboarding completion page at least once.
 *
 * @param hasSeenOnboardingCompletionPage - Whether the onboarding completion page has been shown.
 */
export type OnboardingControllerSetHasSeenOnboardingCompletionPageAction = {
  type: `OnboardingController:setHasSeenOnboardingCompletionPage`;
  handler: OnboardingController['setHasSeenOnboardingCompletionPage'];
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
 * Start or resume the onboarding journey associated with a browser tab.
 *
 * A tab with a live journey is resumed. A new journey is not opened after
 * this profile has finished onboarding or already ended a journey
 * successfully.
 *
 * @param request - The onboarding tab and current step.
 * @returns The opaque ID used to parent child traces, or undefined when no
 * journey should be opened.
 */
export type OnboardingControllerStartOnboardingJourneyAction = {
  type: `OnboardingController:startOnboardingJourney`;
  handler: OnboardingController['startOnboardingJourney'];
};

/**
 * Update the last known onboarding step for a browser tab.
 *
 * @param request - The onboarding tab and current step.
 */
export type OnboardingControllerUpdateOnboardingJourneyAction = {
  type: `OnboardingController:updateOnboardingJourney`;
  handler: OnboardingController['updateOnboardingJourney'];
};

/**
 * End the onboarding journey associated with a browser tab.
 *
 * @param request - The onboarding tab, result, and last step.
 */
export type OnboardingControllerEndOnboardingJourneyAction = {
  type: `OnboardingController:endOnboardingJourney`;
  handler: OnboardingController['endOnboardingJourney'];
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
  | OnboardingControllerSetHasSeenOnboardingCompletionPageAction
  | OnboardingControllerSetFirstTimeFlowTypeAction
  | OnboardingControllerRegisterOnboardingAction
  | OnboardingControllerGetIsSocialLoginFlowAction
  | OnboardingControllerStartOnboardingJourneyAction
  | OnboardingControllerUpdateOnboardingJourneyAction
  | OnboardingControllerEndOnboardingJourneyAction
  | OnboardingControllerResetOnboardingAction;
