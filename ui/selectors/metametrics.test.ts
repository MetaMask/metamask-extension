import {
  getConsentDecisionMade,
  getDataCollectionForMarketing,
  getOptedIn,
} from './metametrics';

describe('MetaMetrics selectors', () => {
  const state = (metamask: Record<string, unknown>) => ({ metamask });

  it('returns whether the user has opted in to analytics', () => {
    expect(getOptedIn(state({ optedIn: true }))).toBe(true);
    expect(getOptedIn(state({ optedIn: false }))).toBe(false);
  });

  it('returns whether metrics onboarding has been completed', () => {
    expect(getConsentDecisionMade(state({ consentDecisionMade: true }))).toBe(
      true,
    );
    expect(getConsentDecisionMade(state({ consentDecisionMade: false }))).toBe(
      false,
    );
  });

  it('returns the user\'s marketing consent preference based on their decision state', () => {
    // Returns null when the user has not made a decision
    expect(
      getDataCollectionForMarketing(
        state({
          marketingConsentDecisionMade: false,
          optedInToMarketing: false,
        }),
      ),
    ).toBeNull();

    // Returns true when the user has made a decision and opted in
    expect(
      getDataCollectionForMarketing(
        state({
          marketingConsentDecisionMade: true,
          optedInToMarketing: true,
        }),
      ),
    ).toBe(true);

    // Returns false when the user has made a decision and opted out
    expect(
      getDataCollectionForMarketing(
        state({
          marketingConsentDecisionMade: true,
          optedInToMarketing: false,
        }),
      ),
    ).toBe(false);
  });
});
