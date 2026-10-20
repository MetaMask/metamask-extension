# Network request backstop

Chrome MV3 retains its Chrome 123 minimum and adds
`declarativeNetRequestWithHostAccess`; existing host permissions are unchanged.
Packaged DNR denies cover extension-initiated requests before background/UI
JavaScript runs. Session allowances cover background and UI. When Chrome exposes
`RuleConditionKeys.TOP_DOMAINS` (145+), background initialization also installs
top-frame denies before starting controllers and Snap sandboxes. Older browsers
never receive rules containing unsupported conditions. Ordinary websites are
unaffected. Firefox behavior is unchanged.

Before onboarding, remote requests are blocked. Selecting social login permits
its authentication, TOPRF and geolocation domains until completion, reset, failure
or closure of the last UI. This selection is transient. After onboarding, access
is unrestricted except for SRP wallets with Basic Functionality disabled: only
saved RPC and saved failover domains (including their subdomains) are permitted.
A linked social profile does not exempt an SRP wallet.

OAuth and TOPRF preloading still run in parallel. The background preload handler
waits for the selected social flow's DNR allowances, rather than the OAuth result.

`updateNetworkRequestDomains('*' | string[])` updates browser allowances. Existing
wallet state changes automatically recompute them; await the function when the
caller needs confirmation. This is an asynchronous privacy backstop, not a
dependency security boundary. It does not cancel requests already in flight or
make controller mutations atomic with browser rule updates. Unsaved RPC validation
must explicitly acquire a temporary allowance if its URL is otherwise blocked.

Background code can use a scoped allowance without changing the wallet policy:

```typescript
import * as networkPolicy from './network-request-policy';

const result = await networkPolicy.withTemporaryAllowance(url, async () => {
  const response = await fetch(url, { redirect: 'error' });
  return await response.json();
});
```

The helper awaits installation before calling the callback and awaits revocation
in `finally`, returning the callback result. It accepts absolute HTTP(S) URLs
without credentials, ignores fragments, and matches the exact normalized URL
(including case-sensitive paths, ports and query strings). Other matching
extension requests can also use that allowance while it is active. Independent
rules support up to 32 overlapping operations without replacing the current
wallet policy. Await all related work inside the callback; a callback that never
settles keeps its allowance until background initialization clears it. There is
no independent expiry or cancellation of requests already in flight.

This helper requires the initialized Chrome background context. Importing it in
the UI does not create a background connection. RPC validation call sites do not
yet use this helper.

On Chrome 123–144, opaque Snap sandbox traffic and other child frames with a
different initiator are outside this backstop. Chrome 145+ adds top-frame coverage;
opaque Snaps retain it only while Chrome associates them with the extension's
top-level document. This is the same attribution limitation as before; broad
browser-wide rules are not used to compensate. Privileged rule tampering,
page-origin requests and browser-owned OAuth navigation remain outside this scope.
Test builds allow localhost for fixtures and the test socket. Production packages
must use their actual signing ID; other stores need a corresponding build mapping.

Selenium stays on Chrome 126. Native Chrome 145+ top-frame/Snap enforcement has
no automated browser coverage in this PR; rule-generation unit tests remain.
Browser verification of that coverage is manual for now.
