# Useful Screen Ready

`Useful Screen Ready` (`ui.screen.performance`) measures an initial document
load from `performance.timeOrigin` to the first supported screen's committed
useful content, followed by two animation frames. The endpoint is a paint
opportunity proxy; it is not a browser-reported paint timestamp.

## Readiness contract (version 1)

| Screen tag | Required sections | Does not wait for |
| --- | --- | --- |
| `unlock` | The onboarded wallet's password or passkey form is committed, without a lockout, submission, or blocking Unlock modal. An empty password is valid; the submit button remains disabled until input is valid. | Password entry, authentication, mascot animation. |
| `home` | Account overview controls and the Tokens list (including a legitimate empty state) are committed for the same selected account group and network generation. | Fresh balances, prices, token images, or other network refreshes. |
| `confirmation` | Transaction request information and its action area are committed for the same request ID. Request data must include its transaction parameters. | Simulation, security checks, gasless quotes, or enabling the approval button. |

This is an initial content metric. Confirmation validation, security checks,
button disabling, and approval behavior retain their existing logic. Signature
and other approval types are outside this first transaction readiness contract.
Home loads that start on other asset tabs do not satisfy the Tokens contract.

## Lifecycle

- Emit at most once per document, with the wallet state captured before React
  rendering. A later Home visit after unlocking is not an initial unlocked load.
- Allow startup router `REPLACE` redirects. Withdraw the previous route's signals
  so a transient Home commit cannot complete a confirmation startup.
- Abandon a measurement on a subsequent `PUSH`/`POP`, an unsupported route, a
  hidden document, or page close. A section unmount cancels a pending endpoint.
- Require matching local account/request generations. IDs stay local and are
  never attached to the transaction or tags.
- Create and immediately end the Sentry span only when readiness completes,
  backdating its start to navigation. Unsupported or abandoned starts emit no
  unfinished span and are not included as successful readiness samples.
- Development StrictMode effect replay and ordinary rerenders cannot emit twice.

## Querying production results

Filter Sentry transactions by `Useful Screen Ready`, then compare p50/p95 duration
in milliseconds within matching cohorts:

- `screen`: `unlock`, `home`, or `confirmation`.
- `wallet.ui_type`: popup, notification, sidepanel, or fullscreen.
- `wallet.unlocked`: state received during initial UI startup.
- `ui.background_initialized_before_navigation`: true when background controller
  initialization completed before this document's navigation origin; false when
  it completed afterward; `unknown` if timing metadata is unavailable.
- `ui.navigation`: `document`.
- `ui.readiness_version`: `1`.
- Sentry's existing release, environment, and browser fields.

Background warmness comes from an optional timestamp on the existing
`BACKGROUND_INITIALIZED` port message. It adds no RPC or initialization wait.
Missing or malformed timestamps must not be classified as warm. The initial
wallet state is received after initialization; it is not a measurement of state
at the exact navigation instant.

The default sampling rate is 0.1%, subject to existing remote overrides, ceilings,
and MetaMetrics consent. Screen and cohort tags are set directly on this trace's
isolated Sentry scope; they do not depend on child startup tags propagating.

Merge the trace plumbing PR first, then this instrumentation, and collect a
production baseline before the loading optimizations ship. Local tests exercise
the Sentry adapter and duration/tag contract. Live ingestion and dashboard
availability must be verified in the deployed release. Do not add the quantiles
of `UI Startup` and `Homepage Ready`: this trace measures the complete duration
from a shared navigation origin.

Network data already available in the store is used for initial content. Existing
balance-loading behavior can still affect what Home displays, and asynchronous
confirmation enrichment can update details afterward. Measure those phases
separately if needed. This metric describes completed, foreground, supported
loads; it does not measure the rate of startup failures or abandoned loads.
