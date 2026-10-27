import * as braze from '@braze/web-sdk';
import type { BrazeSdk } from './braze-sdk';
import { createBrazeHost } from './braze-host';

// Bypass the global SDK stub: these tests exercise the real SDK lifecycle.
jest.mock('@braze/web-sdk', () =>
  jest.requireActual('@braze/web-sdk/src/index.js'),
);

const sdk = braze as unknown as BrazeSdk;
const send = () => jest.mocked(window.XMLHttpRequest.prototype.send);
const brazeStorageKeys = () =>
  Object.keys(localStorage).filter((key) => key.startsWith('ab.'));

describe('Braze SDK lifecycle in the host', () => {
  const originalEnv = process.env;
  const { indexedDB } = window;
  let documentHidden = false;
  let syncBrazeUser: ReturnType<typeof createBrazeHost>;

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
    // LavaMoat does not grant the SDK `indexedDB`; remove Jest's fake one.
    delete (window as { indexedDB?: IDBFactory }).indexedDB;
    // Network I/O is blocked at the browser boundary.
    jest
      .spyOn(window.XMLHttpRequest.prototype, 'send')
      .mockImplementation(function (this: XMLHttpRequest) {
        Object.defineProperties(this, {
          readyState: { configurable: true, value: 4 },
          status: { configurable: true, value: 200 },
          responseText: { configurable: true, value: '{}' },
        });
        this.onload?.(new window.ProgressEvent('load'));
      });
    syncBrazeUser = createBrazeHost({ loadSdk: async () => sdk });
  });

  afterEach(() => {
    braze.wipeData();
    braze.destroy();
    localStorage.clear();
    jest.useRealTimers();
    process.env = originalEnv;
    window.indexedDB = indexedDB;
  });

  it('identifies the canonical profile ID and starts a session', async () => {
    await syncBrazeUser('canonical-123');
    await jest.advanceTimersByTimeAsync(0);

    expect(braze.getUser()?.getUserId()).toBe('canonical-123');
    expect(
      send().mock.calls.some(([body]) =>
        JSON.parse(String(body)).events?.some(
          (event: { name: string }) => event.name === 'ss',
        ),
      ),
    ).toBe(true);
  });

  it('flushes identity from a hidden document', async () => {
    documentHidden = true;

    await syncBrazeUser('canonical-123');
    await jest.advanceTimersByTimeAsync(0);

    expect(braze.getUser()?.getUserId()).toBe('canonical-123');
    expect(
      send().mock.calls.some(([body]) =>
        JSON.parse(String(body)).events?.some(
          (event: { name: string }) => event.name === 'ss',
        ),
      ),
    ).toBe(true);
  });

  it('does not send anything when the same user is synced again', async () => {
    await syncBrazeUser('canonical-123');
    await jest.advanceTimersByTimeAsync(0);
    send().mockClear();

    await syncBrazeUser('canonical-123');
    await jest.advanceTimersByTimeAsync(60_000);

    expect(send()).not.toHaveBeenCalled();
  });

  it('stops all SDK traffic after clearing', async () => {
    await syncBrazeUser('canonical-123');
    await jest.advanceTimersByTimeAsync(0);
    expect(braze.logCustomEvent('queued-before-opt-out')).toBe(true);
    send().mockClear();

    await syncBrazeUser(null);
    await jest.advanceTimersByTimeAsync(60_000);

    expect(braze.isInitialized()).toBe(false);
    expect(send()).not.toHaveBeenCalled();
  });

  it('identifies the same user again after clearing', async () => {
    await syncBrazeUser('canonical-123');
    await syncBrazeUser(null);

    await syncBrazeUser('canonical-123');

    expect(braze.getUser()?.getUserId()).toBe('canonical-123');
  });

  it('wipes data persisted by a previous host without sending requests', async () => {
    await syncBrazeUser('canonical-123');
    await jest.advanceTimersByTimeAsync(0);
    // Service worker restart: the host and SDK go away, storage stays, and the
    // Braze session expires.
    braze.destroy();
    await jest.advanceTimersByTimeAsync(2 * 60 * 60 * 1000);
    expect(brazeStorageKeys()).not.toHaveLength(0);
    send().mockClear();

    await createBrazeHost({ loadSdk: async () => sdk })(null);
    await jest.advanceTimersByTimeAsync(60_000);

    expect(braze.isInitialized()).toBe(false);
    expect(brazeStorageKeys()).toStrictEqual([]);
    expect(send()).not.toHaveBeenCalled();
  });

  it('keeps the persisted user across a new host (background restart)', async () => {
    await syncBrazeUser('canonical-123');
    await jest.advanceTimersByTimeAsync(0);
    braze.destroy();
    send().mockClear();

    await createBrazeHost({ loadSdk: async () => sdk })('canonical-123');
    await jest.advanceTimersByTimeAsync(0);

    expect(braze.getUser()?.getUserId()).toBe('canonical-123');
    expect(
      send().mock.calls.some(([body]) =>
        JSON.parse(String(body)).events?.some(
          (event: { name: string }) => event.name === 'ss',
        ),
      ),
    ).toBe(false);
  });
});
