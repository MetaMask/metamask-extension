export function blockRequestsBeforeOnboardingMiddleware({
  onboardingControllerStore,
}) {
  return (_, __, next, end) => {
    const isOnboardingComplete =
      onboardingControllerStore.getState().completedOnboarding;
    if (!isOnboardingComplete) {
      return end();
    }

    return next();
  };
}
