// blockRequestsBeforeOnboardingMiddleware
export function blockRequestsBeforeOnboardingMiddleware({ onboardingControllerStore }) {
  return ((_, __, next, end) => {
    const isOnboardingComplete = onboardingControllerStore.getState().completedOnboarding
    if (!isOnboardingComplete) {
      return end();
      // is this better?
      // res.error = new Error("Error message")
      // return next();
    }

    return next();
  });
}