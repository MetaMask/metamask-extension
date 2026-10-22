# Useful Screen Ready

`Useful Screen Ready` (`ui.screen.performance`) measures initial document
navigation (`performance.timeOrigin`) to committed useful content, followed by
two animation frames. This is a paint opportunity proxy, not an actual paint timestamp.

The shared lifecycle and API do not emit screen results on their own. Unlock,
Home, and transaction confirmation add readiness signals in separate page integrations.

## Screen API

Call `useUsefulScreenReady(screen, ready)` in a component whose commit includes
the useful screen content. The JSX equivalent, `<UsefulScreenReady screen="unlock"
ready={ready} />`, supports the existing class-based Unlock screen.

| Screen         | Readiness                                                                                      |
| -------------- | ---------------------------------------------------------------------------------------------- |
| `unlock`       | Onboarded password/passkey form, without lockout, submission, or a blocking Unlock modal.      |
| `home`         | Tokens list or legitimate empty state, committing with the account overview.                   |
| `confirmation` | Transaction details with a type and transaction parameters, committing with the action footer. |

No network refresh, password input, animation, simulation, security check, or
approval-button enabling is required. Existing approval validation is unchanged.
Other initial Home tabs, unsupported account types, signatures, and
non-transaction approvals are outside v1. An empty Tokens list for a supported
account is included; the unsupported-account screen without a Tokens tab is not.
Keep the marker with the useful content if introducing separate Suspense boundaries.

## Measurement contract

- At most one sample per document. Initial wallet state is captured before React
  renders; a later Home visit after unlocking is excluded.
- Startup `REPLACE` redirects are allowed. Subsequent `PUSH`/`POP`, unsupported
  routes, hidden documents, and page close abandon measurement. Unmounting or
  becoming unready cancels a pending report.
- Once the confirmation URL identifies the first request, replacing it with a
  different request or Home abandons measurement, even for `REPLACE` navigation.
  Resolving an ID-less startup URL or redirecting the same request is allowed.
  Request identity is kept local and is never attached to telemetry.
- Visibility and page-close tracking starts before background initialization.
  Where supported, buffered `visibility-state` entries also exclude documents
  hidden before the UI bundle ran. Other browsers use the current visibility
  state and subsequent events; visibility before script execution is unknown.
- Documents that start automatic passkey authentication are excluded for all
  outcomes: success, failure, cancellation, and subsequent password fallback.
  This keeps authentication/user-interaction time out of form readiness and
  avoids sampling only the automatic attempts that leave Unlock visible.
  The existing `AppUnlocked` event measures successful authentication duration.
  Manually initiated passkey authentication still suppresses pending readiness
  while authentication or the troubleshooting modal is active.
- Create and immediately end the span when ready, backdating to document navigation.
  Abandoned loads produce no successful sample or incomplete span.
- Compare p50/p95 within matching `screen`, `wallet.ui_type`, `wallet.unlocked`,
  `ui.background_initialized_before_navigation`, release, and browser cohorts.
  Additional tags: `ui.navigation=document` and `ui.readiness_version=1`.
- Background warmness uses the timestamp on the existing
  `BACKGROUND_INITIALIZED` message: before navigation=true, afterward=false,
  not received=unknown. No new RPC or wait. Initial wallet state is the state
  received at UI startup, not necessarily the exact navigation instant.
- Default sampling is 0.1%, with existing consent, remote overrides, and ceilings.

Merge trace plumbing, then instrumentation, and collect a production baseline
before optimizations. Live Sentry ingestion/dashboard availability must be verified
after deployment. This metric covers completed foreground loads, not abandonment
or failure rates; async enrichment can update content after readiness.
