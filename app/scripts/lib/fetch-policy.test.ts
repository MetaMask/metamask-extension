/** @jest-environment node */

import { it } from '@jest/globals';
import { installFetchPolicy, type FetchPolicyGlobal } from './fetch-policy';

function createRealm(
  path = '/service-worker.js',
  allowTestFixtures = false,
  origin = 'chrome-extension://extension-id',
) {
  const fetchMock = jest.fn().mockResolvedValue(new Response('ok'));
  const runtime = {
    id: 'extension-id',
    getURL: (resource: string) => `chrome-extension://extension-id${resource}`,
    getManifest: jest.fn().mockReturnValue({}),
    onMessage: { addListener: jest.fn() },
    sendMessage: jest.fn(),
    lastError: undefined as { message: string } | undefined,
  };
  const scope: FetchPolicyGlobal = {
    fetch: fetchMock,
    Request,
    URL,
    AbortSignal,
    location: { href: `${origin}${path}` },
    chrome: { runtime } as unknown as FetchPolicyGlobal['chrome'],
  };
  installFetchPolicy(scope, allowTestFixtures);
  const api = scope.metamaskFetchPolicy;
  if (!api) {
    throw new Error('Fetch policy was not installed');
  }
  return { scope, fetchMock, runtime, api };
}

describe('installFetchPolicy', () => {
  it('rejects remote requests before onboarding without calling native fetch', async () => {
    const { scope, fetchMock } = createRealm();

    await expect(scope.fetch('https://example.com')).rejects.toThrow(
      'domain not allowed',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('updates previously captured and bound fetch references', async () => {
    const { scope, fetchMock, api } = createRealm();
    const captured = scope.fetch.bind({});

    api.update({ completedOnboarding: true });
    await captured('https://example.com');
    api.update({ allowedDomains: [] });
    await expect(captured('https://example.com')).rejects.toThrow(
      'domain not allowed',
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.contexts[0]).toBe(scope);
  });

  it('restricts privacy mode to complete RPC URLs even with wildcard domain policy', async () => {
    const { scope, fetchMock, api } = createRealm();
    api.update({
      completedOnboarding: true,
      allowedDomains: '*',
      allowedRpcUrls: ['https://rpc.example:8443/v1?key=test'],
    });

    await scope.fetch('https://rpc.example:8443/v1?key=test');
    await expect(
      scope.fetch('https://rpc.example:8443/telemetry'),
    ).rejects.toThrow('RPC endpoint not allowed');
    await expect(
      scope.fetch('https://rpc.example/v1?key=test'),
    ).rejects.toThrow('RPC endpoint not allowed');
    await expect(
      scope.fetch('https://rpc.example:8443/v1?key=other'),
    ).rejects.toThrow('RPC endpoint not allowed');
    await expect(
      scope.fetch('http://rpc.example:8443/v1?key=test'),
    ).rejects.toThrow('RPC endpoint not allowed');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0].redirect).toBe('error');
  });

  it('updates RPC restrictions on captured fetch references and restores the domain policy', async () => {
    const { scope, api, fetchMock } = createRealm();
    const captured = scope.fetch;
    api.update({
      completedOnboarding: true,
      allowedRpcUrls: ['http://localhost:8545'],
    });
    await captured('http://localhost:8545/');
    api.update({ allowedRpcUrls: ['http://localhost:9545'] });
    await expect(captured('http://localhost:8545')).rejects.toThrow(
      'RPC endpoint not allowed',
    );
    await captured('http://localhost:9545');
    api.update({ allowedRpcUrls: [], allowedDomains: '*' });
    await expect(captured('http://localhost:9545')).rejects.toThrow(
      'RPC endpoint not allowed',
    );
    api.update({ allowedRpcUrls: null });
    await captured('https://api.example');

    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('does not open the onboarding gate for saved RPC endpoints', async () => {
    const { scope, api, fetchMock } = createRealm();
    api.update({ allowedRpcUrls: ['https://rpc.example'] });

    await expect(scope.fetch('https://rpc.example')).rejects.toThrow(
      'domain not allowed',
    );

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('validates and freezes the RPC URL list atomically', async () => {
    const { api, scope } = createRealm();
    const rpcUrls = ['http://user:password@[::1]:8545/#fragment'];
    api.update({ completedOnboarding: true, allowedRpcUrls: rpcUrls });
    rpcUrls.push('https://evil.test');

    await scope.fetch('http://[::1]:8545/#another');
    await expect(scope.fetch('https://evil.test')).rejects.toThrow(
      'RPC endpoint not allowed',
    );
    expect(() =>
      api.update({
        allowedRpcUrls: ['https://evil.test', 'ftp://rpc.example'],
      }),
    ).toThrow();
    expect((await api.getPolicy()).allowedRpcUrls).toStrictEqual([
      'http://[::1]:8545/',
    ]);
    expect(Object.isFrozen((await api.getPolicy()).allowedRpcUrls)).toBe(true);
  });

  describe('probeRpcEndpoint', () => {
    const probeOptions = {
      method: 'POST',
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'test',
        method: 'eth_chainId',
        params: [],
      }),
    };

    it('allows a user-selected chain-ID probe without allowing other traffic to the endpoint', async () => {
      const { scope, api, fetchMock } = createRealm();
      api.update({ completedOnboarding: true, allowedRpcUrls: [] });
      if (!api.probeRpcEndpoint) {
        throw new Error('Missing RPC probe');
      }

      await api.probeRpcEndpoint('https://new-rpc.example', probeOptions);
      await expect(
        scope.fetch('https://new-rpc.example', probeOptions),
      ).rejects.toThrow('RPC endpoint not allowed');

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock.mock.calls[0][0].redirect).toBe('error');
      expect((await api.getPolicy()).allowedRpcUrls).toStrictEqual([]);
    });

    it('does not permit RPC probes before onboarding', async () => {
      const { api, fetchMock } = createRealm();

      await expect(
        api.probeRpcEndpoint?.('https://new-rpc.example', probeOptions),
      ).rejects.toThrow('completed onboarding');

      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('rejects methods other than a chain-ID probe', async () => {
      const { api, fetchMock } = createRealm();
      api.update({ completedOnboarding: true, allowedRpcUrls: [] });

      await expect(
        api.probeRpcEndpoint?.('https://new-rpc.example', {
          ...probeOptions,
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_sendRawTransaction',
            params: [],
          }),
        }),
      ).rejects.toThrow('eth_chainId probes');

      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('does not expose the probe to isolated content scripts', async () => {
      const { api, fetchMock } = createRealm('/', false, 'https://example.com');

      await expect(
        api.probeRpcEndpoint?.('https://new-rpc.example', probeOptions),
      ).rejects.toThrow('extension page');

      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  it.each(['/service-worker.js', '/background.html'])(
    'owns policy in %s',
    async (path) => {
      const { api, scope, fetchMock } = createRealm(path);
      api.update({ completedOnboarding: true, allowedDomains: '*' });

      await scope.fetch('https://any-domain.example');

      expect(fetchMock).toHaveBeenCalledTimes(1);
    },
  );

  it.each([
    'https://example.com.evil.test',
    'https://sub.example.com',
    'https://evil.test/?url=https://example.com',
    'https://evil.test/#example.com',
  ])('rejects hostname lookalikes: %s', async (url) => {
    const { api, scope, fetchMock } = createRealm();
    api.update({ completedOnboarding: true, allowedDomains: ['example.com'] });

    await expect(scope.fetch(url)).rejects.toThrow('domain not allowed');

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('normalizes case, IDNs and trailing DNS dots', async () => {
    const { api, scope, fetchMock } = createRealm();
    api.update({
      completedOnboarding: true,
      allowedDomains: ['EXAMPLE.COM.', 'bücher.example'],
    });

    await scope.fetch('https://example.com.:8443/path');
    await scope.fetch('https://xn--bcher-kva.example');

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it.each([
    'https://example.com',
    '*.example.com',
    'example.com:443',
    'user@example.com',
    'example.com/path',
    '*',
    '',
  ])('rejects malformed policy entries atomically: %s', async (domain) => {
    const { api, scope, fetchMock } = createRealm();

    expect(() =>
      api.update({ completedOnboarding: true, allowedDomains: [domain] }),
    ).toThrow();
    await expect(scope.fetch('https://example.com')).rejects.toThrow(
      'domain not allowed',
    );

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('copies policy input and freezes returned state', async () => {
    const { api, scope } = createRealm();
    const domains = ['example.com'];
    api.update({ completedOnboarding: true, allowedDomains: domains });
    domains.push('evil.test');

    await expect(scope.fetch('https://evil.test')).rejects.toThrow(
      'domain not allowed',
    );
    expect(Object.isFrozen(await api.getPolicy())).toBe(true);
    expect(Object.isFrozen((await api.getPolicy()).allowedDomains)).toBe(true);
  });

  it('enables only the selected onboarding path and revokes it on cancellation', async () => {
    const { api, scope, fetchMock } = createRealm();
    api.update({
      onboardingDomains: {
        social: ['login.example'],
        other: ['other.example'],
      },
    });
    await expect(scope.fetch('https://login.example')).rejects.toThrow(
      'domain not allowed',
    );

    api.update({ onboardingPath: 'social' });
    await scope.fetch('https://login.example');
    await expect(scope.fetch('https://other.example')).rejects.toThrow(
      'domain not allowed',
    );
    api.update({ onboardingPath: null });
    await expect(scope.fetch('https://login.example')).rejects.toThrow(
      'domain not allowed',
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('uses the post-onboarding list after completion and blocks again on reset', async () => {
    const { api, scope } = createRealm();
    api.update({
      onboardingPath: 'social',
      onboardingDomains: { social: ['login.example'] },
      allowedDomains: ['api.example'],
    });
    api.update({ completedOnboarding: true, onboardingPath: null });

    await scope.fetch('https://api.example');
    await expect(scope.fetch('https://login.example')).rejects.toThrow(
      'domain not allowed',
    );
    api.update({ completedOnboarding: false });
    await expect(scope.fetch('https://api.example')).rejects.toThrow(
      'domain not allowed',
    );
  });

  it.each([
    'chrome-extension://extension-id/_locales/en/messages.json',
    'data:text/plain,hello',
    'blob:https://example.com/id',
  ])('allows local resources before onboarding: %s', async (url) => {
    const { scope, fetchMock } = createRealm();

    await scope.fetch(url);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('does not exempt another extension or unknown protocols', async () => {
    const { scope, api, fetchMock } = createRealm();
    api.update({ completedOnboarding: true });

    await expect(scope.fetch('chrome-extension://other/asset')).rejects.toThrow(
      'unsupported protocol',
    );
    await expect(scope.fetch('ftp://example.com/file')).rejects.toThrow(
      'unsupported protocol',
    );

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('only exempts the fixture GET endpoint in test builds', async () => {
    const production = createRealm();
    const testing = createRealm('/service-worker.js', true);

    await expect(
      production.scope.fetch('http://localhost:12345/state.json'),
    ).rejects.toThrow('domain not allowed');
    await testing.scope.fetch('http://localhost:12345/state.json');
    await expect(
      testing.scope.fetch('http://localhost:12345/other'),
    ).rejects.toThrow('domain not allowed');
    await expect(
      testing.scope.fetch('http://localhost:12345/state.json', {
        method: 'POST',
      }),
    ).rejects.toThrow('domain not allowed');

    expect(production.fetchMock).not.toHaveBeenCalled();
    expect(testing.fetchMock).toHaveBeenCalledTimes(1);
    expect(testing.fetchMock.mock.calls[0][0].redirect).toBe('error');
  });

  it('snapshots URL coercion once', async () => {
    const { scope, api, fetchMock } = createRealm();
    const stringifyUrl = jest
      .fn()
      .mockReturnValueOnce('https://allowed.example')
      .mockReturnValue('https://evil.test');
    api.update({
      completedOnboarding: true,
      allowedDomains: ['allowed.example'],
    });

    await scope.fetch({ toString: stringifyUrl } as unknown as URL);

    expect(stringifyUrl).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0].url).toBe('https://allowed.example/');
  });

  it('preserves Request bodies, headers, options and init overrides', async () => {
    const { scope, api, fetchMock } = createRealm();
    api.update({ completedOnboarding: true });
    const request = new Request('https://example.com', {
      method: 'POST',
      body: 'payload',
      headers: { 'x-test': 'original' },
      credentials: 'include',
    });

    await scope.fetch(request, { headers: { 'x-test': 'override' } });

    const sent: Request = fetchMock.mock.calls[0][0];
    expect(await sent.text()).toBe('payload');
    expect(sent.method).toBe('POST');
    expect(sent.credentials).toBe('include');
    expect(sent.headers.get('x-test')).toBe('override');
  });

  it('blocks redirect traversal even when the caller asks to follow', async () => {
    const { scope, api, fetchMock } = createRealm();
    api.update({ completedOnboarding: true, allowedDomains: ['example.com'] });

    await scope.fetch(new URL('https://example.com'), { redirect: 'follow' });

    expect(fetchMock.mock.calls[0][0].redirect).toBe('error');
  });

  it('preserves redirect behavior for wildcard policy', async () => {
    const { scope, api, fetchMock } = createRealm();
    api.update({ completedOnboarding: true });

    await scope.fetch('https://example.com', { redirect: 'manual' });

    expect(fetchMock.mock.calls[0][0].redirect).toBe('manual');
  });

  it('preserves abort reasons without issuing a request', async () => {
    const { scope, api, fetchMock } = createRealm();
    api.update({ completedOnboarding: true });
    const abort = new AbortController();
    abort.abort(new Error('cancelled'));

    await expect(
      scope.fetch('https://example.com', { signal: abort.signal }),
    ).rejects.toThrow('cancelled');

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('does not install a second wrapper', () => {
    const { scope } = createRealm();
    const captured = scope.fetch;

    installFetchPolicy(scope);

    expect(scope.fetch).toBe(captured);
  });

  it('reads current background policy in another realm for every remote fetch', async () => {
    const background = createRealm();
    const client = createRealm('/home.html');
    const respond = background.runtime.onMessage.addListener.mock.calls[0][0];
    client.runtime.sendMessage.mockImplementation((message, callback) =>
      respond(message, { id: 'extension-id' }, callback),
    );
    const captured = client.scope.fetch;
    await expect(captured('https://example.com')).rejects.toThrow(
      'domain not allowed',
    );
    background.api.update({ completedOnboarding: true });
    await captured('https://example.com');
    background.api.update({ allowedDomains: [] });
    await expect(captured('https://example.com')).rejects.toThrow(
      'domain not allowed',
    );

    expect(client.fetchMock).toHaveBeenCalledTimes(1);
    expect(() => client.api.update({ completedOnboarding: true })).toThrow(
      'only be updated in the background',
    );
  });

  it('rejects requests when background policy is unavailable', async () => {
    const { scope, runtime, fetchMock } = createRealm('/offscreen.html');
    runtime.lastError = { message: 'Disconnected' };
    runtime.sendMessage.mockImplementation((_message, callback) =>
      callback(undefined),
    );

    await expect(scope.fetch('https://example.com')).rejects.toThrow(
      'policy is unavailable',
    );

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('can abort while waiting for the background policy', async () => {
    const { scope, fetchMock } = createRealm('/home.html');
    const abort = new AbortController();
    const result = scope.fetch('https://example.com', { signal: abort.signal });

    abort.abort(new Error('cancelled'));

    await expect(result).rejects.toThrow('cancelled');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('does not expose policy to an external extension', () => {
    const { runtime } = createRealm();
    const listener = runtime.onMessage.addListener.mock.calls[0][0];
    const respond = jest.fn();

    listener(
      { type: 'metamask-fetch-policy:get' },
      { id: 'other-extension' },
      respond,
    );

    expect(respond).not.toHaveBeenCalled();
  });
});
