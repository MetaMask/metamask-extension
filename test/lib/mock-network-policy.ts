/** Creates private network capabilities for composed controller tests. */
export function createMockNetworkPolicyOptions() {
  return {
    networkPolicy: {
      update: jest.fn().mockResolvedValue(undefined),
      allowRpcValidation: jest
        .fn()
        .mockResolvedValue(jest.fn().mockResolvedValue(undefined)),
    },
    socialOnboardingNetworkPolicy: {
      beginSocialOnboarding: jest.fn().mockResolvedValue(undefined),
      endSocialOnboarding: jest.fn().mockResolvedValue(undefined),
    },
  };
}
