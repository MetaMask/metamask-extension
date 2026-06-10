import { getCompletedMetaMetricsOnboarding, getOptedIn } from './metametrics';
import { getAnalyticsId } from './selectors';

describe('MetaMetrics selectors', () => {
  const state = (metamask: Record<string, unknown>) => ({ metamask });

  it('returns whether the user has opted in to analytics', () => {
    expect(getOptedIn(state({ optedIn: true }))).toBe(true);
    expect(getOptedIn(state({ optedIn: false }))).toBe(false);
  });

  it('derives whether metrics participation has been set from onboarding completion', () => {
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

  it('returns the AnalyticsController analytics ID', () => {
    expect(getAnalyticsId(state({ analyticsId: 'analytics-id' }))).toBe(
      'analytics-id',
    );
  });
});
