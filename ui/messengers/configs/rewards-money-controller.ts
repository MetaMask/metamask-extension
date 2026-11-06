import { defineExcludedCapabilities } from './helpers';

// Only the background's intercepted/install link pipeline can capture context
// and decide whether the existing security policy requires an interstitial.
export const EXCLUDED_CAPABILITIES = defineExcludedCapabilities({
  actions: ['RewardsMoneyController:captureReferralContext'],
  events: [],
});
