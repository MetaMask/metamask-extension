import * as braze from '@braze/web-sdk';
import {
  clearBrazeUser,
  identifyBrazeUser,
  resetBrazeIdentityForTesting,
} from './identify-braze-user';
import { resetBrazeInitializationForTesting } from './initialize-braze';

// Bypass the global SDK stub: cleanup must match the real SDK lifecycle.
jest.mock('@braze/web-sdk', () =>
  jest.requireActual('@braze/web-sdk/src/index.js'),
);

jest.mock('../../../shared/lib/sentry', () => ({
  captureException: jest.fn(),
}));

describe('Braze SDK lifecycle', () => {
  const originalEnv = process.env;

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
    jest.spyOn(document, 'hidden', 'get').mockReturnValue(false);
    // Exercise the real SDK with network I/O blocked at the browser boundary.
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
  });

  afterEach(() => {
    braze.wipeData();
    braze.destroy();
    resetBrazeInitializationForTesting();
    resetBrazeIdentityForTesting();
    jest.useRealTimers();
    process.env = originalEnv;
  });

  it('stops the SDK without flushing queued events on cleanup', async () => {
    await expect(identifyBrazeUser('canonical-123')).resolves.toBe(true);
    expect(braze.isInitialized()).toBe(true);
    expect(window.XMLHttpRequest.prototype.send).toHaveBeenCalled();
    jest.mocked(window.XMLHttpRequest.prototype.send).mockClear();
    expect(braze.logCustomEvent('scheduled-before-opt-out')).toBe(true);
    await jest.advanceTimersByTimeAsync(60_000);
    expect(window.XMLHttpRequest.prototype.send).toHaveBeenCalled();
    expect(braze.logCustomEvent('queued-before-opt-out')).toBe(true);
    jest.mocked(window.XMLHttpRequest.prototype.send).mockClear();

    await clearBrazeUser();
    await jest.advanceTimersByTimeAsync(60_000);

    expect(braze.isInitialized()).toBe(false);
    expect(window.XMLHttpRequest.prototype.send).not.toHaveBeenCalled();
  });

  it('reactivates and identifies after cleanup', async () => {
    await expect(identifyBrazeUser('canonical-123')).resolves.toBe(true);
    await clearBrazeUser();
    expect(braze.isInitialized()).toBe(false);

    await expect(identifyBrazeUser('canonical-123')).resolves.toBe(true);

    expect(braze.isInitialized()).toBe(true);
    expect(braze.getUser()?.getUserId()).toBe('canonical-123');
  });
});
