import type { Hex } from '@metamask/utils';
import { segment as sharedExtensionSegment } from '../../lib/segment';
import {
  METAMETRICS_ANONYMOUS_ID,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import {
  AnonymousTransactionMetaMetricsEvent,
  TransactionMetaMetricsEvent,
} from '../../../../shared/constants/transaction';
import {
  AB_TEST_ANALYTICS_MAPPINGS,
  clearABTestAnalyticsMappings,
} from '../../../../shared/lib/ab-testing/ab-test-analytics';
import { createActiveABTestAssignment } from '../../../../shared/lib/ab-testing/active-ab-test-assignment';
import {
  ANONYMOUS_EVENT_PROPERTY,
  createPlatformAdapter,
  type PlatformAdapterEnrichmentContext,
} from './platform-adapter';

const ANALYTICS_ID = '0xabc123';

const DEFAULT_ENRICHMENT_CONTEXT: PlatformAdapterEnrichmentContext = {
  getLocale: () => 'en-US',
  getDefaultChainId: () => '0x1' as Hex,
  getPageChainProperties: () => ({
    // eslint-disable-next-line @typescript-eslint/naming-convention
    chain_id: '0x1',
  }),
  getProfileIdentityProperties: () => ({}),
  getMarketingCampaignCookieId: () => null,
  hasMarketingConsent: () => false,
  hasBasicFunctionalityEnabled: () => true,
  getRemoteFeatureFlags: () => ({}),
  appVersion: '1.0.0',
  userAgent: '',
};

const DEFAULT_APP_CONTEXT = {
  app: { name: 'MetaMask Extension', version: '1.0.0' },
  userAgent: '',
  marketingCampaignCookieId: null,
};

function createMockEnrichmentContext(
  overrides: Partial<PlatformAdapterEnrichmentContext> = {},
): PlatformAdapterEnrichmentContext {
  return { ...DEFAULT_ENRICHMENT_CONTEXT, ...overrides };
}

type SegmentSpy = {
  track: jest.SpiedFunction<typeof sharedExtensionSegment.track>;
  identify: jest.SpiedFunction<typeof sharedExtensionSegment.identify>;
  page: jest.SpiedFunction<typeof sharedExtensionSegment.page>;
};

function createSegmentSpy(): SegmentSpy {
  return {
    track: jest.spyOn(sharedExtensionSegment, 'track').mockImplementation(),
    identify: jest
      .spyOn(sharedExtensionSegment, 'identify')
      .mockImplementation(),
    page: jest.spyOn(sharedExtensionSegment, 'page').mockImplementation(),
  };
}

function buildAdapter(
  enrichmentContext: PlatformAdapterEnrichmentContext = DEFAULT_ENRICHMENT_CONTEXT,
) {
  const segment = createSegmentSpy();
  const adapter = createPlatformAdapter(enrichmentContext);
  // After PR MetaMask/core#8543 lands, AnalyticsController guarantees
  // onSetupCompleted runs before track/identify/view; replicate that here.
  adapter.onSetupCompleted(ANALYTICS_ID);
  return { adapter, segment };
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('createPlatformAdapter', () => {
  describe('skipUUIDv4Check', () => {
    it('is set to true so non-UUIDv4 extension analyticsIds are accepted', () => {
      const adapter = createPlatformAdapter(DEFAULT_ENRICHMENT_CONTEXT);
      expect(adapter.skipUUIDv4Check).toBe(true);
    });
  });

  describe('track', () => {
    it('calls segment.track with the analyticsId as userId and the event name', () => {
      const { adapter, segment } = buildAdapter();
      adapter.track('Wallet Opened');
      expect(segment.track).toHaveBeenCalledWith(
        {
          userId: ANALYTICS_ID,
          event: 'Wallet Opened',
          properties: {
            locale: 'en-US',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            chain_id: '0x1',
          },
          context: DEFAULT_APP_CONTEXT,
        },
        undefined,
      );
    });

    it('always includes marketingCampaignCookieId in context, including when null', () => {
      const { adapter, segment } = buildAdapter();
      adapter.track('Wallet Opened');
      expect(segment.track).toHaveBeenCalledWith(
        expect.objectContaining({
          context: expect.objectContaining({
            marketingCampaignCookieId: null,
          }),
        }),
        undefined,
      );
    });

    it('forwards marketingCampaignCookieId when present', () => {
      const { adapter, segment } = buildAdapter(
        createMockEnrichmentContext({
          getMarketingCampaignCookieId: () => 'campaign-cookie-id',
        }),
      );
      adapter.track('Wallet Opened');
      expect(segment.track).toHaveBeenCalledWith(
        expect.objectContaining({
          context: expect.objectContaining({
            marketingCampaignCookieId: 'campaign-cookie-id',
          }),
        }),
        undefined,
      );
    });

    it('forwards properties when provided', () => {
      const { adapter, segment } = buildAdapter();
      adapter.track('Wallet Opened', { chainId: '0x1' });
      expect(segment.track).toHaveBeenCalledWith(
        {
          userId: ANALYTICS_ID,
          event: 'Wallet Opened',
          properties: {
            chainId: '0x1',
            locale: 'en-US',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            chain_id: '0x1',
          },
          context: DEFAULT_APP_CONTEXT,
        },
        undefined,
      );
    });

    it('forwards context and delivery options', () => {
      const { adapter, segment } = buildAdapter();
      const callback = jest.fn();
      const timestamp = new Date('2026-01-01T00:00:00Z');
      adapter.track(
        'Wallet Opened',
        { foo: 'bar' },
        { app: { name: 'MetaMask Extension', version: '1.0.0' } },
        {
          messageId: 'msg-1',
          timestamp,
          callback,
        },
      );
      expect(segment.track).toHaveBeenCalledWith(
        {
          userId: ANALYTICS_ID,
          event: 'Wallet Opened',
          properties: {
            foo: 'bar',
            locale: 'en-US',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            chain_id: '0x1',
          },
          context: {
            app: { name: 'MetaMask Extension', version: '1.0.0' },
            userAgent: '',
            marketingCampaignCookieId: null,
          },
          messageId: 'msg-1',
          timestamp,
        },
        callback,
      );
    });

    it('downgrades anonymous-marked track payloads to the shared anonymous ID', () => {
      const { adapter, segment } = buildAdapter();
      const properties = {
        foo: 'bar',
        [ANONYMOUS_EVENT_PROPERTY]: true,
      };

      adapter.track('Wallet Opened', properties);

      expect(segment.track).toHaveBeenCalledWith(
        {
          anonymousId: METAMETRICS_ANONYMOUS_ID,
          event: 'Wallet Opened',
          properties: {
            foo: 'bar',
            locale: 'en-US',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            chain_id: '0x1',
          },
          context: DEFAULT_APP_CONTEXT,
        },
        undefined,
      );
      expect(properties).toStrictEqual({
        foo: 'bar',
        [ANONYMOUS_EVENT_PROPERTY]: true,
      });
    });

    it('overrides anonymous signature event names', () => {
      const { adapter, segment } = buildAdapter();

      adapter.track(MetaMetricsEventName.SignatureRequested, {
        [ANONYMOUS_EVENT_PROPERTY]: true,
      });

      expect(segment.track).toHaveBeenCalledWith(
        {
          anonymousId: METAMETRICS_ANONYMOUS_ID,
          event: MetaMetricsEventName.SignatureRequestedAnon,
          properties: {
            locale: 'en-US',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            chain_id: '0x1',
          },
          context: DEFAULT_APP_CONTEXT,
        },
        undefined,
      );
    });

    it('overrides anonymous transaction event names', () => {
      const { adapter, segment } = buildAdapter();

      adapter.track(TransactionMetaMetricsEvent.submitted, {
        [ANONYMOUS_EVENT_PROPERTY]: true,
      });

      expect(segment.track).toHaveBeenCalledWith(
        {
          anonymousId: METAMETRICS_ANONYMOUS_ID,
          event: AnonymousTransactionMetaMetricsEvent.submitted,
          properties: {
            locale: 'en-US',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            chain_id: '0x1',
          },
          context: DEFAULT_APP_CONTEXT,
        },
        undefined,
      );
    });

    it('strips profile identity properties from anonymous track payloads', () => {
      const { adapter, segment } = buildAdapter();

      adapter.track('Signature Requested', {
        foo: 'bar',
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        profile_id: 'profileId',
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        canonical_profile_id: 'canonicalProfileId',
        [ANONYMOUS_EVENT_PROPERTY]: true,
      });

      expect(segment.track).toHaveBeenCalledWith(
        {
          anonymousId: METAMETRICS_ANONYMOUS_ID,
          event: MetaMetricsEventName.SignatureRequestedAnon,
          properties: {
            foo: 'bar',
            locale: 'en-US',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            chain_id: '0x1',
          },
          context: DEFAULT_APP_CONTEXT,
        },
        undefined,
      );
    });
  });

  describe('identify', () => {
    it('forwards the userId argument from AnalyticsController and traits', () => {
      const { adapter, segment } = buildAdapter();
      adapter.identify('user-1', { plan: 'pro' });
      expect(segment.identify).toHaveBeenCalledWith(
        {
          userId: 'user-1',
          traits: { plan: 'pro' },
          context: DEFAULT_APP_CONTEXT,
        },
        undefined,
      );
    });

    it('omits traits when not provided', () => {
      const { adapter, segment } = buildAdapter();
      adapter.identify('user-1');
      expect(segment.identify).toHaveBeenCalledWith(
        { userId: 'user-1', context: DEFAULT_APP_CONTEXT },
        undefined,
      );
    });

    it('forwards context and delivery options', () => {
      const { adapter, segment } = buildAdapter();
      const callback = jest.fn();
      const timestamp = new Date('2026-01-01T00:00:00Z');
      adapter.identify(
        'user-1',
        { plan: 'pro' },
        { app: { name: 'MetaMask Extension' } },
        {
          messageId: 'id-1',
          timestamp,
          callback,
        },
      );
      expect(segment.identify).toHaveBeenCalledWith(
        {
          userId: 'user-1',
          traits: { plan: 'pro' },
          context: {
            app: { name: 'MetaMask Extension', version: '1.0.0' },
            userAgent: '',
            marketingCampaignCookieId: null,
          },
          messageId: 'id-1',
          timestamp,
        },
        callback,
      );
    });
  });

  describe('view', () => {
    it('forwards as a Segment page() call with the analyticsId', () => {
      const { adapter, segment } = buildAdapter();
      adapter.view('Home');
      expect(segment.page).toHaveBeenCalledWith(
        {
          userId: ANALYTICS_ID,
          name: 'Home',
          properties: {
            locale: 'en-US',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            chain_id: '0x1',
          },
          context: DEFAULT_APP_CONTEXT,
        },
        undefined,
      );
    });

    it('forwards properties, context, and delivery options', () => {
      const { adapter, segment } = buildAdapter();
      const callback = jest.fn();
      const timestamp = new Date('2026-01-01T00:00:00Z');
      adapter.view(
        'Home',
        { section: 'tokens' },
        { app: { name: 'MetaMask Extension' } },
        {
          messageId: 'page-1',
          timestamp,
          callback,
        },
      );
      expect(segment.page).toHaveBeenCalledWith(
        {
          userId: ANALYTICS_ID,
          name: 'Home',
          properties: {
            section: 'tokens',
            locale: 'en-US',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            chain_id: '0x1',
          },
          context: {
            app: { name: 'MetaMask Extension', version: '1.0.0' },
            userAgent: '',
            marketingCampaignCookieId: null,
          },
          messageId: 'page-1',
          timestamp,
        },
        callback,
      );
    });

    it('applies non-EVM page chain properties from enrichment context', () => {
      const { adapter, segment } = buildAdapter(
        createMockEnrichmentContext({
          getPageChainProperties: () => ({
            // eslint-disable-next-line @typescript-eslint/naming-convention
            chain_id: null,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            chain_id_caip: 'bip122:000000000019d6689c085ae165831e93',
          }),
        }),
      );

      adapter.view('New Confirmation Page');

      expect(segment.page).toHaveBeenCalledWith(
        expect.objectContaining({
          properties: {
            locale: 'en-US',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            chain_id: null,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            chain_id_caip: 'bip122:000000000019d6689c085ae165831e93',
          },
        }),
        undefined,
      );
    });

    it('omits chain_id_caip for EVM page views', () => {
      const { adapter, segment } = buildAdapter(
        createMockEnrichmentContext({
          getPageChainProperties: () => ({
            // eslint-disable-next-line @typescript-eslint/naming-convention
            chain_id: '0x1',
          }),
        }),
      );

      adapter.view('Home', {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        chain_id_caip: 'eip155:1',
      });

      expect(segment.page).toHaveBeenCalledWith(
        expect.objectContaining({
          properties: expect.objectContaining({
            locale: 'en-US',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            chain_id: '0x1',
          }),
        }),
        undefined,
      );
      expect(segment.page.mock.calls[0][0].properties).not.toHaveProperty(
        'chain_id_caip',
      );
    });
  });

  describe('basic functionality gating', () => {
    const disabledContext = createMockEnrichmentContext({
      hasBasicFunctionalityEnabled: () => false,
    });

    it('does not send track events when basic functionality is disabled', () => {
      const { adapter, segment } = buildAdapter(disabledContext);
      adapter.track('Wallet Opened', { foo: 'bar' });
      expect(segment.track).not.toHaveBeenCalled();
    });

    it('does not send identify events when basic functionality is disabled', () => {
      const { adapter, segment } = buildAdapter(disabledContext);
      adapter.identify(ANALYTICS_ID, { plan: 'pro' });
      expect(segment.identify).not.toHaveBeenCalled();
    });

    it('does not send view events when basic functionality is disabled', () => {
      const { adapter, segment } = buildAdapter(disabledContext);
      adapter.view('Home', { section: 'tokens' });
      expect(segment.page).not.toHaveBeenCalled();
    });
  });

  describe('downstream enrichment', () => {
    afterEach(() => {
      clearABTestAnalyticsMappings();
    });

    it('injects active_ab_tests for mapped track events', () => {
      const flagKey = 'testTEST9999AbtestAdapter';
      AB_TEST_ANALYTICS_MAPPINGS.push({
        flagKey,
        validVariants: ['control', 'treatment'],
        eventNames: ['Mapped Event'],
      });

      const { adapter, segment } = buildAdapter(
        createMockEnrichmentContext({
          getRemoteFeatureFlags: () => ({
            [flagKey]: 'treatment',
          }),
        }),
      );

      adapter.track('Mapped Event', { foo: 'bar' });

      expect(segment.track).toHaveBeenCalledWith(
        expect.objectContaining({
          properties: expect.objectContaining({
            foo: 'bar',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            active_ab_tests: [
              createActiveABTestAssignment(flagKey, 'treatment'),
            ],
          }),
        }),
        undefined,
      );
    });

    it('overwrites caller-provided universal properties (locale, chain_id, profile_id, canonical_profile_id)', () => {
      const { adapter, segment } = buildAdapter(
        createMockEnrichmentContext({
          getLocale: () => 'fr-FR',
          getDefaultChainId: () => '0x89' as Hex,
          getProfileIdentityProperties: () => ({
            // eslint-disable-next-line @typescript-eslint/naming-convention
            profile_id: 'profileId',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            canonical_profile_id: 'canonicalProfileId',
          }),
        }),
      );

      adapter.track('Test Event', {
        locale: 'en-US',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        chain_id: 1,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        profile_id: 'callerProfileId',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        canonical_profile_id: 'callerCanonicalProfileId',
      });

      expect(segment.track).toHaveBeenCalledWith(
        expect.objectContaining({
          properties: {
            locale: 'fr-FR',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            chain_id: '0x89',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            profile_id: 'profileId',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            canonical_profile_id: 'canonicalProfileId',
          },
        }),
        undefined,
      );
    });

    it('includes profile identity from enrichment context', () => {
      const { adapter, segment } = buildAdapter(
        createMockEnrichmentContext({
          getProfileIdentityProperties: () => ({
            // eslint-disable-next-line @typescript-eslint/naming-convention
            profile_id: 'profileId',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            canonical_profile_id: 'canonicalProfileId',
          }),
        }),
      );

      adapter.track('Test Event', { foo: 'bar' });

      expect(segment.track).toHaveBeenCalledWith(
        expect.objectContaining({
          properties: expect.objectContaining({
            foo: 'bar',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            profile_id: 'profileId',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            canonical_profile_id: 'canonicalProfileId',
          }),
        }),
        undefined,
      );
    });

    it('removes UTM parameters when marketing consent is absent', () => {
      const { adapter, segment } = buildAdapter();

      adapter.track('Campaign Event', {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        utm_source: 'newsletter',
        foo: 'bar',
      });

      expect(segment.track).toHaveBeenCalledWith(
        expect.objectContaining({
          properties: expect.not.objectContaining({
            // eslint-disable-next-line @typescript-eslint/naming-convention
            utm_source: 'newsletter',
          }),
        }),
        undefined,
      );
    });
  });
});
