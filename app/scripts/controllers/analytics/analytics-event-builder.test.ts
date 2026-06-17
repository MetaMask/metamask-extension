import type { Hex } from '@metamask/utils';
import {
  ENVIRONMENT_TYPE_BACKGROUND,
  ENVIRONMENT_TYPE_NOTIFICATION,
} from '../../../../shared/constants/app';
import { METAMETRICS_BACKGROUND_PAGE_OBJECT } from '../../../../shared/constants/metametrics';
import {
  AB_TEST_ANALYTICS_MAPPINGS,
  clearABTestAnalyticsMappings,
} from '../../../../shared/lib/ab-testing/ab-test-analytics';
import { createActiveABTestAssignment } from '../../../../shared/lib/ab-testing/active-ab-test-assignment';
import { ANONYMOUS_EVENT_PROPERTY } from './platform-adapter';
import {
  AnalyticsEventBuilder,
  buildPageViewPayload,
} from './analytics-event-builder';

const CHAIN_ID = '0x1' as Hex;
const LOCALE = 'en-US';
const APP_VERSION = '1.2.3-test';
const MARKETING_CAMPAIGN_COOKIE_ID = 'cookie-id';
const TEST_FLAG_KEY = 'testAnalyticsBuilderFlag';

describe('AnalyticsEventBuilder', () => {
  let remoteFeatureFlags: Record<string, unknown>;

  beforeEach(() => {
    remoteFeatureFlags = {};
    AnalyticsEventBuilder.configure({
      getExtensionContext: () => ({
        chainId: CHAIN_ID,
        locale: LOCALE,
        appVersion: APP_VERSION,
        marketingCampaignCookieId: MARKETING_CAMPAIGN_COOKIE_ID,
        dataCollectionForMarketing: true,
        isEvmSelected: true,
        selectedMultichainNetworkChainId: null,
      }),
      getRemoteFeatureFlags: () => remoteFeatureFlags,
    });
  });

  afterEach(() => {
    clearABTestAnalyticsMappings();
  });

  it('creates an event from a string event name', () => {
    const { event, context } =
      AnalyticsEventBuilder.createEventBuilder('Wallet Opened').build();

    expect(event).toMatchObject({
      name: 'Wallet Opened',
      properties: {
        locale: LOCALE,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        chain_id: CHAIN_ID,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        environment_type: ENVIRONMENT_TYPE_BACKGROUND,
      },
      sensitiveProperties: {},
      saveDataRecording: false,
    });
    expect(event.hasProperties).toBe(true);
    expect(context).toMatchObject({
      app: {
        name: 'MetaMask Extension',
        version: APP_VERSION,
      },
      page: METAMETRICS_BACKGROUND_PAGE_OBJECT,
      marketingCampaignCookieId: MARKETING_CAMPAIGN_COOKIE_ID,
    });
  });

  it('adds, merges, overwrites, and removes properties', () => {
    const { event } = AnalyticsEventBuilder.createEventBuilder('Test Event')
      .addProperties({ foo: 'bar', removeMe: 'value' })
      .addProperties({ foo: 'baz', answer: 42 })
      .removeProperties(['removeMe'])
      .build();

    expect(event.properties).toMatchObject({
      foo: 'baz',
      answer: 42,
    });
    expect(event.properties).not.toHaveProperty('removeMe');
  });

  it('adds, merges, overwrites, and removes sensitive properties', () => {
    const { event } = AnalyticsEventBuilder.createEventBuilder('Test Event')
      .addSensitiveProperties({ secret: 'one', removeMe: 'value' })
      .addSensitiveProperties({ secret: 'two', another: true })
      .removeSensitiveProperties(['removeMe'])
      .build();

    expect(event.sensitiveProperties).toStrictEqual({
      secret: 'two',
      another: true,
    });
    expect(event.hasProperties).toBe(true);
  });

  it('omits undefined property values', () => {
    const { event } = AnalyticsEventBuilder.createEventBuilder('Test Event')
      .addProperties({ foo: undefined, bar: 'baz' })
      .build();

    expect(event.properties).toMatchObject({ bar: 'baz' });
    expect(event.properties).not.toHaveProperty('foo');
  });

  it('overrides caller locale with extension locale', () => {
    const { event } = AnalyticsEventBuilder.createEventBuilder('Test Event')
      .addProperties({
        revenue: 1,
        value: 2,
        currency: 'USD',
        locale: 'caller-locale',
      })
      .build();

    expect(event.properties).toMatchObject({
      revenue: 1,
      value: 2,
      currency: 'USD',
      locale: LOCALE,
    });
  });

  it('preserves explicit chain_id', () => {
    const { event } = AnalyticsEventBuilder.createEventBuilder('Test Event')
      .addProperties({
        // eslint-disable-next-line @typescript-eslint/naming-convention
        chain_id: '0x5',
      })
      .build();

    expect(event.properties.chain_id).toBe('0x5');
  });

  it('sets chain_id to null when chain_id_caip is present', () => {
    const { event } = AnalyticsEventBuilder.createEventBuilder('Test Event')
      .addProperties({
        // eslint-disable-next-line @typescript-eslint/naming-convention
        chain_id_caip: 'solana:mainnet',
      })
      .build();

    expect(event.properties.chain_id).toBeNull();
    expect(event.properties.chain_id_caip).toBe('solana:mainnet');
  });

  it('defaults to EVM chain_id on a non-EVM network when chain fields are omitted', () => {
    AnalyticsEventBuilder.configure({
      getExtensionContext: () => ({
        chainId: CHAIN_ID,
        locale: LOCALE,
        appVersion: APP_VERSION,
        marketingCampaignCookieId: MARKETING_CAMPAIGN_COOKIE_ID,
        dataCollectionForMarketing: true,
        isEvmSelected: false,
        selectedMultichainNetworkChainId:
          'bip122:000000000019d6689c085ae165831e93',
      }),
      getRemoteFeatureFlags: () => remoteFeatureFlags,
    });

    const { event } =
      AnalyticsEventBuilder.createEventBuilder('Test Event').build();

    expect(event.properties.chain_id).toBe(CHAIN_ID);
    expect(event.properties).not.toHaveProperty('chain_id_caip');
  });

  it('falls back to extension chain_id when chain_id is not a string', () => {
    const { event } = AnalyticsEventBuilder.createEventBuilder('Test Event')
      .addProperties({
        // eslint-disable-next-line @typescript-eslint/naming-convention
        chain_id: 1,
      })
      .build();

    expect(event.properties.chain_id).toBe(CHAIN_ID);
  });

  it('uses per-event context options when building context', () => {
    const page = { path: '/confirm', title: 'Confirm' };
    const referrer = { url: 'https://dapp.example' };

    const { event, context } = AnalyticsEventBuilder.createEventBuilder(
      'Test Event',
    ).build({
      page,
      referrer,
      environmentType: ENVIRONMENT_TYPE_NOTIFICATION,
    });

    expect(event.properties.environment_type).toBe(
      ENVIRONMENT_TYPE_NOTIFICATION,
    );
    expect(context).toMatchObject({ page, referrer });
  });

  it('injects active AB test assignments for mapped events', () => {
    AB_TEST_ANALYTICS_MAPPINGS.push({
      flagKey: TEST_FLAG_KEY,
      validVariants: ['control', 'treatment'],
      eventNames: ['Mapped Event'],
    });
    remoteFeatureFlags = {
      [TEST_FLAG_KEY]: 'treatment',
    };

    const { event } =
      AnalyticsEventBuilder.createEventBuilder('Mapped Event').build();

    expect(event.properties.active_ab_tests).toStrictEqual([
      createActiveABTestAssignment(TEST_FLAG_KEY, 'treatment'),
    ]);
  });

  it('marks events fully anonymous when excludeMetaMetricsId is true', () => {
    const { event } = AnalyticsEventBuilder.createEventBuilder('Test Event')
      .addProperties({ foo: 'bar' })
      .build({ excludeMetaMetricsId: true });

    expect(event.properties[ANONYMOUS_EVENT_PROPERTY]).toBe(true);
  });

  it('auto-anonymizes send and confirm events by default', () => {
    const { event } =
      AnalyticsEventBuilder.createEventBuilder('send button clicked').build();

    expect(event.properties[ANONYMOUS_EVENT_PROPERTY]).toBe(true);
  });

  it('does not auto-anonymize send and confirm events when explicitly disabled', () => {
    const { event } = AnalyticsEventBuilder.createEventBuilder(
      'confirm button clicked',
    ).build({ excludeMetaMetricsId: false });

    expect(event.properties[ANONYMOUS_EVENT_PROPERTY]).toBeUndefined();
  });

  it('throws when event name is not provided', () => {
    expect(() => AnalyticsEventBuilder.createEventBuilder('')).toThrow(
      /Must specify event\./u,
    );
  });

  it('throws when full anonymization is combined with sensitive properties', () => {
    expect(() =>
      AnalyticsEventBuilder.createEventBuilder('Test Event')
        .addSensitiveProperties({ secret: 'value' })
        .build({ excludeMetaMetricsId: true }),
    ).toThrow(
      'sensitiveProperties was specified in an event payload that also set the excludeMetaMetricsId flag',
    );
  });
});

describe('buildPageViewPayload', () => {
  beforeEach(() => {
    AnalyticsEventBuilder.configure({
      getExtensionContext: () => ({
        chainId: CHAIN_ID,
        locale: LOCALE,
        appVersion: APP_VERSION,
        marketingCampaignCookieId: MARKETING_CAMPAIGN_COOKIE_ID,
        dataCollectionForMarketing: true,
        isEvmSelected: true,
        selectedMultichainNetworkChainId: null,
      }),
      getRemoteFeatureFlags: () => ({}),
    });
  });

  it('builds a page view with common properties and context', () => {
    const pagePayload = buildPageViewPayload({
      name: 'home',
      environmentType: ENVIRONMENT_TYPE_BACKGROUND,
      page: METAMETRICS_BACKGROUND_PAGE_OBJECT,
    });

    expect(pagePayload).toMatchObject({
      name: 'home',
      properties: {
        locale: LOCALE,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        chain_id: CHAIN_ID,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        environment_type: ENVIRONMENT_TYPE_BACKGROUND,
      },
      context: {
        app: {
          name: 'MetaMask Extension',
          version: APP_VERSION,
        },
        page: METAMETRICS_BACKGROUND_PAGE_OBJECT,
        marketingCampaignCookieId: MARKETING_CAMPAIGN_COOKIE_ID,
      },
    });
    expect(pagePayload.properties).not.toHaveProperty('chain_id_caip');
  });

  it('omits chain_id_caip on EVM networks even when a CAIP chain id is available', () => {
    AnalyticsEventBuilder.configure({
      getExtensionContext: () => ({
        chainId: CHAIN_ID,
        locale: LOCALE,
        appVersion: APP_VERSION,
        marketingCampaignCookieId: MARKETING_CAMPAIGN_COOKIE_ID,
        dataCollectionForMarketing: true,
        isEvmSelected: true,
        selectedMultichainNetworkChainId: 'eip155:1',
      }),
      getRemoteFeatureFlags: () => ({}),
    });

    const pagePayload = buildPageViewPayload({
      name: 'home',
      environmentType: ENVIRONMENT_TYPE_BACKGROUND,
      page: METAMETRICS_BACKGROUND_PAGE_OBJECT,
    });

    expect(pagePayload.properties.chain_id).toBe(CHAIN_ID);
    expect(pagePayload.properties).not.toHaveProperty('chain_id_caip');
  });

  it('sends chain_id_caip and null chain_id when a non-EVM network is selected', () => {
    AnalyticsEventBuilder.configure({
      getExtensionContext: () => ({
        chainId: CHAIN_ID,
        locale: LOCALE,
        appVersion: APP_VERSION,
        marketingCampaignCookieId: MARKETING_CAMPAIGN_COOKIE_ID,
        dataCollectionForMarketing: true,
        isEvmSelected: false,
        selectedMultichainNetworkChainId:
          'bip122:000000000019d6689c085ae165831e93',
      }),
      getRemoteFeatureFlags: () => ({}),
    });

    const pagePayload = buildPageViewPayload({
      name: 'New Confirmation Page',
      environmentType: ENVIRONMENT_TYPE_BACKGROUND,
      page: METAMETRICS_BACKGROUND_PAGE_OBJECT,
    });

    expect(pagePayload.properties).toMatchObject({
      locale: LOCALE,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      chain_id: null,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      chain_id_caip: 'bip122:000000000019d6689c085ae165831e93',
      // eslint-disable-next-line @typescript-eslint/naming-convention
      environment_type: ENVIRONMENT_TYPE_BACKGROUND,
    });
  });
});

