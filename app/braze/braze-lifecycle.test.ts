import * as braze from '@braze/web-sdk';
import type { BrazeSdk } from './braze-sdk';
import { createBrazeHost } from './braze-host';

// Bypass the global SDK stub: these tests exercise the real SDK lifecycle.
jest.mock('@braze/web-sdk', () =>
  jest.requireActual('@braze/web-sdk/src/index.js'),
);

const sdk = braze as unknown as BrazeSdk;
const send = () => jest.mocked(window.XMLHttpRequest.prototype.send);
const requestUrls = new WeakMap<XMLHttpRequest, string>();
let respond: (url: string) => unknown;
const queuedEvents = () =>
  send().mock.calls.flatMap(
    ([body]) => JSON.parse(String(body)).events ?? [],
  ) as { name: string }[];

/**
 * Emulate the LavaMoat policy: the SDK is not granted `localStorage`, so the
 * global is undefined and the SDK falls back to its in-memory store.
 */
const denyLocalStorage = () => {
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: undefined,
  });
};

const restoreLocalStorage = () => {
  delete (window as { localStorage?: Storage }).localStorage;
};

describe('Braze SDK lifecycle in the host', () => {
  const originalEnv = process.env;
  const { indexedDB } = window;
  let documentHidden = false;
  let host: ReturnType<typeof createBrazeHost>;

  beforeEach(() => {
    jest.useFakeTimers();
    process.env = {
      ...originalEnv,
      BRAZE_WEB_API_KEY: 'test-key',
      BRAZE_SDK_ENDPOINT: 'sdk.example.com',
    };
    delete process.env.IN_TEST;
    delete process.env.METAMASK_DEBUG;
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    // Chrome reports offscreen documents as visible. MV2 background pages can
    // be hidden; individual tests override this.
    documentHidden = false;
    jest
      .spyOn(document, 'hidden', 'get')
      .mockImplementation(() => documentHidden);
    // LavaMoat does not grant the SDK `indexedDB` or `localStorage`; remove
    // Jest's fakes so these tests run under the same conditions.
    delete (window as { indexedDB?: IDBFactory }).indexedDB;
    denyLocalStorage();
    // Network I/O is blocked at the browser boundary.
    respond = () => ({});
    const { open } = window.XMLHttpRequest.prototype;
    jest
      .spyOn(window.XMLHttpRequest.prototype, 'open')
      .mockImplementation(function (
        this: XMLHttpRequest,
        method: string,
        url: string | URL,
      ) {
        requestUrls.set(this, String(url));
        open.call(this, method, url, true);
      });
    jest
      .spyOn(window.XMLHttpRequest.prototype, 'send')
      .mockImplementation(function (this: XMLHttpRequest) {
        Object.defineProperties(this, {
          readyState: { configurable: true, value: 4 },
          status: { configurable: true, value: 200 },
          responseText: {
            configurable: true,
            value: JSON.stringify(respond(requestUrls.get(this) ?? '')),
          },
        });
        this.onload?.(new window.ProgressEvent('load'));
      });
    host = createBrazeHost({ loadSdk: async () => sdk });
  });

  afterEach(() => {
    braze.wipeData();
    braze.destroy();
    restoreLocalStorage();
    jest.useRealTimers();
    process.env = originalEnv;
    window.indexedDB = indexedDB;
  });

  it('identifies the canonical profile ID and starts a session', async () => {
    await host.syncUser('canonical-123');
    await jest.advanceTimersByTimeAsync(0);

    expect(braze.getUser()?.getUserId()).toBe('canonical-123');
    expect(queuedEvents().map(({ name }) => name)).toContain('ss');
  });

  it('does not report the screen resolution', async () => {
    await host.syncUser('canonical-123');
    await jest.advanceTimersByTimeAsync(0);

    const device = send()
      .mock.calls.map(([body]) => JSON.parse(String(body)).device)
      .find(Boolean);

    expect(device).toBeDefined();
    expect(device).not.toHaveProperty('resolution');
    expect(device).toHaveProperty('user_agent');
  });

  it('flushes identity from a hidden document', async () => {
    documentHidden = true;

    await host.syncUser('canonical-123');
    await jest.advanceTimersByTimeAsync(0);

    expect(braze.getUser()?.getUserId()).toBe('canonical-123');
    expect(queuedEvents().map(({ name }) => name)).toContain('ss');
  });

  it('does not send anything when the same user is synced again', async () => {
    await host.syncUser('canonical-123');
    await jest.advanceTimersByTimeAsync(0);
    send().mockClear();

    await host.syncUser('canonical-123');
    await jest.advanceTimersByTimeAsync(60_000);

    expect(send()).not.toHaveBeenCalled();
  });

  it('stops all SDK traffic after clearing', async () => {
    await host.syncUser('canonical-123');
    await jest.advanceTimersByTimeAsync(0);
    expect(braze.logCustomEvent('queued-before-opt-out')).toBe(true);
    send().mockClear();

    await host.syncUser(null);
    await jest.advanceTimersByTimeAsync(60_000);

    expect(braze.isInitialized()).toBe(false);
    expect(send()).not.toHaveBeenCalled();
  });

  it('identifies the same user again after clearing', async () => {
    await host.syncUser('canonical-123');
    await host.syncUser(null);

    await host.syncUser('canonical-123');

    expect(braze.getUser()?.getUserId()).toBe('canonical-123');
  });

  it('does not load the SDK to clear after a restart', async () => {
    await host.syncUser('canonical-123');
    await jest.advanceTimersByTimeAsync(0);
    // Background restart (MV3 service worker / MV2 page reload): the in-memory
    // store goes away with the host, so there is nothing left to wipe.
    braze.destroy();
    send().mockClear();

    await createBrazeHost({ loadSdk: async () => sdk }).syncUser(null);
    await jest.advanceTimersByTimeAsync(60_000);

    expect(braze.isInitialized()).toBe(false);
    expect(send()).not.toHaveBeenCalled();
  });

  it('starts a new session when a new host identifies the same user', async () => {
    await host.syncUser('canonical-123');
    await jest.advanceTimersByTimeAsync(0);
    braze.destroy();
    send().mockClear();

    await createBrazeHost({ loadSdk: async () => sdk }).syncUser(
      'canonical-123',
    );
    await jest.advanceTimersByTimeAsync(0);

    expect(braze.getUser()?.getUserId()).toBe('canonical-123');
    // Nothing survives a restart without a storage grant, so the new host
    // opens a new Braze session. The background re-identifies the user.
    expect(queuedEvents().map(({ name }) => name)).toContain('ss');
  });

  describe('banners', () => {
    const PLACEMENT_ID = 'extension-wallet-home';
    const isBannersSync = (url: string) => url.endsWith('/banners/sync');
    const bannersSyncCount = () =>
      send().mock.contexts.filter((xhr) =>
        isBannersSync(requestUrls.get(xhr as XMLHttpRequest) ?? ''),
      ).length;

    const bannersResponse = () => ({
      banners: {
        [PLACEMENT_ID]: {
          banner: {
            id: 'banner-1',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            placement_id: PLACEMENT_ID,
            html: '<div>Rendered by the SDK only</div>',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            is_test_send: false,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            is_control: false,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            expires_at: -1,
            // Required for dismissals.
            // eslint-disable-next-line @typescript-eslint/naming-convention
            stable_key: 'spring-banner',
            properties: {
              body: { type: 'string', value: 'Explore your wallet' },
              deeplink: {
                type: 'string',
                value: 'https://link.metamask.io/swap',
              },
              // eslint-disable-next-line @typescript-eslint/naming-convention
              campaign_name: { type: 'string', value: 'spring' },
            },
          },
        },
      },
      // Milliseconds, echoing the request's `time_ms`. Older responses are
      // ignored.
      // eslint-disable-next-line @typescript-eslint/naming-convention
      request_time: Date.now(),
    });

    beforeEach(() => {
      respond = (url) =>
        isBannersSync(url)
          ? bannersResponse()
          : {
              config: {
                time: Date.now(),
                // eslint-disable-next-line @typescript-eslint/naming-convention
                banners: { enabled: true, max_placements: 10 },
              },
            };
    });

    it('serves the banner once the server config enables banners', async () => {
      await host.syncUser('canonical-123');

      const banner = host.getBanner(PLACEMENT_ID);
      await jest.advanceTimersByTimeAsync(0);

      expect(await banner).toStrictEqual({
        id: 'banner-1',
        placementId: PLACEMENT_ID,
        isControl: false,
        title: null,
        body: 'Explore your wallet',
        imageUrl: null,
        ctaLabel: null,
        deeplink: 'https://link.metamask.io/swap',
      });
      expect(bannersSyncCount()).toBe(1);
    });

    it('returns null when banners are disabled', async () => {
      respond = () => ({
        config: { time: Date.now(), banners: { enabled: false } },
      });
      await host.syncUser('canonical-123');

      const banner = host.getBanner(PLACEMENT_ID);
      await jest.advanceTimersByTimeAsync(0);
      await jest.advanceTimersByTimeAsync(5_000);

      expect(await banner).toBeNull();
      expect(bannersSyncCount()).toBe(0);
    });

    it('logs the impression and the Banner Display event', async () => {
      await host.syncUser('canonical-123');
      const banner = host.getBanner(PLACEMENT_ID);
      await jest.advanceTimersByTimeAsync(0);
      await banner;
      send().mockClear();

      await host.logBannerInteraction(PLACEMENT_ID, 'banner-1', 'impression');
      await jest.advanceTimersByTimeAsync(0);

      expect(queuedEvents()).toStrictEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'bi' }),
          expect.objectContaining({
            name: 'ce',
            data: expect.objectContaining({ n: 'Banner Display' }),
          }),
        ]),
      );
    });

    it('stops serving a dismissed banner', async () => {
      await host.syncUser('canonical-123');
      const banner = host.getBanner(PLACEMENT_ID);
      await jest.advanceTimersByTimeAsync(0);
      await banner;

      await host.logBannerInteraction(PLACEMENT_ID, 'banner-1', 'dismiss');

      expect(await host.getBanner(PLACEMENT_ID)).toBeNull();
    });

    it('does not serve the previous user its banner', async () => {
      await host.syncUser('canonical-123');
      const banner = host.getBanner(PLACEMENT_ID);
      await jest.advanceTimersByTimeAsync(0);
      await banner;
      respond = () => ({});

      await host.syncUser('canonical-456');
      const nextBanner = host.getBanner(PLACEMENT_ID);
      await jest.advanceTimersByTimeAsync(5_000);

      expect(await nextBanner).toBeNull();
    });
  });
});
