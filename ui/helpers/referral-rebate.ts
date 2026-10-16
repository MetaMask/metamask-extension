const ONBOARDING_REFERRAL_ACCEPTED_KEY = 'referral-rebate-onboarding-accepted';

/**
 * Records that the prototype referral was accepted during onboarding.
 */
export function markOnboardingReferralAccepted(): void {
  localStorage.setItem(ONBOARDING_REFERRAL_ACCEPTED_KEY, 'true');
}

/**
 * Checks whether Home should open directly to the activated-offer splash.
 *
 * @returns Whether the referral was accepted during onboarding
 */
export function wasOnboardingReferralAccepted(): boolean {
  return localStorage.getItem(ONBOARDING_REFERRAL_ACCEPTED_KEY) === 'true';
}

/**
 * Clears the one-time handoff after Home has opened the splash.
 */
export function clearOnboardingReferralAccepted(): void {
  localStorage.removeItem(ONBOARDING_REFERRAL_ACCEPTED_KEY);
}
