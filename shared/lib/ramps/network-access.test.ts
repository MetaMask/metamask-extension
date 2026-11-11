import { isRampsNetworkAllowed } from './network-access';

describe('isRampsNetworkAllowed', () => {
  it('allows network access when onboarding is complete and basic functionality is on', () => {
    expect(
      isRampsNetworkAllowed({
        completedOnboarding: true,
        useExternalServices: true,
      }),
    ).toBe(true);
  });

  it('denies network access when onboarding is incomplete', () => {
    expect(
      isRampsNetworkAllowed({
        completedOnboarding: false,
        useExternalServices: true,
      }),
    ).toBe(false);
  });

  it('denies network access when basic functionality is off', () => {
    expect(
      isRampsNetworkAllowed({
        completedOnboarding: true,
        useExternalServices: false,
      }),
    ).toBe(false);
  });

  it('denies network access when both signals are missing', () => {
    expect(isRampsNetworkAllowed({})).toBe(false);
  });
});
