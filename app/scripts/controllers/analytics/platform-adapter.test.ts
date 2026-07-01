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
  ANONYMOUS_EVENT_PROPERTY,
  createPlatformAdapter,
} from './platform-adapter';

const ANALYTICS_ID = '0xabc123';

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

function buildAdapter() {
  const segment = createSegmentSpy();
  const adapter = createPlatformAdapter();
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
      const adapter = createPlatformAdapter();
      expect(adapter.skipUUIDv4Check).toBe(true);
    });
  });

  describe('track', () => {
    it('calls segment.track with the analyticsId as userId and the event name', () => {
      const { adapter, segment } = buildAdapter();
      adapter.track('Wallet Opened');
      expect(segment.track).toHaveBeenCalledWith(
        { userId: ANALYTICS_ID, event: 'Wallet Opened' },
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
          properties: { chainId: '0x1' },
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
          properties: { foo: 'bar' },
          context: { app: { name: 'MetaMask Extension', version: '1.0.0' } },
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
          properties: { foo: 'bar' },
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
          properties: {},
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
          properties: {},
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
          properties: { foo: 'bar' },
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
        { userId: 'user-1', traits: { plan: 'pro' } },
        undefined,
      );
    });

    it('omits traits when not provided', () => {
      const { adapter, segment } = buildAdapter();
      adapter.identify('user-1');
      expect(segment.identify).toHaveBeenCalledWith(
        { userId: 'user-1' },
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
          context: { app: { name: 'MetaMask Extension' } },
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
        { userId: ANALYTICS_ID, name: 'Home' },
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
          properties: { section: 'tokens' },
          context: { app: { name: 'MetaMask Extension' } },
          messageId: 'page-1',
          timestamp,
        },
        callback,
      );
    });
  });
});
