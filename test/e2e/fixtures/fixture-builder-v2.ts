import defaultFixtureJson from './default-fixture.json';
import onboardingFixtureJson from './onboarding-fixture.json';

function defaultFixture() {
  return defaultFixtureJson;
}

function onboardingFixture() {
  return onboardingFixtureJson;
}

type FixtureType = typeof defaultFixtureJson | typeof onboardingFixtureJson;

class FixtureBuilderV2 {
  fixture: FixtureType;

  /**
   * Constructs a new instance of the FixtureBuilder class.
   *
   * @param {object} [options] - The options for the constructor.
   * @param {boolean} [options.onboarding] - Indicates if onboarding is enabled.
   */
  constructor({ onboarding = false }: { onboarding?: boolean; } = {}) {
    this.fixture =
      onboarding === true ? onboardingFixture() : defaultFixture();
  }

  build() {
    return this.fixture;
  }
}

export default FixtureBuilderV2;
