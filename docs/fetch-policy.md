# Global fetch policy

Every extension Webpack runtime installs a stable `fetch` wrapper before
LavaMoat captures its global endowments, before Sentry, and before application
modules execute. It also runs in development builds without LavaMoat. Dependencies
that capture or bind `fetch` keep using the wrapper when policy changes.

The background (MV3 service worker or MV2 background page) owns the policy.
Extension pages, offscreen documents, and isolated content scripts consult the
background for each remote fetch. This adds one runtime message per remote
request in those contexts, avoids stale policy caches in already-open pages, and
fails closed if the background is unavailable. The injected inpage provider does
not replace a website's `fetch`.

## Updating policy

From trusted background code, or its DevTools console:

```typescript
globalThis.metamaskFetchPolicy?.update({
  allowedDomains: ['api.example.com', 'rpc.example.org'],
});

// Allow all HTTP(S) hosts after onboarding.
globalThis.metamaskFetchPolicy?.update({ allowedDomains: '*' });

// Deny all remote fetches after onboarding.
globalThis.metamaskFetchPolicy?.update({ allowedDomains: [] });

const policy = await globalThis.metamaskFetchPolicy?.getPolicy();
```

`update` accepts partial updates and validates them atomically. Lists are copied
and frozen. Hostnames match exactly, with case, internationalized names, and a
trailing DNS dot normalized. A hostname permits any port. Subdomains must be
listed separately. URLs, paths, ports and wildcard patterns inside lists are
rejected; `'*'` is supported only as the complete post-onboarding policy.

Manual policy overrides are in memory and reset when the background restarts.
The default post-onboarding domain policy is `'*'`; the Basic Functionality
restriction below takes precedence for SRP wallets in privacy mode. To apply a
deployment-specific domain policy across restarts, set it in trusted startup code
before controller initialization.
There is no public dapp API or cross-context message that updates policy.

## Basic Functionality privacy mode

After onboarding, SRP wallets with Basic Functionality off
(`PreferencesController.useExternalServices === false`) can fetch only their
saved RPC endpoints. The background derives `allowedRpcUrls` from
`NetworkController.networkConfigurationsByChainId`, including every saved RPC
and its saved failover URLs. Infura URL templates use the same project ID as
NetworkController. Build-only failover hosts are not added implicitly.

This restriction is restored from persisted settings before controller startup.
It updates synchronously when Basic Functionality, network configurations, or
social-login identity changes. Switching Basic Functionality back on removes the
RPC restriction and resumes `allowedDomains`. Social wallets are identified
using their onboarding flow, seedless auth connection, and linked social profile;
they are not put under the SRP restriction.

RPC matching uses the complete HTTP(S) URL: scheme, host, port, path, and query.
An allowed endpoint does not permit telemetry or other paths on the same host.
HTTP credentials are removed from the URL for matching because RpcService sends
them in the Authorization header; fragments are ignored. Empty lists block all
remote fetches. Malformed persisted endpoints are skipped without widening the
policy. `allowedRpcUrls: null` means that the ordinary domain policy applies.

Network settings can make a one-off `eth_chainId` probe to a new user-selected
endpoint before saving it. The trusted `probeRpcEndpoint` API accepts only an
HTTP(S) POST with `eth_chainId` and empty params, requires completed onboarding,
and rejects redirects. It is unavailable from content scripts and is not granted
to LavaMoat dependencies. A probe does not grant general access to the endpoint;
the saved list changes only when the network is saved.

## Onboarding

Remote fetches start blocked. Persisted `OnboardingController` state restores the
gate before other controllers initialize. Completion and reset events update it
synchronously, before other onboarding event listeners start network work.

Social login is an explicit exception: starting OAuth selects the `social` path
and enables its exact hostname list. Merely opening onboarding enables no remote
hosts. OAuth cancellation/failure, authentication failure, reset, switching to
seed phrase onboarding, and completion revoke that exception. A persisted social
onboarding flow can resume after restart. The list contains the configured auth
services, Web3Auth node discovery, and the five TOPRF/metadata nodes for the build
environment. It does not grant all subdomains of those services.

Additional paths can be configured by trusted background code:

```typescript
globalThis.metamaskFetchPolicy?.update({
  onboardingDomains: {
    social: ['auth.example.com'],
    anotherPath: ['onboarding.example.org'],
  },
});

// Only after an explicit user selection:
globalThis.metamaskFetchPolicy?.update({ onboardingPath: 'anotherPath' });

// On cancellation:
globalThis.metamaskFetchPolicy?.update({ onboardingPath: null });
```

`onboardingDomains` replaces the complete path map. Unknown paths allow no hosts.
Post-onboarding policy replaces the onboarding exceptions; it does not union them.
Blocked requests reject with a `TypeError` and are not queued or replayed.

## Boundaries

- Same-extension packaged resources, `data:` and `blob:` URLs remain available
  because they do not contact a remote host. Other non-HTTP(S) schemes are blocked.
- Under a hostname list, redirects use `redirect: 'error'`, even if the caller
  requests `follow`. Browsers cannot expose every cross-origin redirect for
  checking before following it. Wildcard policy preserves the caller's redirect
  behavior.
- Policy changes govern subsequent dispatches, not requests already in flight.
- This controls native `fetch` in the extension's bundled realms. It is not a
  network firewall: XHR-based clients, WebSockets, images, navigation, OAuth
  browser windows, and externally hosted Snap execution environments have their
  own networking. It does not retrofit arbitrary workers or third-party realms.
- Trusted root code can update policy. LavaMoat dependencies are not granted the
  policy API. As with other global instrumentation, trusted root code must not
  replace the wrapper with another network implementation.
- Test builds alone allow a GET to the harness's exact localhost `/state.json`
  endpoint before onboarding, with redirects disabled. Release builds contain
  no enabled fixture exception.
