# Network request backstop

Chrome MV3 keeps its Chrome 123 minimum and host permissions, adding
`declarativeNetRequestWithHostAccess`. Packaged rules block extension requests
before JavaScript runs. Native `RuleConditionKeys.TOP_DOMAINS` (145+) adds frame
coverage before controllers/Snaps start; older browsers receive no unsupported
conditions. Websites and Firefox are unaffected.

Before onboarding, selecting social login permits authentication, TOPRF and
geolocation domains until completion, reset, failure or last-UI closure. OAuth
and TOPRF preload run in parallel after policy installation. After onboarding,
access is unrestricted except SRP wallets with Basic Functionality disabled:
only saved RPC/failover domains, including subdomains and all paths/ports, work.
Linking a social profile does not exempt SRP. Wallet state recomputes policy;
await `updateNetworkRequestDomains('*' | string[])` for browser confirmation.
Updates neither cancel in-flight requests nor make controller mutations atomic.

UI/background callers can allow an exact URL even if background startup fails:

```typescript
import * as networkPolicy from '../../../shared/lib/network-request-policy';
const result = await networkPolicy.withTemporaryAllowance(url, async () => {
  const response = await fetch(url, { redirect: 'error' });
  return await response.json();
});
```

The helper awaits installation and revocation in `finally`. HTTP(S) URLs reject
credentials, ignore fragments, and match normalized paths/ports/queries exactly,
including case. Other matching requests share the grant. Up to 32 concurrent or
nested operations have independent rules; a Web Lock serializes allocation and
installation only. Await all callback work. Pass `{ signal }` to cancel acquisition
and pass it to fetch to cancel the request. No grant expires automatically: crashes
or unsettled callbacks retain it until background initialization/session end.
Initialization clears active grants too, possibly interrupting concurrent work.
Firefox calls the callback directly. User-selected RPC validation grants only
the probed URL. Network addition grants its RPC/failover URLs until the operation
finishes and Chrome confirms the saved-network policy.

Consented critical-error reporting permits only the configured Sentry envelope URL
and rejects redirects. One two-second deadline covers acquisition, installation,
fetch and cleanup, cancelling acquisition and aborting fetch so restart/repair
proceed. Native DNR updates cannot be cancelled: late grants are revoked without
reporting, and cleanup can finish after the deadline.

Chrome 123–144 miss opaque Snaps and frames with different initiators. Chrome 145+
covers opaque Snaps only while their extension top-frame association survives.
Privileged rule tampering, page-origin requests and browser-owned OAuth navigation
remain outside this privacy backstop; it is not a dependency security boundary.
Test builds allow localhost; production requires the actual signing ID and other
stores need build mappings. Selenium stays Chrome 126: Chrome 145+/Snap browser
verification is manual; rule-generation unit coverage remains automated.
