# Useful Screen Ready

`Useful Screen Ready` (`ui.screen.performance`) measures initial document
navigation (`performance.timeOrigin`) to committed useful content, followed by
two animation frames. This is a paint opportunity proxy, not an actual paint timestamp.

## Screen API

Call `useUsefulScreenReady(screen, ready)` in a component whose commit includes
the useful screen content. The JSX equivalent, `<UsefulScreenReady screen="unlock"
ready={ready} />`, supports the existing class-based Unlock screen.

| Screen | Readiness |
| --- | --- |
| `unlock` | Onboarded password/passkey form, without lockout, submission, or a blocking Unlock modal. |
| `home` | Tokens list or legitimate empty state, committing with the account overview. |
| `confirmation` | Transaction details with a type and transaction parameters, committing with the action footer. |

No network refresh, password input, animation, simulation, security check, or
approval-button enabling is required. Existing approval validation is unchanged.
Other initial Home tabs, signatures, and non-transaction approvals are outside v1.
Keep the marker with the useful content if introducing separate Suspense boundaries.

## Measurement contract

- At most one sample per document. Initial wallet state is captured before React
  renders; a later Home visit after unlocking is excluded.
- Startup `REPLACE` redirects are allowed. Subsequent `PUSH`/`POP`, unsupported
  routes, hidden documents, and page close abandon measurement. Unmounting or
  becoming unready cancels a pending report.
- Create and immediately end the span when ready, backdating to document navigation.
  Abandoned loads produce no successful sample or incomplete span.
- Compare p50/p95 within matching `screen`, `wallet.ui_type`, `wallet.unlocked`,
  `ui.background_initialized_before_navigation`, release, and browser cohorts.
  Additional tags: `ui.navigation=document` and `ui.readiness_version=1`.
- Background warmness uses an optional timestamp on the existing
  `BACKGROUND_INITIALIZED` message: before navigation=true, afterward=false,
  missing/invalid=unknown. No new RPC or wait. Initial wallet state is the state
  received at UI startup, not necessarily the exact navigation instant.
- Default sampling is 0.1%, with existing consent, remote overrides, and ceilings.

Merge trace plumbing, then instrumentation, and collect a production baseline
before optimizations. Live Sentry ingestion/dashboard availability must be verified
after deployment. This metric covers completed foreground loads, not abandonment
or failure rates; async enrichment can update content after readiness.
