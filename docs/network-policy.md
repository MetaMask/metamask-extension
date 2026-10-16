# Network request backstop

Chrome MV3 requires Chrome 145 and `declarativeNetRequestWithHostAccess`;
existing host permissions are unchanged. Packaged DNR denies cover the extension's
initiator and top-level document. Session allowances cover background and UI.
Ordinary websites are unaffected. Firefox behavior is unchanged.

Before onboarding, remote requests are blocked. Selecting social login permits
its authentication, TOPRF and geolocation domains until completion, reset, failure
or closure of the last UI. This selection is transient. After onboarding, access
is unrestricted except for SRP wallets with Basic Functionality disabled: only
saved RPC and saved failover domains (including their subdomains) are permitted.
A linked social profile does not exempt an SRP wallet.

`updateNetworkRequestDomains('*' | string[])` updates browser allowances. Existing
wallet state changes automatically recompute them; await the function when the
caller needs confirmation. This is an asynchronous privacy backstop, not a
dependency security boundary. It does not cancel requests already in flight or
make controller mutations atomic with browser rule updates. New unsaved RPC
validation can be blocked in privacy mode; no temporary bypass is provided.

Opaque Snaps need Chrome 145 `topDomains` and retain coverage only while Chrome
associates them with the extension's top-level document. Privileged rule tampering,
page-origin requests and browser-owned OAuth navigation remain outside this scope.
Test builds allow localhost for fixtures and the test socket. Production packages
must use their actual signing ID; other stores need a corresponding build mapping.
