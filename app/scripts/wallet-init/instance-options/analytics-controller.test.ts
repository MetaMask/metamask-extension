import {
  AB_TEST_ANALYTICS_MAPPINGS,
  clearABTestAnalyticsMappings,
  registerABTestAnalyticsMapping,
} from '../../../../shared/lib/ab-testing/ab-test-analytics';
import { CHAIN_VALUE_ORDER_AB_KEY } from '../../../../shared/lib/ab-testing/configs/chain-value-order';
import { PERPS_TAB_BADGE_AB_KEY } from '../../../../shared/lib/ab-testing/configs/perps-tab-badge';
import { getAnalyticsControllerInitMessenger } from '../messengers/analytics-controller-messenger';
import { createMockMessenger } from '../test-utils';
import { getAnalyticsControllerInstanceOptions } from './analytics-controller';

jest.mock('../../controllers/analytics/analytics', () => ({
  configureAnalytics: jest.fn(),
  getProfileIdentityProperties: jest.fn(() => ({})),
}));

jest.mock('../../controllers/analytics/platform-adapter', () => ({
  createEnrichmentContext: jest.fn(() => ({})),
  createPlatformAdapter: jest.fn(() => ({})),
}));

jest.mock('../../lib/segment/custom-segment-tracking', () => ({
  configureOptOutSegmentEnrichment: jest.fn(),
}));

/**
 * Build analytics instance options with a real init messenger.
 *
 * @returns The options bag returned by the builder.
 */
function buildOptions() {
  const messenger = createMockMessenger();
  const initMessenger = getAnalyticsControllerInitMessenger(messenger);

  return getAnalyticsControllerInstanceOptions({
    initMessenger,
    state: {},
    platform: {} as never,
  });
}

describe('getAnalyticsControllerInstanceOptions', () => {
  // `clearABTestAnalyticsMappings` empties the module-level registry,
  // including the statically registered mappings, so restore the baseline
  // after each test to avoid leaking state into other suites.
  const baselineMappings = [...AB_TEST_ANALYTICS_MAPPINGS];

  const originalVersion = process.env.METAMASK_VERSION;
  const originalEnvironment = process.env.METAMASK_ENVIRONMENT;

  beforeEach(() => {
    process.env.METAMASK_VERSION = '1.0.0';
    process.env.METAMASK_ENVIRONMENT = 'test';
  });

  afterEach(() => {
    clearABTestAnalyticsMappings();
    for (const mapping of baselineMappings) {
      registerABTestAnalyticsMapping(mapping);
    }

    process.env.METAMASK_VERSION = originalVersion;
    process.env.METAMASK_ENVIRONMENT = originalEnvironment;
  });

  it('registers the Chain Value Order and Perps Tab Badge mappings', () => {
    buildOptions();

    expect(AB_TEST_ANALYTICS_MAPPINGS.map(({ flagKey }) => flagKey)).toEqual(
      expect.arrayContaining([
        CHAIN_VALUE_ORDER_AB_KEY,
        PERPS_TAB_BADGE_AB_KEY,
      ]),
    );
  });

  it('does not duplicate mappings when options are built twice', () => {
    buildOptions();

    const countAfterFirstBuild = AB_TEST_ANALYTICS_MAPPINGS.filter(
      ({ flagKey }) =>
        flagKey === CHAIN_VALUE_ORDER_AB_KEY ||
        flagKey === PERPS_TAB_BADGE_AB_KEY,
    ).length;

    buildOptions();

    const countAfterSecondBuild = AB_TEST_ANALYTICS_MAPPINGS.filter(
      ({ flagKey }) =>
        flagKey === CHAIN_VALUE_ORDER_AB_KEY ||
        flagKey === PERPS_TAB_BADGE_AB_KEY,
    ).length;

    expect(countAfterFirstBuild).toBe(2);
    expect(countAfterSecondBuild).toBe(2);
  });
});
