import {
  getCompletedMetaMetricsOnboarding,
  getIsParticipateInMetaMetricsSet,
  getOptedIn,
  getParticipateInMetaMetrics,
} from './metametrics';
import { getMetaMetricsId } from './selectors';

describe('MetaMetrics selectors', () => {
  const state = (metamask: Record<string, unknown>) => ({ metamask });

  it('derives metrics participation from onboarding completion and AnalyticsController opt-in state', () => {
    expect(
      getParticipateInMetaMetrics(
        state({ completedMetaMetricsOnboarding: true, optedIn: true }),
      ),
    ).toBe(true);
    expect(
      getParticipateInMetaMetrics(
        state({ completedMetaMetricsOnboarding: true, optedIn: false }),
      ),
    ).toBe(false);
    expect(
      getParticipateInMetaMetrics(
        state({ completedMetaMetricsOnboarding: false, optedIn: true }),
      ),
    ).toBeNull();
  });

  it('derives whether metrics participation has been set from onboarding completion', () => {
    expect(
      getIsParticipateInMetaMetricsSet(
        state({ completedMetaMetricsOnboarding: true }),
      ),
    ).toBe(true);
    expect(
      getIsParticipateInMetaMetricsSet(
        state({ completedMetaMetricsOnboarding: false }),
      ),
    ).toBe(false);
  });

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

  it('returns the AnalyticsController analytics ID', () => {
    expect(
      getMetaMetricsId(
        state({ analyticsId: 'analytics-id', metaMetricsId: 'legacy-id' }),
      ),
    ).toBe('analytics-id');
  });
});
