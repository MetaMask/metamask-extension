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
} from '@metamask/analytics-controller';
import type { MultichainNetworkControllerGetStateAction } from '@metamask/multichain-network-controller';
import type {
  NetworkControllerGetNetworkClientByIdAction,
  NetworkControllerGetStateAction,
} from '@metamask/network-controller';
import type { RemoteFeatureFlagControllerGetStateAction } from '@metamask/remote-feature-flag-controller';
import { createEventBuilder } from '../../../../shared/lib/analytics/create-event-builder';
import type { PreferencesControllerGetStateAction } from '../preferences-controller';
import type { MetaMetricsControllerGetStateAction } from '../metametrics-controller';
import { getAnalyticsMessenger } from './analytics-messenger';
import { configureAnalytics, identify, trackEvent } from './analytics';

function createConfiguredMessenger() {
  const trackEventHandler = jest.fn();
  const identifyHandler = jest.fn();
  const rootMessenger = new Messenger<
    MockAnyNamespace,
    | PreferencesControllerGetStateAction
    | MultichainNetworkControllerGetStateAction
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
        currentLocale: 'en_US',
        useExternalServices: true,
      }) as never,
  );
  rootMessenger.registerActionHandler(
    'NetworkController:getState',
    () =>
      ({
        selectedNetworkClientId: 'mainnet',
      }) as never,
  );
  rootMessenger.registerActionHandler(
    'NetworkController:getNetworkClientById',
    () =>
      ({
        configuration: {
          chainId: '0x1',
        },
      }) as never,
  );
  rootMessenger.registerActionHandler(
    'RemoteFeatureFlagController:getState',
    () =>
      ({
        remoteFeatureFlags: {},
      }) as never,
  );
  rootMessenger.registerActionHandler(
    'MultichainNetworkController:getState',
    () =>
      ({
        isEvmSelected: true,
        selectedMultichainNetworkChainId: 'eip155:1',
      }) as never,
  );
  rootMessenger.registerActionHandler(
    'MetaMetricsController:getState',
    () =>
      ({
        dataCollectionForMarketing: false,
        marketingCampaignCookieId: 'campaign-id',
      }) as never,
  );
  rootMessenger.registerActionHandler(
    'AnalyticsController:getState',
    () =>
      ({
        analyticsId: 'analytics-id',
        optedIn: true,
      }) as never,
  );
  rootMessenger.registerActionHandler(
    'AnalyticsController:trackEvent',
    trackEventHandler as never,
  );
  rootMessenger.registerActionHandler(
    'AnalyticsController:identify',
    identifyHandler as never,
  );

  configureAnalytics({
    messenger: getAnalyticsMessenger(rootMessenger),
    version: '1.2.3',
    environment: 'test',
  });

  return {
    identifyHandler,
    trackEventHandler,
  };
}

describe('analytics', () => {
  it('normalizes lightweight built events before delivery', () => {
    const { trackEventHandler } = createConfiguredMessenger();

    trackEvent(
      createEventBuilder('Test Event')
        .addCategory('Test Category')
        .build({ environmentType: 'popup' }),
    );

    expect(trackEventHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Test Event',
        properties: expect.objectContaining({
          category: 'Test Category',
          locale: 'en-US',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          chain_id: '0x1',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          environment_type: 'popup',
        }),
      }),
      expect.objectContaining({
        app: {
          name: 'MetaMask Extension',
          version: '1.2.3-test',
        },
        marketingCampaignCookieId: 'campaign-id',
      }),
    );
  });

  it('preserves Segment special fields from builder event properties', () => {
    const { trackEventHandler } = createConfiguredMessenger();

    trackEvent(
      createEventBuilder('Revenue Event')
        .addCategory('Revenue Category')
        .addProperties({
          foo: 'bar',
          revenue: 1,
          value: 2,
          currency: 'USD',
        })
        .build(),
    );

    expect(trackEventHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Revenue Event',
        properties: expect.objectContaining({
          foo: 'bar',
          category: 'Revenue Category',
          revenue: 1,
          value: 2,
          currency: 'USD',
        }),
      }),
      expect.any(Object),
    );
  });

  it('validates identify traits before delivery', () => {
    const { identifyHandler } = createConfiguredMessenger();
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

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
      'analytics#identify: "test_null" value is not a valid trait type',
    );

    warnSpy.mockRestore();
  });
});
