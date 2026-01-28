export const SHIELD_ERROR = {
  tabActionFailed: 'tab action failed',
  stripePaymentCancelled: 'stripe payment cancelled',
  subscriptionPollingTimedOut: 'subscription polling timed out',
};

/**
 * Check if an error is a non-UI subscription error (should be logged but not shown to user)
 *
 * @param error - The error to check
 * @returns True if the error should not be shown to the UI
 */
export function isNonUISubscriptionError(error: Error | undefined): boolean {
  if (!error?.message) {
    return false;
  }
  const lowerMessage = error.message.toLowerCase();
  return (
    lowerMessage.includes(SHIELD_ERROR.tabActionFailed.toLowerCase()) ||
    lowerMessage.includes(SHIELD_ERROR.stripePaymentCancelled.toLowerCase())
  );
}

export const SHIELD_CAROUSEL_ID = 'contentful-1MftLVfZkCqPH1EA8jtSOm';
