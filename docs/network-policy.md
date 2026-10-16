# Extension network policy

This implementation is under review. Browser request enforcement replaces the
discarded global `fetch` wrapper POC; it is not a claim that every browser network
channel is contained or that the change is ready for production. Enforcement is
implemented for Chrome MV3 only. Firefox keeps its existing networking behavior;
Firefox enforcement is deferred and the domain configuration action explicitly
rejects as unsupported there.

## Enforcement and scope

Chrome MV3 requires Chrome 145 or newer; this minimum-version change is approved
for this implementation. Packaged DNR block rules cover remote
HTTP(S) and WebSocket requests using two separate scopes: the extension ID in
`initiatorDomains`, and the extension ID in `topDomains`. The second scope covers
requests associated with an extension top-level document even when a child frame
has an opaque origin. Allow rules use both scopes too. These rules must never be
published without an extension scope. Ordinary website traffic is outside this
policy. See [Chrome's rule conditions](https://developer.chrome.com/docs/extensions/reference/api/declarativeNetRequest#type-RuleCondition).

The Snaps sandbox has an opaque origin, so extension-ID initiator matching alone
can miss its requests. Chrome 145's `topDomains` scope covers requests associated
with the outer extension document, including opaque sandbox children. This
coverage depends on the browser retaining that frame association; it does not
identify extension ownership for arbitrary ordinary-page contexts. Native
`fetch` acquired from a fresh iframe or Worker still passes through browser
enforcement. Chrome 145 tests cover actual opaque Snap-frame fetches. The
packaged runner separately prevents native Blob Workers, so the Worker probe
uses an allowed remote opaque child with the same extension top-frame association
and verifies both allowed and blocked requests. Additional Worker probes ran on
Chromium 147 and 155.

The packaged Chrome deny rules remain enabled. Higher-priority session allow
rules express the current policy; updating them uses one atomic browser API call.
Session rules disappear on browser restart or extension update. On a service
worker restart, bootstrap removes stale session grants before loading background
application consumers. The build derives the packaged rule scope from the
effective manifest key or the published distribution ID, and runtime verifies it
matches the installation. Test builds have fixed local fixture/socket exceptions
which normal production packages do not include.

Keyless production packages default to their published Chrome Web Store ID for
the selected build type. A store that signs the extension with a different ID,
including a separate Opera or Edge distribution, requires its own package built
with `NETWORK_POLICY_EXTENSION_ID=<that-store-extension-id>`. The value must be
one 32-character ID containing only lowercase `a` through `p`; it replaces the
Chrome Web Store default and must agree with `manifest.key` when one is present.
Never reuse the Chrome ZIP for a different signing ID or add several IDs to the
rules. Unknown or re-signed packages need an explicit matching ID. A mismatch
between the installed ID and packaged rules fails background startup closed;
that runtime check cannot correct an incorrectly scoped packaged startup rule.

The background captures browser enforcement before starting application network
consumers. Its coordinator owns policy and temporary grants through private
function references. Neither `globalThis` nor a general runtime-message handler
exposes a new policy mutation API.

This delivery retains the existing dependency privileges, Sentry bootstrap, and
LavaMoat runtime. Privileged extension code can still change or remove DNR rules,
or navigate the validation tab. DNR enforcement is not tamper protection against
such code. That hardening remains separate in the existing
[Sentry/MV3 LavaMoat draft](https://github.com/MetaMask/metamask-extension/pull/45331),
which is blocked on a Sentry release and a LavaMoat bug being addressed separately.

Chrome's `identity.launchWebAuthFlow` starts browser-owned navigation without an
extension initiator or top domain, so these rules cannot identify it as an
extension request. The existing OAuth launcher, provider redirects, and resources
inside that auth session remain outside this DNR scope. Selecting a social path
opens only its reviewed destinations for ordinary extension requests; it does not
add browser enforcement to the browser-owned authentication window.

## Product policy

Persisted controller state remains the source of truth. Onboarding, preferences,
and network controllers determine the product mode;
`NetworkPolicyController.postOnboardingNetworkDomains` stores the general
post-onboarding domain policy as `'*'` (the default) or an exact-hostname list.
The trusted Chrome UI action `configurePostOnboardingNetworkDomains(domains)`
replaces that list and resolves after browser enforcement is active. Live changes also
reconcile through controller subscriptions; no mutable global policy API exists.

| State                                                         | Ordinary extension requests                                                               |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Onboarding incomplete                                         | Remote requests blocked.                                                                  |
| User explicitly selects Google, Apple, or Telegram onboarding | Only the selected path's configured authentication, TOPRF, and geolocation hosts allowed. |
| Onboarding complete; SRP wallet; Basic Functionality disabled | Only exact saved RPC request URLs and saved failover URLs allowed.                        |
| Other completed onboarding states                             | Configured post-onboarding domains allowed; `'*'` permits all remote destinations.        |

Social onboarding authorization is transient. OAuth waits for browser rules before
starting authentication, TOPRF discovery, or geolocation. The grant remains for
the selected path's backup/restore steps and is revoked on terminal failures,
reset, onboarding completion, or closure of the last trusted UI connection.
Persisted social flow selections never restore the grant after restart.

Linking a social profile to an SRP wallet does not exempt it from the SRP privacy
policy. Only an explicit completed social onboarding flow gets the seedless
exemption; missing onboarding history or residual social authentication does not
broaden privacy-mode access. Infura placeholders resolve using this build's
project ID. Domain entries are exact hostnames, without implicit subdomains;
RPC entries preserve path and
query matching. Credentials move into HTTP headers and URL fragments are not part
of the request URL. Automatic failover is disabled when its destinations are not
in the saved RPC policy, including unapproved QuickNode destinations.

Onboarding, Basic Functionality, and network configuration changes reconcile the
browser rules. Trusted mutation APIs await enforcement before reporting success.
Invalid policies, unsupported regexes, and browser update failures trigger a
blocked recovery policy and propagate an error; they never intentionally retain
broader access.

## Validating a new RPC

Both network forms use the trusted background validation service. It opens a
temporary inactive extension tab, authenticates its one-shot port, and grants only
that tab access to the candidate's exact URL for POST/OPTIONS XHR requests. It
rejects validation before onboarding and cancels grants racing a policy closure.
Those temporary DNR grants apply on Chrome; Firefox uses the same fixed validator
without DNR authorization and retains its existing network access.

The dependency-free validation page sends only a fixed `eth_chainId` JSON-RPC
request. It omits cookies and referrers, rejects redirects, bounds response size
and time, and returns only a validated chain ID or sanitized error metadata. The
service closes the tab and removes the grant on success, error, timeout, or
disconnect. It does not expose arbitrary request bodies, fetch options, raw
responses, or a shared background/UI exception.

## Boundaries and release gates

Content-script requests belong to the visited page's origin in Chrome. The current
first-party content-script entry, stream handlers, and cashtag resolver use
background messages rather than direct remote fetches; cashtag data requests run
in the background. A newly introduced direct content-script request or page-world
request is not contained by these extension-scoped rules. Preserve that routing
and audit dependency capabilities; never address this limitation by blocking the
visited website's traffic. See [Chrome's content-script request guidance](https://developer.chrome.com/docs/extensions/develop/concepts/network-requests).

This policy covers Chrome browser request types matched by DNR.
Its trusted computing base includes the existing UI, controller, approval, and RPC
transport paths. It does not address arbitrary compromise of packages exercising
those administrative capabilities. Enforcement checks request destinations; it
does not sanitize bodies, headers, or metadata sent to an approved destination.
It does not establish controls for WebRTC data channels, native messaging hosts,
other extensions, or arbitrary activity deliberately moved into ordinary website
contexts. Browser APIs that can create or execute such contexts remain part of
the capability review. Existing connections and requests already sent are not
retroactively undone by a policy change.

Chrome adds only `declarativeNetRequestWithHostAccess`, using existing host
permissions. It adds neither `declarativeNetRequest`,
`declarativeNetRequestFeedback`, nor new host patterns. Chrome documents this
permission as appropriate for existing host access without an additional warning.
See [Chrome's DNR permissions](https://developer.chrome.com/docs/extensions/reference/api/declarativeNetRequest#permissions).

Before release, require identical before/after permission-warning sets and a
signed update test from the production extension showing no new acceptance
prompt, extension disablement, or required user action. Chrome 145 compatibility,
onboarding and privacy flows, restart/update behavior, iframe and
worker bypass attempts, redirects, validation cleanup, and unaffected ordinary
browsing also require browser verification. Unit tests alone do not satisfy these
release gates.

Firefox parity is a separate follow-up. Real Firefox 148 probes confirmed that
workers created by an opaque packaged iframe in the tab-less background can omit
extension origin and ancestor metadata from blocking `webRequest` events. A
manifest `worker-src 'none'` declaration did not prevent those requests in that
probe. This implementation does not ship a Firefox listener or claim to contain
that traffic.
