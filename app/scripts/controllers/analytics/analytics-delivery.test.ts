import {
  ActionConstraint,
  Messenger,
  MOCK_ANY_NAMESPACE,
  MockAnyNamespace,
} from '@metamask/messenger';
import type {
  AnalyticsControllerGetStateAction,
  AnalyticsControllerIdentifyAction,
  AnalyticsControllerTrackEventAction,
  AnalyticsControllerTrackViewAction,
  AnalyticsTrackingEvent,
} from '@metamask/analytics-controller';
import type {
  NetworkControllerGetNetworkClientByIdAction,
  NetworkControllerGetStateAction,
} from '@metamask/network-controller';
import type { RemoteFeatureFlagControllerGetStateAction } from '@metamask/remote-feature-flag-controller';
import type { PreferencesControllerGetStateAction } from '../preferences-controller';
import type { MetaMetricsControllerGetStateAction } from '../metametrics-controller';
import { MetaMetricsEventName } from '../../../../shared/constants/metametrics';
import { segment } from '../../lib/segment';
import { getAnalyticsEventBuilderMessenger } from './analytics-event-builder-messenger';
import {
  configureAnalyticsDelivery,
  canSubmitAnalytics,
  identify,
  trackEvent,
  trackView,
} from './analytics-delivery';
import type { BuiltAnalyticsEvent } from './analytics-event-builder';

jest.mock('../../lib/segment', () => ({
  segment: {
    track: jest.fn(),
    flush: jest.fn(),
  },
}));

const mockSegment = segment as jest.Mocked<typeof segment>;

function createMockAnalyticsTrackingEvent(
  partial: Pick<AnalyticsTrackingEvent, 'name'> &
    Partial<Omit<AnalyticsTrackingEvent, 'name'>>,
): AnalyticsTrackingEvent {
  return {
    properties: {},
    sensitiveProperties: {},
    saveDataRecording: false,
    hasProperties: true,
    ...partial,
  };
}

const builtEvent: BuiltAnalyticsEvent = {
  event: createMockAnalyticsTrackingEvent({
    name: 'Test Event',
    properties: { foo: 'bar' },
  }),
  context: {
    app: { name: 'MetaMask Extension', version: '1.0.0' },
  },
};

function createConfiguredMessenger({
  useExternalServices = true,
  optedIn = true,
  analyticsId = 'analytics-id',
}: {
  useExternalServices?: boolean;
  optedIn?: boolean;
  analyticsId?: string;
} = {}) {
  const rootMessenger = new Messenger<
    MockAnyNamespace,
    | PreferencesControllerGetStateAction
    | NetworkControllerGetStateAction
    | NetworkControllerGetNetworkClientByIdAction
    | RemoteFeatureFlagControllerGetStateAction
    | MetaMetricsControllerGetStateAction
    | AnalyticsControllerGetStateAction
    | AnalyticsControllerTrackEventAction
    | AnalyticsControllerIdentifyAction
    | AnalyticsControllerTrackViewAction
    | ActionConstraint,
    never
  >({
    namespace: MOCK_ANY_NAMESPACE,
  });

  rootMessenger.registerActionHandler(
    'PreferencesController:getState',
    () =>
      ({
        useExternalServices,
      }) as never,
  );

  rootMessenger.registerActionHandler(
    'AnalyticsController:getState',
    () =>
      ({
        analyticsId,
        optedIn,
      }) as never,
  );

  configureAnalyticsDelivery({
    messenger: getAnalyticsEventBuilderMessenger(rootMessenger),
  });

  return rootMessenger;
}

describe('analytics delivery', () => {
  describe('canSubmitAnalytics', () => {
    it('throws when analytics delivery is not configured', () => {
      expect(() => canSubmitAnalytics()).toThrow(
        'Analytics delivery has not been configured',
      );
    });

    it('returns false when the user has not opted in', () => {
      createConfiguredMessenger({ optedIn: false });

      expect(canSubmitAnalytics()).toBe(false);
    });

    it('returns true for Metrics Opt Out when the user has not opted in', () => {
      createConfiguredMessenger({ optedIn: false });

      expect(canSubmitAnalytics(MetaMetricsEventName.MetricsOptOut)).toBe(true);
    });
  });

  describe('trackEvent', () => {
    let trackEventHandler: jest.Mock;

    beforeEach(() => {
      trackEventHandler = jest.fn();
      const rootMessenger = createConfiguredMessenger();
      rootMessenger.registerActionHandler(
        'AnalyticsController:trackEvent',
        trackEventHandler as never,
      );
    });

    it('delivers a built event to AnalyticsController', () => {
      trackEvent(builtEvent);

      expect(trackEventHandler).toHaveBeenCalledWith(
        builtEvent.event,
        builtEvent.context,
      );
    });

    it('does not deliver the event when basic functionality is disabled', () => {
      const rootMessenger = createConfiguredMessenger({
        useExternalServices: false,
      });
      rootMessenger.registerActionHandler(
        'AnalyticsController:trackEvent',
        trackEventHandler as never,
      );

      trackEvent(builtEvent);

      expect(trackEventHandler).not.toHaveBeenCalled();
    });

    it('does not deliver the event when the user has not opted in', () => {
      const rootMessenger = createConfiguredMessenger({ optedIn: false });
      rootMessenger.registerActionHandler(
        'AnalyticsController:trackEvent',
        trackEventHandler as never,
      );

      trackEvent(builtEvent);

      expect(trackEventHandler).not.toHaveBeenCalled();
    });

    it('tracks Metrics Opt Out through Segment when the user is opted out', () => {
      jest.clearAllMocks();
      createConfiguredMessenger({
        optedIn: false,
        analyticsId: 'metrics-opt-out-id',
      });

      const metricsOptOutEvent: BuiltAnalyticsEvent = {
        event: createMockAnalyticsTrackingEvent({
          name: MetaMetricsEventName.MetricsOptOut,
          properties: { category: 'Settings' },
        }),
        context: {
          app: { name: 'MetaMask Extension', version: '1.0.0' },
        },
      };

      trackEvent(metricsOptOutEvent);

      expect(trackEventHandler).not.toHaveBeenCalled();
      expect(mockSegment.track).toHaveBeenCalledWith({
        userId: 'metrics-opt-out-id',
        event: MetaMetricsEventName.MetricsOptOut,
        properties: { category: 'Settings' },
        context: metricsOptOutEvent.context,
      });
      expect(mockSegment.flush).toHaveBeenCalled();
    });

    it('does not track Metrics Opt Out on Firefox', () => {
      jest.clearAllMocks();
      jest
        .spyOn(window.navigator, 'userAgent', 'get')
        .mockReturnValue('Mozilla/5.0 Firefox/126.0');
      createConfiguredMessenger({
        optedIn: false,
        analyticsId: 'metrics-opt-out-id',
      });

      trackEvent({
        event: createMockAnalyticsTrackingEvent({
          name: MetaMetricsEventName.MetricsOptOut,
        }),
        context: {
          app: { name: 'MetaMask Extension', version: '1.0.0' },
        },
      });

      expect(mockSegment.track).not.toHaveBeenCalled();
    });
  });

  describe('identify', () => {
    let identifyHandler: jest.Mock;
    let warnSpy: jest.SpyInstance;

    beforeEach(() => {
      warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
      identifyHandler = jest.fn();
      const rootMessenger = createConfiguredMessenger();
      rootMessenger.registerActionHandler(
        'AnalyticsController:identify',
        identifyHandler as never,
      );
    });

    afterEach(() => {
      warnSpy.mockRestore();
    });

    it('delivers user traits to AnalyticsController', () => {
      const userTraits = {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        install_date_ext: '2024-01-01',
      };

      identify(userTraits);

      expect(identifyHandler).toHaveBeenCalledWith(userTraits, undefined);
    });

    it('filters invalid traits before delivery', () => {
      identify({
        // eslint-disable-next-line @typescript-eslint/naming-convention
        install_date_ext: '2024-01-01',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        test_null: null,
      } as never);

      expect(identifyHandler).toHaveBeenCalledWith(
        {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          install_date_ext: '2024-01-01',
        },
        undefined,
      );
      expect(warnSpy).toHaveBeenCalledWith(
        'analytics delivery identify: "test_null" value is not a valid trait type',
      );
    });

    it('does not deliver when no valid traits remain', () => {
      identify({
        // eslint-disable-next-line @typescript-eslint/naming-convention
        test_null: null,
      } as never);

      expect(identifyHandler).not.toHaveBeenCalled();
    });

    it('does not deliver when the user has not opted in', () => {
      const rootMessenger = createConfiguredMessenger({ optedIn: false });
      rootMessenger.registerActionHandler(
        'AnalyticsController:identify',
        identifyHandler as never,
      );

      identify({
        // eslint-disable-next-line @typescript-eslint/naming-convention
        install_date_ext: '2024-01-01',
      });

      expect(identifyHandler).not.toHaveBeenCalled();
    });
  });

  describe('trackView', () => {
    let trackViewHandler: jest.Mock;

    beforeEach(() => {
      trackViewHandler = jest.fn();
      const rootMessenger = createConfiguredMessenger();
      rootMessenger.registerActionHandler(
        'AnalyticsController:trackView',
        trackViewHandler as never,
      );
    });

    it('delivers a page view to AnalyticsController', () => {
      const built = {
        name: 'Home',
        properties: { locale: 'en-US' },
        context: {
          app: { name: 'MetaMask Extension', version: '1.0.0' },
        },
      };

      trackView(built);

      expect(trackViewHandler).toHaveBeenCalledWith(
        built.name,
        built.properties,
        built.context,
      );
    });

    it('does not deliver when basic functionality is disabled', () => {
      const rootMessenger = createConfiguredMessenger({
        useExternalServices: false,
      });
      rootMessenger.registerActionHandler(
        'AnalyticsController:trackView',
        trackViewHandler as never,
      );

      trackView({
        name: 'Home',
        properties: {},
        context: { app: { name: 'MetaMask Extension', version: '1.0.0' } },
      });

      expect(trackViewHandler).not.toHaveBeenCalled();
    });
  });
});
