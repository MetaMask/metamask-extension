import { it } from '@jest/globals';
import type {
  BrazeSdk,
  BrazeSdkBanner,
  BrazeSdkBannersEvent,
} from './braze-sdk';
import {
  BRAZE_BANNERS_REFRESH_TIMEOUT_MS,
  createBrazeHost,
} from './braze-host';

const PLACEMENT_ID = 'extension-wallet-home';

const createBanner = ({
  id = 'banner-1',
  isControl = false,
  properties = { body: 'Explore your wallet' },
}: {
  id?: string;
  isControl?: boolean;
  properties?: Record<string, string>;
} = {}) =>
  ({
    id,
    placementId: PLACEMENT_ID,
    isControl,
    getStringProperty: (key: string) => properties[key] ?? null,
    getImageProperty: () => null,
  }) as unknown as BrazeSdkBanner;

const createSdk = () => {
  let initialized = false;
  let userId: string | null = null;
  const banners: Record<string, BrazeSdkBanner | undefined> = {};
  const subscribers = new Map<string, (event: BrazeSdkBannersEvent) => void>();
  let nextSubscriptionId = 0;

  const sdk = {
    initialize: jest.fn(() => {
      initialized = true;
      return true;
    }),
    isInitialized: jest.fn(() => initialized),
    getUser: jest.fn(() => (initialized ? { getUserId: () => userId } : null)),
    changeUser: jest.fn((id: string) => {
      userId = id;
    }),
    requestImmediateDataFlush: jest.fn(),
    wipeData: jest.fn(() => {
      userId = null;
    }),
    destroy: jest.fn(() => {
      initialized = false;
    }),
    getBanner: jest.fn((placementId: string) =>
      initialized ? (banners[placementId] ?? null) : undefined,
    ),
    requestBannersRefresh: jest.fn(),
    subscribeToBannersEvents: jest.fn(
      (subscriber: (event: BrazeSdkBannersEvent) => void) => {
        nextSubscriptionId += 1;
        const subscriptionId = String(nextSubscriptionId);
        subscribers.set(subscriptionId, subscriber);
        return subscriptionId;
      },
    ),
    removeSubscription: jest.fn((subscriptionId: string) => {
      subscribers.delete(subscriptionId);
    }),
    logBannerImpressions: jest.fn(),
    logBannerClick: jest.fn(),
    dismissBanner: jest.fn(),
    logCustomEvent: jest.fn(),
  };

  return Object.assign(sdk as typeof sdk & BrazeSdk, {
    setBanner: (banner: BrazeSdkBanner | undefined) => {
      banners[PLACEMENT_ID] = banner;
    },
    emit: (event: Partial<BrazeSdkBannersEvent>) => {
      for (const subscriber of [...subscribers.values()]) {
        subscriber(event as BrazeSdkBannersEvent);
      }
    },
    subscriberCount: () => subscribers.size,
  });
};

const configureBraze = () => {
  process.env.BRAZE_WEB_API_KEY = 'test-key';
  process.env.BRAZE_SDK_ENDPOINT = 'sdk.example.com';
  delete process.env.IN_TEST;
};

/**
 * Let pending promise callbacks run.
 */
const flushPromises = async () => {
  for (let i = 0; i < 10; i++) {
    await Promise.resolve();
  }
};

describe('createBrazeHost', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    configureBraze();
    process.env.METAMASK_VERSION = '13.55.0';
    delete process.env.METAMASK_DEBUG;
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.useRealTimers();
  });

  describe('syncUser', () => {
    it('initializes with extension-safe options and identifies the user', async () => {
      const sdk = createSdk();
      const host = createBrazeHost({ loadSdk: async () => sdk });

      await host.syncUser('canonical-123');

      expect(sdk.initialize).toHaveBeenCalledWith('test-key', {
        baseUrl: 'sdk.example.com',
        enableLogging: false,
        noCookies: true,
        doNotLoadFontAwesome: true,
        allowUserSuppliedJavascript: false,
        manageServiceWorkerExternally: true,
        disablePushTokenMaintenance: true,
        appVersion: '13.55.0',
      });
      expect(sdk.changeUser).toHaveBeenCalledWith('canonical-123');
      expect(sdk.requestImmediateDataFlush).toHaveBeenCalled();
    });

    it('does not call changeUser for the current user', async () => {
      const sdk = createSdk();
      const host = createBrazeHost({ loadSdk: async () => sdk });

      await host.syncUser('canonical-123');
      await host.syncUser('canonical-123');

      expect(sdk.changeUser).toHaveBeenCalledTimes(1);
      expect(sdk.requestImmediateDataFlush).toHaveBeenCalledTimes(2);
    });

    it('does not load the SDK to clear when Braze has no data', async () => {
      const loadSdk = jest.fn();
      const host = createBrazeHost({ loadSdk });

      await host.syncUser(null);

      expect(loadSdk).not.toHaveBeenCalled();
    });

    it('loads the SDK to wipe data after identifying', async () => {
      const sdk = createSdk();
      const host = createBrazeHost({ loadSdk: async () => sdk });
      await host.syncUser('canonical-123');

      await host.syncUser(null);

      expect(sdk.wipeData).toHaveBeenCalled();
      expect(sdk.destroy).toHaveBeenCalled();
      expect(sdk.changeUser).toHaveBeenCalledTimes(1);
    });

    it('wipes data before destroying the SDK', async () => {
      const sdk = createSdk();
      const host = createBrazeHost({ loadSdk: async () => sdk });
      await host.syncUser('canonical-123');

      await host.syncUser(null);

      expect(sdk.wipeData.mock.invocationCallOrder[0]).toBeLessThan(
        sdk.destroy.mock.invocationCallOrder[0],
      );
    });

    it('still destroys the SDK when wiping throws', async () => {
      const sdk = createSdk();
      sdk.wipeData.mockImplementationOnce(() => {
        throw new Error('wipe failed');
      });
      const host = createBrazeHost({ loadSdk: async () => sdk });
      await host.syncUser('canonical-123');

      await expect(host.syncUser(null)).rejects.toThrow('wipe failed');
      expect(sdk.destroy).toHaveBeenCalled();
    });

    it('applies only the latest user while the SDK is loading', async () => {
      const sdk = createSdk();
      let resolveLoad: (value: BrazeSdk) => void = () => undefined;
      const host = createBrazeHost({
        loadSdk: () =>
          new Promise<BrazeSdk>((resolve) => {
            resolveLoad = resolve;
          }),
      });

      const identify = host.syncUser('canonical-123');
      const clear = host.syncUser(null);
      resolveLoad(sdk);
      await Promise.all([identify, clear]);

      expect(sdk.changeUser).not.toHaveBeenCalled();
      expect(sdk.isInitialized()).toBe(false);
    });

    it('throws when the SDK does not initialize', async () => {
      const sdk = createSdk();
      sdk.initialize.mockReturnValueOnce(false);
      const host = createBrazeHost({ loadSdk: async () => sdk });

      await expect(host.syncUser('canonical-123')).rejects.toThrow(
        'Braze SDK failed to initialize',
      );
      expect(sdk.requestImmediateDataFlush).not.toHaveBeenCalled();
    });

    it('retries a failed SDK load', async () => {
      const sdk = createSdk();
      const loadSdk = jest
        .fn()
        .mockRejectedValueOnce(new Error('chunk failed'))
        .mockResolvedValueOnce(sdk);
      const host = createBrazeHost({ loadSdk });

      await expect(host.syncUser('canonical-123')).rejects.toThrow(
        'chunk failed',
      );
      await host.syncUser('canonical-123');

      expect(sdk.changeUser).toHaveBeenCalledWith('canonical-123');
    });
  });

  describe('getBanner', () => {
    const setUp = async () => {
      const sdk = createSdk();
      const host = createBrazeHost({ loadSdk: async () => sdk });
      await host.syncUser('canonical-123');
      return { sdk, host };
    };

    it('returns null without loading the SDK when no user is identified', async () => {
      const loadSdk = jest.fn();
      const host = createBrazeHost({ loadSdk });

      expect(await host.getBanner(PLACEMENT_ID)).toBeNull();
      expect(loadSdk).not.toHaveBeenCalled();
    });

    it('syncs every placement and returns the banner once the sync completes', async () => {
      const { sdk, host } = await setUp();
      sdk.setBanner(createBanner());

      const banner = host.getBanner(PLACEMENT_ID);
      await flushPromises();
      expect(sdk.requestBannersRefresh).toHaveBeenCalledWith([PLACEMENT_ID]);
      sdk.emit({ type: 'DATA_UPDATED' });

      expect(await banner).toStrictEqual({
        id: 'banner-1',
        placementId: PLACEMENT_ID,
        isControl: false,
        title: null,
        body: 'Explore your wallet',
        imageUrl: null,
        ctaLabel: null,
        deeplink: null,
      });
      expect(sdk.subscriberCount()).toBe(0);
    });

    it('waits through errors the SDK recovers from', async () => {
      const { sdk, host } = await setUp();
      sdk.setBanner(createBanner());

      const banner = host.getBanner(PLACEMENT_ID);
      await flushPromises();
      // Sent before the SDK has its server config.
      sdk.emit({
        type: 'ERROR',
        reason: 'FEATURE_DISABLED',
        retryState: 'DO_NOT_RETRY',
      });
      sdk.emit({
        type: 'ERROR',
        reason: 'SERVER_ERROR',
        retryState: 'SDK_WILL_RETRY',
      });
      await flushPromises();
      expect(sdk.subscriberCount()).toBe(1);
      sdk.emit({ type: 'DATA_UPDATED' });

      expect(await banner).toMatchObject({ id: 'banner-1' });
    });

    it('syncs once per user', async () => {
      const { sdk, host } = await setUp();

      const first = host.getBanner(PLACEMENT_ID);
      await flushPromises();
      sdk.emit({ type: 'DATA_UPDATED' });
      await first;
      await host.getBanner(PLACEMENT_ID);

      expect(sdk.requestBannersRefresh).toHaveBeenCalledTimes(1);
    });

    it('syncs again after the user changes', async () => {
      const { sdk, host } = await setUp();
      const first = host.getBanner(PLACEMENT_ID);
      await flushPromises();
      sdk.emit({ type: 'DATA_UPDATED' });
      await first;

      await host.syncUser('canonical-456');
      const second = host.getBanner(PLACEMENT_ID);
      await flushPromises();
      sdk.emit({ type: 'DATA_UPDATED' });
      await second;

      expect(sdk.requestBannersRefresh).toHaveBeenCalledTimes(2);
    });

    it('syncs again after a failed sync', async () => {
      const { sdk, host } = await setUp();
      const first = host.getBanner(PLACEMENT_ID);
      await flushPromises();
      sdk.emit({
        type: 'ERROR',
        reason: 'CLIENT_ERROR',
        retryState: 'INTEGRATOR_MAY_RETRY',
      });
      expect(await first).toBeNull();

      const second = host.getBanner(PLACEMENT_ID);
      await flushPromises();
      sdk.emit({ type: 'DATA_UPDATED' });
      await second;

      expect(sdk.requestBannersRefresh).toHaveBeenCalledTimes(2);
    });

    it('returns the cached banner when the sync times out, without syncing again', async () => {
      jest.useFakeTimers();
      const { sdk, host } = await setUp();
      sdk.setBanner(createBanner());

      const banner = host.getBanner(PLACEMENT_ID);
      await flushPromises();
      jest.advanceTimersByTime(BRAZE_BANNERS_REFRESH_TIMEOUT_MS);

      expect(await banner).toMatchObject({ id: 'banner-1' });
      expect(sdk.subscriberCount()).toBe(0);
      await host.getBanner(PLACEMENT_ID);
      expect(sdk.requestBannersRefresh).toHaveBeenCalledTimes(1);
    });

    it('returns null when the user changes during the sync', async () => {
      const { sdk, host } = await setUp();
      sdk.setBanner(createBanner());

      const banner = host.getBanner(PLACEMENT_ID);
      await flushPromises();
      await host.syncUser('canonical-456');
      sdk.emit({ type: 'DATA_UPDATED' });

      expect(await banner).toBeNull();
    });

    it('returns null after Braze data is cleared', async () => {
      const { sdk, host } = await setUp();
      sdk.setBanner(createBanner());
      await host.syncUser(null);

      expect(await host.getBanner(PLACEMENT_ID)).toBeNull();
      expect(sdk.requestBannersRefresh).not.toHaveBeenCalled();
    });
  });

  describe('logBannerInteraction', () => {
    const setUp = async (banner: BrazeSdkBanner) => {
      const sdk = createSdk();
      const host = createBrazeHost({ loadSdk: async () => sdk });
      await host.syncUser('canonical-123');
      sdk.setBanner(banner);
      sdk.requestImmediateDataFlush.mockClear();
      return { sdk, host };
    };

    const campaignBanner = (isControl = false) =>
      createBanner({
        isControl,
        properties: {
          body: 'Explore your wallet',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          campaign_name: 'spring',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          variant_name: 'a',
        },
      });

    it('logs an impression with the Banner Display event', async () => {
      const { sdk, host } = await setUp(campaignBanner());

      await host.logBannerInteraction(PLACEMENT_ID, 'banner-1', 'impression');

      expect(sdk.logBannerImpressions).toHaveBeenCalledWith([PLACEMENT_ID]);
      expect(sdk.logCustomEvent).toHaveBeenCalledWith('Banner Display', {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        campaign_name: 'spring',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        variant_name: 'a',
      });
      expect(sdk.requestImmediateDataFlush).toHaveBeenCalledTimes(1);
    });

    it('logs a click with the Banner Select event', async () => {
      const banner = campaignBanner();
      const { sdk, host } = await setUp(banner);

      await host.logBannerInteraction(PLACEMENT_ID, 'banner-1', 'click');

      expect(sdk.logBannerClick).toHaveBeenCalledWith(banner);
      expect(sdk.logCustomEvent).toHaveBeenCalledWith(
        'Banner Select',
        expect.any(Object),
      );
    });

    it('dismisses with the Banner Dismissed event', async () => {
      const banner = campaignBanner();
      const { sdk, host } = await setUp(banner);

      await host.logBannerInteraction(PLACEMENT_ID, 'banner-1', 'dismiss');

      expect(sdk.dismissBanner).toHaveBeenCalledWith(banner);
      expect(sdk.logCustomEvent).toHaveBeenCalledWith(
        'Banner Dismissed',
        expect.any(Object),
      );
    });

    it('logs a control impression without the Banner Display event', async () => {
      const { sdk, host } = await setUp(campaignBanner(true));

      await host.logBannerInteraction(PLACEMENT_ID, 'banner-1', 'impression');

      expect(sdk.logBannerImpressions).toHaveBeenCalledWith([PLACEMENT_ID]);
      expect(sdk.logCustomEvent).not.toHaveBeenCalled();
    });

    it('logs no custom event for campaigns without a campaign name', async () => {
      const { sdk, host } = await setUp(createBanner());

      await host.logBannerInteraction(PLACEMENT_ID, 'banner-1', 'impression');

      expect(sdk.logBannerImpressions).toHaveBeenCalled();
      expect(sdk.logCustomEvent).not.toHaveBeenCalled();
    });

    it('ignores interactions with a banner that is no longer cached', async () => {
      const { sdk, host } = await setUp(createBanner({ id: 'banner-2' }));

      await host.logBannerInteraction(PLACEMENT_ID, 'banner-1', 'dismiss');

      expect(sdk.dismissBanner).not.toHaveBeenCalled();
      expect(sdk.requestImmediateDataFlush).not.toHaveBeenCalled();
    });

    it('ignores interactions after Braze data is cleared', async () => {
      const { sdk, host } = await setUp(createBanner());
      await host.syncUser(null);

      await host.logBannerInteraction(PLACEMENT_ID, 'banner-1', 'impression');

      expect(sdk.logBannerImpressions).not.toHaveBeenCalled();
    });
  });
});
