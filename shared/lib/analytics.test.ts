import { hasAnalyticsConsent } from './analytics';

describe('hasAnalyticsConsent', () => {
  it('returns false when consent was not decided', () => {
    expect(
      hasAnalyticsConsent({
        AnalyticsController: {
          consentDecisionMade: false,
          optedIn: true,
        },
      }),
    ).toBe(false);
  });

  it('returns false when the user opted out', () => {
    expect(
      hasAnalyticsConsent({
        AnalyticsController: {
          consentDecisionMade: true,
          optedIn: false,
        },
      }),
    ).toBe(false);
  });

  it('returns false when analytics state is missing', () => {
    expect(hasAnalyticsConsent({})).toBe(false);
  });

  it('returns true when consent was decided and the user opted in', () => {
    expect(
      hasAnalyticsConsent({
        AnalyticsController: {
          consentDecisionMade: true,
          optedIn: true,
        },
      }),
    ).toBe(true);
  });
});
