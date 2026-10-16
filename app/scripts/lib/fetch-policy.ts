/** A hostname list matches exact hosts (including all ports), never subdomains. */
export type FetchDomainPolicy = '*' | readonly string[];

export type FetchPolicy = {
  completedOnboarding: boolean;
  allowedDomains: FetchDomainPolicy;
  /** When set, restrict post-onboarding fetches to these exact RPC URLs. */
  allowedRpcUrls: readonly string[] | null;
  onboardingPath: string | null;
  onboardingDomains: Readonly<Record<string, readonly string[]>>;
};

export type FetchPolicyApi = {
  getPolicy: () => Promise<FetchPolicy>;
  update: (changes: Partial<FetchPolicy>) => void;
  /** A one-off chain-ID check for an endpoint explicitly chosen in network settings. */
  probeRpcEndpoint?: typeof fetch;
};

export type FetchPolicyGlobal = Pick<
  typeof globalThis,
  'fetch' | 'Request' | 'URL' | 'AbortSignal'
> & {
  location: { href: string };
  chrome: Pick<typeof chrome, 'runtime'>;
  metamaskFetchPolicy?: FetchPolicyApi;
};

/**
 * Install before LavaMoat captures globals or any application module runs.
 * This dependency-free module is compiled into a Webpack runtime module. Keep
 * native references in the closure: the real global is scuttled afterwards.
 *
 * The background owns policy. Other extension realms consult it for each remote
 * request, so already-open pages and captured fetch references see updates.
 *
 * @param scope - The native global object for this extension realm.
 * @param allowTestFixtures - Allow the E2E harness to seed state before onboarding.
 */
export function installFetchPolicy(
  scope: FetchPolicyGlobal,
  allowTestFixtures = false,
): void {
  if (scope.metamaskFetchPolicy) {
    return;
  }

  const nativeFetch = scope.fetch.bind(scope);
  const {
    Request: NativeRequest,
    URL: NativeURL,
    AbortSignal: NativeAbortSignal,
  } = scope;
  const runtime = scope.chrome?.runtime;
  const location = new NativeURL(scope.location.href);
  const extensionUrl = runtime?.getURL
    ? new NativeURL(runtime.getURL('/'))
    : null;
  const isExtensionUrl = (url: URL) =>
    extensionUrl !== null &&
    url.protocol === extensionUrl.protocol &&
    url.host === extensionUrl.host;
  const isBackground =
    isExtensionUrl(location) &&
    ['/background.html', '/service-worker.js'].includes(location.pathname);
  const messageType = 'metamask-fetch-policy:get';
  const manifest = allowTestFixtures ? runtime.getManifest() : undefined;
  const fixturePort =
    (
      manifest as
        | { _flags?: { testing?: { fixtureServerPort?: number } } }
        | undefined
    )?._flags?.testing?.fixtureServerPort ?? 12345;

  let policy: FetchPolicy = Object.freeze({
    completedOnboarding: false,
    allowedDomains: '*',
    allowedRpcUrls: null,
    onboardingPath: null,
    onboardingDomains: Object.freeze({}),
  });

  const normalizeDomains = (domains: readonly string[]): readonly string[] => {
    if (!Array.isArray(domains)) {
      throw new TypeError('Fetch policy requires an array of hostnames');
    }
    return Object.freeze(
      domains.map((domain) => {
        if (
          typeof domain !== 'string' ||
          !domain ||
          /[\s/:@?#*\\]/u.test(domain)
        ) {
          throw new TypeError('Fetch policy entries must be bare hostnames');
        }
        const url = new NativeURL(`https://${domain}`);
        return url.hostname.replace(/\.$/u, '');
      }),
    );
  };

  const normalizeRpcUrl = (value: string): string => {
    if (typeof value !== 'string') {
      throw new TypeError('Fetch policy RPC endpoints must be HTTP(S) URLs');
    }
    const url = new NativeURL(value);
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new TypeError('Fetch policy RPC endpoints must be HTTP(S) URLs');
    }
    // RpcService moves credentials to the Authorization header. Fragments
    // never form part of the network request.
    url.username = '';
    url.password = '';
    url.hash = '';
    return url.href;
  };

  const update = (changes: Partial<FetchPolicy>) => {
    if (!isBackground) {
      throw new TypeError('Fetch policy can only be updated in the background');
    }
    const next = { ...policy, ...changes };
    if (
      typeof next.completedOnboarding !== 'boolean' ||
      (next.allowedRpcUrls !== null && !Array.isArray(next.allowedRpcUrls)) ||
      (next.onboardingPath !== null &&
        typeof next.onboardingPath !== 'string') ||
      !next.onboardingDomains ||
      typeof next.onboardingDomains !== 'object' ||
      Array.isArray(next.onboardingDomains)
    ) {
      throw new TypeError('Invalid fetch policy');
    }
    // Validate the whole update before publishing it; copy and freeze lists so
    // callers cannot later change the policy by mutating an input array.
    policy = Object.freeze({
      completedOnboarding: next.completedOnboarding,
      allowedDomains:
        next.allowedDomains === '*'
          ? '*'
          : normalizeDomains(next.allowedDomains),
      allowedRpcUrls:
        next.allowedRpcUrls === null
          ? null
          : Object.freeze([
              ...new Set(next.allowedRpcUrls.map(normalizeRpcUrl)),
            ]),
      onboardingPath: next.onboardingPath,
      onboardingDomains: Object.freeze(
        Object.fromEntries(
          Object.entries(next.onboardingDomains).map(([path, domains]) => [
            path,
            normalizeDomains(domains),
          ]),
        ),
      ),
    });
  };

  if (isBackground) {
    runtime.onMessage.addListener((message, sender, respond) => {
      if (message?.type === messageType && sender.id === runtime.id) {
        respond(policy);
      }
    });
  }

  const getPolicy = async (signal?: AbortSignal): Promise<FetchPolicy> => {
    if (isBackground) {
      return policy;
    }
    return new Promise((resolve, reject) => {
      const onAbort = () => reject(signal?.reason);
      signal?.throwIfAborted();
      signal?.addEventListener('abort', onAbort, { once: true });
      try {
        runtime.sendMessage({ type: messageType }, (response: FetchPolicy) => {
          signal?.removeEventListener('abort', onAbort);
          if (runtime.lastError || !response) {
            reject(new TypeError('Fetch policy is unavailable'));
          } else {
            resolve(response);
          }
        });
      } catch {
        signal?.removeEventListener('abort', onAbort);
        reject(new TypeError('Fetch policy is unavailable'));
      }
    });
  };

  const probeRpcEndpoint: typeof fetch = async (input, init) => {
    // Settings must be able to validate a newly chosen RPC before saving it.
    // This only permits a chain-ID probe; it never adds a general exception to
    // the shared allowlist. Dependencies receive no grant for this root API.
    if (!isExtensionUrl(location)) {
      throw new TypeError('RPC probes require an extension page');
    }
    const request = new NativeRequest(input, init);
    const url = new NativeURL(request.url);
    if (
      !['http:', 'https:'].includes(url.protocol) ||
      request.method !== 'POST'
    ) {
      throw new TypeError('Only HTTP(S) eth_chainId probes are allowed');
    }
    const body: unknown = await request.clone().json();
    if (
      !body ||
      typeof body !== 'object' ||
      !('method' in body) ||
      body.method !== 'eth_chainId' ||
      !('jsonrpc' in body) ||
      body.jsonrpc !== '2.0' ||
      !('params' in body) ||
      !Array.isArray(body.params) ||
      body.params.length !== 0
    ) {
      throw new TypeError('Only HTTP(S) eth_chainId probes are allowed');
    }
    const current = isBackground ? policy : await getPolicy(request.signal);
    if (!current.completedOnboarding) {
      throw new TypeError('RPC probes require completed onboarding');
    }
    return nativeFetch(
      new NativeRequest(request, {
        redirect: 'error',
        signal: NativeAbortSignal.any([
          request.signal,
          NativeAbortSignal.timeout(30_000),
        ]),
      }),
    );
  };

  scope.metamaskFetchPolicy = Object.freeze({
    getPolicy,
    update,
    probeRpcEndpoint,
  });
  scope.fetch = async (input, init) => {
    // Snapshot URL, options and body once. Checking the caller's input and then
    // passing it to fetch again would allow mutable URL coercion to bypass policy.
    let request = new NativeRequest(input, init);
    const url = new NativeURL(request.url);
    request.signal.throwIfAborted();

    // Packaged assets and data/blob URLs do not contact remote hosts.
    if (isExtensionUrl(url) || ['data:', 'blob:'].includes(url.protocol)) {
      return nativeFetch(request);
    }
    if (
      allowTestFixtures &&
      url.origin === `http://localhost:${fixturePort}` &&
      url.pathname === '/state.json' &&
      request.method === 'GET'
    ) {
      return nativeFetch(new NativeRequest(request, { redirect: 'error' }));
    }
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new TypeError(
        'Fetch blocked by network policy: unsupported protocol',
      );
    }

    const current = isBackground ? policy : await getPolicy(request.signal);
    request.signal.throwIfAborted();
    const domains = current.completedOnboarding
      ? current.allowedDomains
      : (current.onboardingPath !== null &&
          Object.hasOwn(current.onboardingDomains, current.onboardingPath) &&
          current.onboardingDomains[current.onboardingPath]) ||
        [];
    const rpcUrls = current.completedOnboarding ? current.allowedRpcUrls : null;
    if (rpcUrls !== null) {
      if (!rpcUrls.includes(normalizeRpcUrl(request.url))) {
        throw new TypeError(
          'Fetch blocked by network policy: RPC endpoint not allowed',
        );
      }
    } else if (
      domains !== '*' &&
      !domains.includes(url.hostname.replace(/\.$/u, ''))
    ) {
      throw new TypeError(
        'Fetch blocked by network policy: domain not allowed',
      );
    }
    if (rpcUrls !== null || domains !== '*') {
      // A browser can follow a cross-origin redirect before JS can inspect it.
      // Reject redirects under an allowlist rather than leak to an unchecked host.
      request = new NativeRequest(request, { redirect: 'error' });
    }
    return nativeFetch(request);
  };
}
