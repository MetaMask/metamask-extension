import {
  ActionConstraint,
  Messenger,
  MOCK_ANY_NAMESPACE,
  MockAnyNamespace,
} from '@metamask/messenger';
import type { MultichainNetworkControllerGetStateAction } from '@metamask/multichain-network-controller';
import type {
  NetworkControllerGetNetworkClientByIdAction,
  NetworkControllerGetStateAction,
} from '@metamask/network-controller';
import type { RemoteFeatureFlagControllerGetStateAction } from '@metamask/remote-feature-flag-controller';
import type { Hex } from '@metamask/utils';
import type { PreferencesControllerGetStateAction } from '../preferences-controller';
import type { MetaMetricsControllerGetStateAction } from '../metametrics-controller';
import { configureAnalyticsEventBuilder } from './analytics-event-builder-init';
import { AnalyticsEventBuilder } from './analytics-event-builder';
import { getAnalyticsEventBuilderMessenger } from './analytics-event-builder-messenger';

const CHAIN_ID = '0x1' as Hex;
const LOCALE = 'en-US';
const APP_VERSION = '1.2.3-test';
const MARKETING_CAMPAIGN_COOKIE_ID = 'cookie-id';

describe('configureAnalyticsEventBuilder', () => {
  it('configures the builder from controller messenger state', () => {
    const messenger = new Messenger<
      MockAnyNamespace,
      | PreferencesControllerGetStateAction
      | MultichainNetworkControllerGetStateAction
      | NetworkControllerGetStateAction
      | NetworkControllerGetNetworkClientByIdAction
      | RemoteFeatureFlagControllerGetStateAction
      | MetaMetricsControllerGetStateAction
      | ActionConstraint,
      never
    >({
      namespace: MOCK_ANY_NAMESPACE,
    });

    messenger.registerActionHandler('PreferencesController:getState', () =>
      ({
        currentLocale: 'en_US',
      }) as never,
    );

    messenger.registerActionHandler('MultichainNetworkController:getState', () =>
      ({
        isEvmSelected: true,
        selectedMultichainNetworkChainId: 'eip155:1',
      }) as never,
    );

    messenger.registerActionHandler('NetworkController:getState', () =>
      ({
        selectedNetworkClientId: 'mainnet',
      }) as never,
    );

    messenger.registerActionHandler(
      'NetworkController:getNetworkClientById',
      () =>
        ({
          configuration: { chainId: CHAIN_ID },
        }) as never,
    );

    messenger.registerActionHandler(
      'RemoteFeatureFlagController:getState',
      () =>
        ({
          remoteFeatureFlags: {},
        }) as never,
    );

    messenger.registerActionHandler('MetaMetricsController:getState', () =>
      ({
        marketingCampaignCookieId: MARKETING_CAMPAIGN_COOKIE_ID,
        dataCollectionForMarketing: true,
      }) as never,
    );

    configureAnalyticsEventBuilder({
      messenger: getAnalyticsEventBuilderMessenger(messenger),
      version: '1.2.3',
      environment: 'test',
    });

    const { event, context } =
      AnalyticsEventBuilder.createEventBuilder('Wallet Opened').build();

    expect(event.properties).toMatchObject({
      locale: LOCALE,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      chain_id: CHAIN_ID,
    });
    expect(context).toMatchObject({
      app: {
        version: APP_VERSION,
      },
      marketingCampaignCookieId: MARKETING_CAMPAIGN_COOKIE_ID,
    });
  });
});
