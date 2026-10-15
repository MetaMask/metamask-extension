# OAuth Provider Login Instrumentation Plan

## Status

Current step: **13 — Analyze data after rollout**

Status markers:

- `[ ]` Not started
- `[-]` In progress
- `[x]` Completed
- `[~]` Blocked or awaiting an external dependency

## Context

`OnboardingOAuthProviderLogin` currently spans the entire browser/provider interaction. Its duration is therefore dominated by user authentication and provider wait time rather than extension machine time.

The goal is to make the following portions independently measurable:

1. Extension-side auth-flow preparation and launch dispatch.
2. Provider interaction and user wait.
3. Redirect handling and token exchange.

The new dimensions must support Sentry segmentation by provider and fresh versus rehydration flow.

## Mobile alignment decision

The mobile repository was reviewed for an existing implementation.

Mobile already aligns with the extension on:

- The existing OAuth trace names and `OnboardingSecurityOp` operation.
- The machine-time allowlist, which includes token exchange and seedless authentication but excludes provider interaction.
- Explicit parent-context propagation from the onboarding UI into `OAuthService`.
- Tests that verify provider-login, BYOA token-exchange, and seedless-authentication spans use the supplied social-login parent.

Mobile does **not** currently split provider launch from provider interaction. Its `OnboardingOAuthProviderLogin` span still covers the complete `loginHandler.login()` call.

Scope decision:

- Implement the new launch/interaction split in the extension only.
- Follow mobile’s parent-context and existing trace-taxonomy conventions.
- If the new trace names must become a shared cross-platform CUF taxonomy, create a coordinated mobile change rather than silently diverging the dashboards.

## Proposed instrumentation contract

- Preserve `OnboardingOAuthProviderLogin` initially as the historical aggregate span.
- Add separate spans for:
  - `OnboardingOAuthProviderLaunch`
  - `OnboardingOAuthProviderInteraction`
- Defer `OnboardingOAuthRedirectHandling` until implementation review shows that redirect work is materially significant.
- Use the following tags on OAuth-related spans:
  - `provider`: `google`, `apple`, or `telegram`
  - `is_rehydration`: `true`, `false`, or `unknown`
- Pass the optional serialized parent context from the onboarding UI through the thunk and RPC boundary into `OAuthService`, following the mobile pattern.
- Use that supplied context for the provider, token-exchange, seedless-authentication, and error spans. Do not make the background service infer a parent by trace name.
- Include only machine-time spans in `MACHINE_TIME_TRACE_NAMES`. Do not include provider interaction time.

Important boundary limitation: `launchWebAuthFlow` does not expose a browser event for “popup rendered.” The launch span can measure URL construction and API handoff, but not distinguish popup rendering/network time from provider-side wait.

## Implementation steps

### 1. Confirm trace names, boundaries, and compatibility policy

Status: `[x]`

- Preserve `OnboardingOAuthProviderLogin` as the historical aggregate span.
- Add diagnostic child spans without changing the existing aggregate p90 semantics.
- Use mobile-aligned parent-context propagation.
- Use `provider` and `is_rehydration` as the shared dimensions.
- Compare span distributions at the trace level; do not add p90 values together.
- Defer a standalone redirect-handling span for the first iteration. The existing token-exchange span remains the measurement for redirect parsing and token exchange unless implementation review shows that redirect work is materially significant.

Review checkpoint: completed based on the agreed metric contract.

### 2. Add the new trace names

Status: `[x]`

File:

- `shared/lib/trace.ts`

Tasks:

- Add the launch trace name.
- Add the provider-interaction trace name.
- Do not add a standalone redirect-handling trace name in the first iteration.

Review checkpoint: completed; names are stable and no span behavior changed.

### 3. Define the shared OAuth trace dimensions

Status: `[x]`

Files:

- `app/scripts/services/oauth/types.ts`
- `app/scripts/services/oauth/oauth-service.ts`
- `ui/store/actions.ts`

Tasks:

- Define a consistent conversion from `boolean | null` rehydration state to the string values `true`, `false`, or `unknown`.
- Use `is_rehydration` rather than introducing a second flow-dimension vocabulary.
- Reuse the same tag keys and values across background and UI spans.
- Avoid including credentials, email addresses, authorization codes, or redirect URLs.

Review checkpoint: completed; the shared model maps only provider and rehydration state. Consumers will be added in steps 4–5.

### 4. Tag existing background OAuth spans

Status: `[x]`

Files:

- `app/scripts/services/oauth/oauth-service.ts`
- `app/scripts/services/oauth/oauth-service.test.ts`

Tasks:

- Add `provider` and `is_rehydration` tags to `OnboardingOAuthProviderLogin`.
- Add `provider` and `is_rehydration` tags to `OnboardingOAuthBYOAServerGetAuthTokens`.
- Preserve existing success and failure data.

Review checkpoint: completed; existing span lifecycle, names, success data, and failure handling are unchanged.

### 5. Tag seedless authentication

Status: `[x]`

File:

- `ui/store/actions.ts`

Tasks:

- Add `provider` and `is_rehydration` tags to `OnboardingOAuthSeedlessAuthenticate`.
- Keep its current relationship to the OAuth provider request and token exchange.

Review checkpoint: completed; the UI span and seedless-auth failure event use the shared normalized dimensions. Cross-boundary parenting and end-to-end consistency are covered in step 6.

### 6. Make OAuth span parenting explicit

Status: `[x]`

Files:

- `app/scripts/services/oauth/oauth-service.ts`
- `ui/store/actions.ts`
- `ui/pages/onboarding-flow/welcome/welcome.tsx`

Tasks:

- Extend the UI action/service call with an optional serialized parent context.
- Start or retain `OnboardingSocialLoginAttempt` in the onboarding UI and pass its context through the thunk and RPC boundary.
- Apply the supplied parent context to background OAuth spans, UI seedless-authentication spans, and their error spans.
- Cover both fresh login and rehydration paths.

Review checkpoint: completed; traces remain correctly parented through the UI, thunk, RPC, and background service boundaries.

### 7. Split Google and Apple timing

Status: `[x]`

File:

- `app/scripts/services/oauth/oauth-service.ts`

Tasks:

- Measure auth URL generation and `launchWebAuthFlow` dispatch as launch machine time.
- End the launch span immediately after dispatch, not after the callback.
- Measure provider interaction from handoff through the redirect callback.
- Preserve state validation and failure behavior.

Review checkpoint: completed; the launch span ends after `launchWebAuthFlow` dispatch and before the deferred provider callback completes.

### 8. Split Telegram timing

Status: `[x]`

File:

- `app/scripts/services/oauth/oauth-service.ts`

Tasks:

- Measure `openTab` and tab creation as launch machine time.
- End the launch span before waiting for tab updates.
- Measure provider interaction until the redirect tab update or cancellation.
- Preserve tab cleanup and cancellation semantics.

Review checkpoint: completed; tab creation ends the launch span before redirect waiting, while redirect success and cancellation end the interaction span and retain existing cleanup behavior.

### 9. Update onboarding machine-time aggregation

Status: `[x]`

File:

- `shared/lib/trace.ts`

Tasks:

- Add the launch span to `MACHINE_TIME_TRACE_NAMES`.
- Add redirect handling to the machine-time set if that span is introduced.
- Keep provider interaction and the historical aggregate provider span out of the machine-time set.
- Check for nested-span double counting.

Review checkpoint: completed; launch time is included, while provider interaction and the historical aggregate provider span remain excluded.

### 10. Add focused OAuth service tests

Status: `[x]`

File:

- `app/scripts/services/oauth/oauth-service.test.ts`

Cover:

- Google success.
- Apple success.
- Telegram success.
- Provider cancellation.
- Launch failure.
- Provider failure.
- Launch span ordering relative to provider interaction.
- Provider and `is_rehydration` tags.
- Explicit parent context.

Review checkpoint: completed; success, cancellation, launch failure, provider failure, timing order, tags, and parent context are covered through observable trace requests.

### 11. Update shared trace tests

Status: `[x]`

File:

- `shared/lib/trace.test.ts`

Cover:

- New trace names.
- Numeric and string tag handling where relevant.
- Machine-time inclusion of launch spans.
- Exclusion of provider interaction spans.
- No double counting when spans are nested or retried.

Review checkpoint: completed; shared trace coverage verifies launch inclusion, provider-wait and historical aggregate exclusion, and existing aggregation behavior remains covered.

### 12. Run verification and review the diff

Status: `[x]`

Commands:

```bash
yarn lint:changed:fix
yarn test:unit app/scripts/services/oauth/oauth-service.test.ts
yarn test:unit shared/lib/trace.test.ts
yarn lint:tsc
```

Tasks:

- Run the repository formatter and changed-file linting.
- Run targeted unit tests.
- Run TypeScript checks.
- Inspect the final diff for unrelated changes.

Review checkpoint: completed; changed-file linting, targeted tests, linter diagnostics, and diff review passed. TypeScript validation was attempted but is currently blocked by an unrelated existing messenger action-type error.

### 13. Analyze data after rollout

Status: `[~]`

This step requires a release containing the new instrumentation.

Tasks:

- Query the last available period segmented by provider and `is_rehydration`.
- Compare p90 for launch, provider interaction, redirect handling, BYOA token exchange, and seedless authentication.
- Compare provider-mix changes against within-provider latency changes.
- Check release, browser, and environment dimensions where available.
- Document whether the increase is extension-side, auth-server-side, provider-side, or caused by provider mix.
- Update the report watchlist and preserve accurate wait/machine-time annotations.

Important limitation: new launch and flow dimensions cannot be reconstructed for historical spans that were emitted before this instrumentation shipped.

## Acceptance criteria

- Machine-time OAuth spans are visible in Sentry.
- OAuth spans can be segmented by provider and fresh versus rehydration flow.
- Provider interaction remains distinguishable from extension machine time.
- Redirect handling and token exchange remain separately measurable.
- Parent-child relationships are correct across UI, background, RPC, and buffered-consent flows.
- Focused tests cover timing boundaries, tags, parenting, success, and failure.
- A post-rollout analysis explains the p90 movement or confirms that it is provider-side wait.
- The report watchlist accurately describes each metric’s semantics.
