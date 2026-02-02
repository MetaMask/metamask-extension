import { FixtureBuilderV2 } from './fixture-builder-v2';
import onboardingFixtureJson from './onboarding-fixture.json';

describe('FixtureBuilderV2', () => {
  describe('fixture structure', () => {
    it('all controllers in fixture exist in onboarding fixture or allowed additions', () => {
      const fixture = new FixtureBuilderV2().build();
      const onboardingKeys = new Set(Object.keys(onboardingFixtureJson.data));

      // Controllers that are intentionally added by the default fixture
      // but not present in onboarding fixture
      const allowedAdditions = new Set(['SmartTransactionsController']);

      for (const key of Object.keys(fixture.data)) {
        const existsInOnboarding = onboardingKeys.has(key);
        const isAllowedAddition = allowedAdditions.has(key);
        expect(existsInOnboarding || isAllowedAddition).toBe(true);
      }
    });
  });
});
