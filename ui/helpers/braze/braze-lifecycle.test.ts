import { it } from '@jest/globals';
import * as braze from '@braze/web-sdk';
import { KeyringTypes } from '@metamask/keyring-controller';
import { act } from '@testing-library/react';
import { renderHookWithProviderTyped } from '../../../test/lib/render-helpers-navigate';
import { UPDATE_METAMASK_STATE } from '../../store/actionConstants';
import { clearBrazeUser, identifyBrazeUser } from './identify-braze-user';
import { useBrazeIdentity } from './use-braze-identity';

// Bypass the global SDK stub: cleanup must match the real SDK lifecycle.
jest.mock('@braze/web-sdk', () =>
  jest.requireActual('@braze/web-sdk/src/index.js'),
);

jest.mock('../../../shared/lib/sentry', () => ({
  ...jest.requireActual('../../../shared/lib/sentry'),
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
    jest.useRealTimers();
    process.env = originalEnv;
  });

  it.each([true, false])(
    'makes no requests before onboarding completes, then respects Basic Functionality = %s',
    async (useExternalServices) => {
      const { store } = renderHookWithProviderTyped(() => useBrazeIdentity(), {
        metamask: {
          completedOnboarding: false,
          isUnlocked: true,
          isSignedIn: true,
          // The default is still true before the onboarding choice is applied.
          useExternalServices: true,
          keyrings: [
            {
              type: KeyringTypes.hd,
              accounts: [],
              metadata: { id: 'entropy-1', name: '' },
            },
          ],
          srpSessionData: {
            'entropy-1': { profile: { canonicalProfileId: 'canonical-123' } },
          },
        },
      });

      await act(async () => {
        await jest.advanceTimersByTimeAsync(60_000);
      });

      expect(braze.isInitialized()).toBe(false);
      expect(window.XMLHttpRequest.prototype.send).not.toHaveBeenCalled();

      // Onboarding applies the user's preference before marking completion.
      act(() => {
        store.dispatch({
          type: UPDATE_METAMASK_STATE,
          value: { useExternalServices },
        });
      });
      expect(braze.isInitialized()).toBe(false);
      expect(window.XMLHttpRequest.prototype.send).not.toHaveBeenCalled();

      await act(async () => {
        store.dispatch({
          type: UPDATE_METAMASK_STATE,
          value: { completedOnboarding: true },
        });
        await jest.advanceTimersByTimeAsync(60_000);
      });

      expect(braze.isInitialized()).toBe(useExternalServices);
      if (useExternalServices) {
        expect(braze.getUser()?.getUserId()).toBe('canonical-123');
        expect(window.XMLHttpRequest.prototype.send).toHaveBeenCalled();
      } else {
        expect(window.XMLHttpRequest.prototype.send).not.toHaveBeenCalled();
      }
    },
  );

  it('stops the SDK without flushing queued events on cleanup', async () => {
    expect(identifyBrazeUser('canonical-123')).toBe(true);
    expect(braze.isInitialized()).toBe(true);
    await jest.advanceTimersByTimeAsync(0);
    expect(window.XMLHttpRequest.prototype.send).toHaveBeenCalled();
    jest.mocked(window.XMLHttpRequest.prototype.send).mockClear();
    expect(braze.logCustomEvent('scheduled-before-opt-out')).toBe(true);
    await jest.advanceTimersByTimeAsync(60_000);
    expect(window.XMLHttpRequest.prototype.send).toHaveBeenCalled();
    expect(braze.logCustomEvent('queued-before-opt-out')).toBe(true);
    jest.mocked(window.XMLHttpRequest.prototype.send).mockClear();

    clearBrazeUser();
    await jest.advanceTimersByTimeAsync(60_000);

    expect(braze.isInitialized()).toBe(false);
    expect(window.XMLHttpRequest.prototype.send).not.toHaveBeenCalled();
  });

  it('identifies the same user immediately after clearing', () => {
    expect(identifyBrazeUser('canonical-123')).toBe(true);
    clearBrazeUser();
    expect(braze.isInitialized()).toBe(false);

    expect(identifyBrazeUser('canonical-123')).toBe(true);

    expect(braze.isInitialized()).toBe(true);
    expect(braze.getUser()?.getUserId()).toBe('canonical-123');
  });

  it('starts a session on first identification without an explicit openSession', async () => {
    expect(identifyBrazeUser('canonical-123')).toBe(true);
    await jest.advanceTimersByTimeAsync(0);

    const requests = jest.mocked(window.XMLHttpRequest.prototype.send).mock
      .calls;
    expect(
      requests.some(([body]) => {
        const request = JSON.parse(String(body));
        return request.events?.some(
          (event: { name: string }) => event.name === 'ss',
        );
      }),
    ).toBe(true);
  });

  it('does not flush a second session when identifying the same user again', async () => {
    identifyBrazeUser('canonical-123');
    await jest.advanceTimersByTimeAsync(0);
    jest.mocked(window.XMLHttpRequest.prototype.send).mockClear();

    expect(identifyBrazeUser('canonical-123')).toBe(true);
    await jest.advanceTimersByTimeAsync(0);

    expect(window.XMLHttpRequest.prototype.send).not.toHaveBeenCalled();
  });
});
