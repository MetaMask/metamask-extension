import { getCompletedMetaMetricsOnboarding, getOptedIn } from './metametrics';

describe('MetaMetrics selectors', () => {
  const state = (metamask: Record<string, unknown>) => ({ metamask });

  it('returns whether the user has opted in to analytics', () => {
    expect(getOptedIn(state({ optedIn: true }))).toBe(true);
    expect(getOptedIn(state({ optedIn: false }))).toBe(false);
  });

  it('returns whether metrics onboarding has been completed', () => {
    expect(
      getCompletedMetaMetricsOnboarding(
        state({ completedMetaMetricsOnboarding: true }),
      ),
    ).toBe(true);
    expect(
      getCompletedMetaMetricsOnboarding(
        state({ completedMetaMetricsOnboarding: false }),
      ),
    ).toBe(false);
  });
});
