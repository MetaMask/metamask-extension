import { MetaMetricsEventName } from '../../../constants/metametrics';
import type { AnalyticsEvent } from '../../analytics/create-event-builder';
import {
  AB_TEST_ANALYTICS_MAPPINGS,
  clearABTestAnalyticsMappings,
  enrichWithABTests,
  hasABTestAnalyticsMappingForEvent,
  registerABTestAnalyticsMapping,
} from '../ab-test-analytics';
import { createActiveABTestAssignment } from '../active-ab-test-assignment';
import { ABTestVariant } from '../variants';
import {
  PERPS_TAB_BADGE_AB_KEY,
  PERPS_TAB_BADGE_AB_TEST_ANALYTICS_MAPPING,
  PERPS_TAB_BADGE_AB_TEST_EXPOSURE_METADATA,
  PERPS_TAB_BADGE_VARIANTS,
} from './perps-tab-badge';

describe('perps-tab-badge config', () => {
  it('uses a compliant remote feature flag key', () => {
    expect(PERPS_TAB_BADGE_AB_KEY).toBe('perpsTAT3382AbtestTabBadge');
  });

  it('defines a control variant that hides the badge', () => {
    expect(PERPS_TAB_BADGE_VARIANTS.control).toStrictEqual({
      showBadge: false,
    });
  });

  it('defines a treatment variant that shows the badge', () => {
    expect(PERPS_TAB_BADGE_VARIANTS.treatment).toStrictEqual({
      showBadge: true,
    });
  });

  it('maps analytics enrichment to the existing Perp Screen Viewed event', () => {
    expect(PERPS_TAB_BADGE_AB_TEST_ANALYTICS_MAPPING).toStrictEqual({
      flagKey: PERPS_TAB_BADGE_AB_KEY,
      validVariants: [ABTestVariant.Control, ABTestVariant.Treatment],
      eventNames: [MetaMetricsEventName.PerpsScreenViewed],
    });
  });

  it('exposes exposure metadata for both variants', () => {
    expect(
      PERPS_TAB_BADGE_AB_TEST_EXPOSURE_METADATA.variationNames,
    ).toHaveProperty('control');
    expect(
      PERPS_TAB_BADGE_AB_TEST_EXPOSURE_METADATA.variationNames,
    ).toHaveProperty('treatment');
  });
});

describe('perps-tab-badge analytics enrichment', () => {
  const createEvent = (name: string): AnalyticsEvent => ({
    name,
    properties: {},
    sensitiveProperties: {},
  });

  beforeEach(() => clearABTestAnalyticsMappings());
  afterEach(() => clearABTestAnalyticsMappings());

  it('registers the mapping into the default analytics mappings', () => {
    registerABTestAnalyticsMapping(PERPS_TAB_BADGE_AB_TEST_ANALYTICS_MAPPING);

    expect(AB_TEST_ANALYTICS_MAPPINGS).toContain(
      PERPS_TAB_BADGE_AB_TEST_ANALYTICS_MAPPING,
    );
    expect(
      hasABTestAnalyticsMappingForEvent(MetaMetricsEventName.PerpsScreenViewed),
    ).toBe(true);
  });

  it('does not register the same mapping twice', () => {
    registerABTestAnalyticsMapping(PERPS_TAB_BADGE_AB_TEST_ANALYTICS_MAPPING);
    registerABTestAnalyticsMapping(PERPS_TAB_BADGE_AB_TEST_ANALYTICS_MAPPING);

    expect(
      AB_TEST_ANALYTICS_MAPPINGS.filter(
        ({ flagKey }) => flagKey === PERPS_TAB_BADGE_AB_KEY,
      ),
    ).toHaveLength(1);
  });

  it('enriches the Perp Screen Viewed event with the active treatment assignment', () => {
    registerABTestAnalyticsMapping(PERPS_TAB_BADGE_AB_TEST_ANALYTICS_MAPPING);

    const result = enrichWithABTests(
      createEvent(MetaMetricsEventName.PerpsScreenViewed),
      { [PERPS_TAB_BADGE_AB_KEY]: { name: 'treatment' } },
    );

    expect(result.properties?.active_ab_tests).toStrictEqual([
      createActiveABTestAssignment(PERPS_TAB_BADGE_AB_KEY, 'treatment'),
    ]);
  });

  it('does not enrich unrelated events', () => {
    registerABTestAnalyticsMapping(PERPS_TAB_BADGE_AB_TEST_ANALYTICS_MAPPING);

    const result = enrichWithABTests(createEvent('Some Other Event'), {
      [PERPS_TAB_BADGE_AB_KEY]: { name: 'treatment' },
    });

    expect(result.properties?.active_ab_tests).toBeUndefined();
  });
});
