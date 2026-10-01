import {
  clearABTestAnalyticsMappings,
  registerABTestAnalyticsMapping,
  AB_TEST_ANALYTICS_MAPPINGS,
} from '../../../shared/lib/ab-testing/ab-test-analytics';
import { CHAIN_VALUE_ORDER_AB_KEY } from '../../../shared/lib/ab-testing/configs/chain-value-order';
import { PERPS_TAB_BADGE_AB_KEY } from '../../../shared/lib/ab-testing/configs/perps-tab-badge';
import { getRootMessenger } from '../lib/messenger';
import { getAnalyticsControllerMessenger } from './messengers';
import { getAnalyticsControllerInitMessenger } from './messengers/analytics-controller-messenger';
import { AnalyticsControllerInit } from './analytics-controller-init';
import { buildControllerInitRequestMock } from './test/utils';

/**
 * Snapshot of the AB-test mapping registry captured when the mocked
 * controller's `init()` runs, proving registration happened before
 * initialization (and therefore before any queued events are processed).
 */
let registryAtInit: string[] | undefined;

jest.mock('@metamask/analytics-controller', () => ({
  AnalyticsController: jest.fn().mockImplementation(() => ({
    init: () => {
      const { AB_TEST_ANALYTICS_MAPPINGS: mappings } = jest.requireActual(
        '../../../shared/lib/ab-testing/ab-test-analytics',
      );
      registryAtInit = mappings.map(
        (mapping: { flagKey: string }) => mapping.flagKey,
      );
    },
  })),
}));

jest.mock('../controllers/analytics/analytics', () => ({
  configureAnalytics: jest.fn(),
  getProfileIdentityProperties: jest.fn(() => ({})),
}));

jest.mock('../controllers/analytics/platform-adapter', () => ({
  createEnrichmentContext: jest.fn(() => ({})),
  createPlatformAdapter: jest.fn(() => ({})),
}));

jest.mock('../lib/segment/custom-segment-tracking', () => ({
  configureOptOutSegmentEnrichment: jest.fn(),
}));

describe('AnalyticsControllerInit', () => {
  // `clearABTestAnalyticsMappings` empties the module-level registry,
  // including the statically registered mappings, so restore the baseline
  // after each test to avoid leaking state into other suites.
  const baselineMappings = [...AB_TEST_ANALYTICS_MAPPINGS];

  afterEach(() => {
    jest.clearAllMocks();
    clearABTestAnalyticsMappings();
    for (const mapping of baselineMappings) {
      registerABTestAnalyticsMapping(mapping);
    }
  });

  it('registers the Chain Value Order and Perps Tab Badge mappings before controller initialization', () => {
    const baseMessenger = getRootMessenger();
    const requestMock = {
      ...buildControllerInitRequestMock(),
      controllerMessenger: getAnalyticsControllerMessenger(baseMessenger),
      initMessenger: getAnalyticsControllerInitMessenger(baseMessenger),
      persistedState: {},
    };

    AnalyticsControllerInit(requestMock);

    expect(registryAtInit).toEqual(
      expect.arrayContaining([
        CHAIN_VALUE_ORDER_AB_KEY,
        PERPS_TAB_BADGE_AB_KEY,
      ]),
    );

    // Registration is idempotent; a second init must not duplicate entries.
    const countAfterFirstInit = AB_TEST_ANALYTICS_MAPPINGS.filter(
      ({ flagKey }) =>
        flagKey === CHAIN_VALUE_ORDER_AB_KEY ||
        flagKey === PERPS_TAB_BADGE_AB_KEY,
    ).length;

    AnalyticsControllerInit(requestMock);

    const countAfterSecondInit = AB_TEST_ANALYTICS_MAPPINGS.filter(
      ({ flagKey }) =>
        flagKey === CHAIN_VALUE_ORDER_AB_KEY ||
        flagKey === PERPS_TAB_BADGE_AB_KEY,
    ).length;

    expect(countAfterFirstInit).toBe(2);
    expect(countAfterSecondInit).toBe(2);
  });
});
