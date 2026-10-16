import { Messenger } from '@metamask/messenger';
import browserApi from 'webextension-polyfill';
import { RpcEndpointValidationService } from './rpc-endpoint-validation-service';

jest.mock('webextension-polyfill', () => ({ tabs: { create: jest.fn() } }));

function buildService({ withNetworkPolicy = true } = {}) {
  const connectListeners = new Set<(port: chrome.runtime.Port) => void>();
  const messageListeners = new Set<(value: unknown) => void>();
  const disconnectListeners = new Set<() => void>();
  const revoke = jest.fn().mockResolvedValue(undefined);
  const allowRpcValidation = jest.fn().mockResolvedValue(revoke);
  let port: chrome.runtime.Port;
  const browser = {
    runtime: {
      id: 'test-extension',
      getURL: jest.fn(
        (path: string) => `chrome-extension://test-extension/${path}`,
      ),
      onConnect: {
        addListener: jest.fn((listener) => connectListeners.add(listener)),
        removeListener: jest.fn((listener) =>
          connectListeners.delete(listener),
        ),
      },
    },
    tabs: {
      create: jest.fn(async ({ url }: { url: string }) => {
        port = {
          name: 'rpc-endpoint-validation',
          sender: {
            id: 'test-extension',
            url,
            frameId: 0,
            tab: { id: 42 },
          },
          onMessage: {
            addListener: jest.fn((listener) => messageListeners.add(listener)),
          },
          onDisconnect: {
            addListener: jest.fn((listener) =>
              disconnectListeners.add(listener),
            ),
          },
          postMessage: jest.fn(() => {
            for (const listener of messageListeners) {
              listener({ chainId: '0x1' });
            }
          }),
          disconnect: jest.fn(),
        } as unknown as chrome.runtime.Port;
        for (const listener of connectListeners) {
          listener(port);
        }
        return {
          id: 42,
          index: 0,
          highlighted: false,
          active: false,
          pinned: false,
          incognito: false,
        };
      }),
      remove: jest.fn().mockResolvedValue(undefined),
    },
  };
  jest
    .mocked(browserApi.tabs.create)
    .mockImplementation(async (options) =>
      browser.tabs.create(options as { url: string }),
    );
  const service = new RpcEndpointValidationService({
    messenger: new Messenger({ namespace: 'RpcEndpointValidationService' }),
    browser: browser as unknown as ConstructorParameters<
      typeof RpcEndpointValidationService
    >[0]['browser'],
    ...(withNetworkPolicy ? { allowRpcValidation } : {}),
  });

  return {
    service,
    browser,
    allowRpcValidation,
    revoke,
    connectListeners,
    messageListeners,
    disconnectListeners,
    getPort: () => port,
  };
}

describe('RpcEndpointValidationService', () => {
  describe('validateRpcEndpoint', () => {
    it('grants only the isolated broker tab access to the exact fetch URL', async () => {
      const { service, browser, allowRpcValidation, revoke, getPort } =
        buildService();

      await expect(
        service.validateRpcEndpoint(
          'https://user:pass@rpc.example/rpc?key=1#fragment',
        ),
      ).resolves.toBe('0x1');

      expect(browser.tabs.create).toHaveBeenCalledWith({
        url: expect.stringMatching(
          /^chrome-extension:\/\/test-extension\/rpc-endpoint-validation\.html#/u,
        ),
        active: false,
      });
      expect(allowRpcValidation).toHaveBeenCalledWith({
        tabId: 42,
        url: 'https://rpc.example/rpc?key=1',
      });
      expect(getPort().postMessage).toHaveBeenCalledWith({
        url: 'https://user:pass@rpc.example/rpc?key=1#fragment',
      });
      expect(browser.tabs.remove).toHaveBeenCalledWith(42);
      expect(revoke).toHaveBeenCalledTimes(1);
      expect(
        jest.mocked(browser.tabs.remove).mock.invocationCallOrder[0],
      ).toBeLessThan(revoke.mock.invocationCallOrder[0]);
    });

    it('keeps fixed-method validation available on browsers without DNR', async () => {
      const { service, browser, allowRpcValidation } = buildService({
        withNetworkPolicy: false,
      });

      await expect(
        service.validateRpcEndpoint('https://rpc.example'),
      ).resolves.toBe('0x1');

      expect(allowRpcValidation).not.toHaveBeenCalled();
      expect(browser.tabs.remove).toHaveBeenCalledWith(42);
    });

    it('does not create a broker for a non-HTTP URL', async () => {
      const { service, browser, allowRpcValidation } = buildService();

      await expect(
        service.validateRpcEndpoint('data:application/json,{}'),
      ).rejects.toThrow('HTTP or HTTPS');

      expect(browser.tabs.create).not.toHaveBeenCalled();
      expect(allowRpcValidation).not.toHaveBeenCalled();
    });

    it('rejects an authenticated document from a different tab before granting access', async () => {
      const { service, browser, allowRpcValidation } = buildService();
      const create = jest.mocked(browser.tabs.create).getMockImplementation();
      jest.mocked(browser.tabs.create).mockImplementation(async (...args) => {
        if (!create) {
          throw new Error('Missing tab creation mock');
        }
        const result = await create(...args);
        return { ...result, id: 99 };
      });

      await expect(
        service.validateRpcEndpoint('https://rpc.example'),
      ).rejects.toThrow('Invalid RPC validation context');

      expect(allowRpcValidation).not.toHaveBeenCalled();
      expect(browser.tabs.remove).toHaveBeenCalledWith(99);
    });

    it('cleans up after the browser rejects a permission update', async () => {
      const { service, browser, allowRpcValidation, revoke } = buildService();
      allowRpcValidation.mockRejectedValue(new Error('Rule update failed'));

      await expect(
        service.validateRpcEndpoint('https://rpc.example'),
      ).rejects.toThrow('Rule update failed');

      expect(browser.tabs.remove).toHaveBeenCalledWith(42);
      expect(revoke).not.toHaveBeenCalled();
    });

    it('passes only numeric rate-limit metadata across the background RPC boundary', async () => {
      const { service, messageListeners, allowRpcValidation, getPort, revoke } =
        buildService();
      allowRpcValidation.mockImplementation(async () => {
        jest.mocked(getPort().postMessage).mockImplementation(() => {
          for (const listener of messageListeners) {
            listener({
              error: {
                code: -32029,
                httpStatus: 429,
                body: 'private response',
              },
            });
          }
        });
        return revoke;
      });

      await expect(
        service.validateRpcEndpoint('https://rpc.example'),
      ).rejects.toMatchObject({
        code: -32603,
        message: 'RPC endpoint validation failed.',
        data: { code: -32029, httpStatus: 429 },
      });
      expect(revoke).toHaveBeenCalledTimes(1);
    });

    it('closes a stalled broker and revokes its grant when validation times out', async () => {
      jest.useFakeTimers();
      const { service, browser, allowRpcValidation, getPort, revoke } =
        buildService();
      allowRpcValidation.mockImplementation(async () => {
        jest.mocked(getPort().postMessage).mockImplementation(() => undefined);
        return revoke;
      });
      try {
        const validation = service.validateRpcEndpoint('https://rpc.example');
        const rejection = expect(validation).rejects.toThrow('timed out');
        await jest.advanceTimersByTimeAsync(12_001);
        await rejection;

        expect(browser.tabs.remove).toHaveBeenCalledWith(42);
        expect(revoke).toHaveBeenCalledTimes(1);
      } finally {
        jest.useRealTimers();
      }
    });

    it('removes the connection listener when no trusted broker connects', async () => {
      jest.useFakeTimers();
      const { service, browser, connectListeners, allowRpcValidation } =
        buildService();
      jest.mocked(browser.tabs.create).mockResolvedValue({
        id: 42,
        index: 0,
        highlighted: false,
        active: false,
        pinned: false,
        incognito: false,
      });
      try {
        const validation = service.validateRpcEndpoint('https://rpc.example');
        const rejection = expect(validation).rejects.toThrow('timed out');
        await jest.advanceTimersByTimeAsync(5_001);
        await rejection;

        expect(connectListeners.size).toBe(0);
        expect(allowRpcValidation).not.toHaveBeenCalled();
      } finally {
        jest.useRealTimers();
      }
    });

    it('closes the broker tab even if permission revocation fails', async () => {
      const { service, browser, revoke } = buildService();
      revoke.mockRejectedValue(new Error('Cleanup failed'));

      await expect(
        service.validateRpcEndpoint('https://rpc.example'),
      ).rejects.toThrow('Cleanup failed');

      expect(browser.tabs.remove).toHaveBeenCalledWith(42);
    });
  });
});
