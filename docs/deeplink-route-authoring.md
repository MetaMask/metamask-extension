# Deeplink Route Authoring

Extension deeplinks are `Route` objects in `shared/lib/deep-links/routes/`, parsed and
verified by a security boundary that a feature team does not own. This document covers adding
a route. It does not cover changing how links are parsed, verified, or gated, which is a
different task with a different reviewer.

## What a feature team owns, and what pulls in Security

`.github/CODEOWNERS` draws the line, and it is mechanical rather than a judgment call:

| Path | Owner |
|---|---|
| `shared/lib/deep-links/routes/<route-name>.ts` | the feature team |
| `shared/lib/deep-links/routes/index.ts` | the feature team (registration only) |
| `shared/lib/deep-links/routes/route*` | `@MetaMask/extension-security-team` |
| `shared/lib/deep-links/parse*`, `verify*`, `utils*`, `security-policy*` | `@MetaMask/extension-security-team` |
| `app/scripts/lib/deep-links/deep-link-router.ts` | `@MetaMask/extension-security-team` |
| `ui/helpers/utils/resolve-deep-link-href*`, `ui/pages/deep-link/` | `@MetaMask/extension-security-team` |

`@MetaMask/extension-security-team` is the security owner for this boundary in the extension.
A change that reaches any path they own is no longer adding a route. Stop and read the next
section before writing the diff.

Two consequences of how CODEOWNERS resolves, both easy to hit on a first route:

- **The last matching rule wins, and the `route*` rule is late in the file.** A route file
  named `route-something.ts` matches `routes/route*` and is owned by Security, not by the
  feature team, whatever an earlier per-team line says. Do not begin a route filename with
  `route`.
- **A destination with no existing constant is not a route-only change.** The constants a
  handler returns, such as `SETTINGS_ROUTE` and `SHIELD_PLAN_ROUTE`, are declared in
  `shared/lib/deep-links/routes/route.ts`, which `routes/route*` places under Security. Adding
  one crosses the boundary, so raise it before writing the diff rather than after.

## The interstitial is not the feature team's to weaken

`AGENTS.md` rule 17, verbatim:

> **DEEPLINK INTERSTITIAL SECURITY — EXTREMELY HIGH RISK:** Before implementing any change
> that can cause fewer deep links to show the security interstitial, agents **MUST stop and
> obtain explicit, documented consent from `@MetaMask/extension-security-team`**. Without
> documented Security approval, do not make the change—even when it appears necessary to
> complete another feature, migration, refactor, or test fix.

`security-policy.ts` carries the same instruction in its header, addressed to agents
specifically: *"Do not add bypasses, route or asset allowlists, remote lookups, or broader
trusted sources in pursuit of another task."*

Both are hard stops. "The feature needs it" is the case they were written for.

## Security model, extension specifics

This section records what the boundary does in this repository. It is not a complete
description of the deeplink trust model, and the files that implement it are owned by
`@MetaMask/extension-security-team`.

**A trusted origin is checked before the signature is.** `shouldShowDeepLinkInterstitial`
returns `false` for a request origin in `TRUSTED_WEB_ORIGINS`, today exactly
`https://metamask.io` and `https://app.metamask.io`, ahead of any signature check. A link
initiated from either origin reaches the route's destination unsigned and unwarned.
Registering a route inherits that. The behavior is unchanged, the reachable destination is
new.

**Unsigned links forward every parameter.** `canonicalize` keeps only the `sig_params`
allowlist for signed links. With no `sig_params` it takes a backward-compatibility branch and
forwards every param except `sig`. A handler reached on the unsigned path receives arbitrary
caller-controlled parameters.

These are the extension's specifics, not the whole trust model. The cross-client rules, and the
defects that recur in review of both clients, are in the `deeplink-handler` skill, installed at
`.agents/skills/mms-deeplink-handler/SKILL.md` by `yarn skills`. The files implementing any of
this are owned by `@MetaMask/extension-security-team`, per the table above.

## Adding a route

**1. Write the route file.** `shared/lib/deep-links/routes/<name>.ts`:

```ts
import { Route, SETTINGS_ROUTE, SHIELD_PLAN_ROUTE } from './route';

export const SHIELD_QUERY_PARAMS = {
  showShieldEntryModal: 'showShieldEntryModal',
};

export const shield = new Route({
  pathname: '/shield',
  getTitle: (_: URLSearchParams) => 'deepLink_theTransactionShieldPage',
  handler: function handler(params: URLSearchParams) {
    const shouldShowShieldEntryModal =
      params.get(SHIELD_QUERY_PARAMS.showShieldEntryModal) === 'true';

    if (shouldShowShieldEntryModal) {
      // link to settings page and show the shield entry modal
      return { path: SETTINGS_ROUTE, query: params };
    }

    return { path: SHIELD_PLAN_ROUTE, query: params };
  },
});
```

This is `shared/lib/deep-links/routes/shield.ts` as it stands on `main`, condensed only in
its return statements. The branch is the point: the destination depends on a parameter the
handler read, which is what distinguishes validating a parameter from using one.

`getTitle` returns an **i18n message key**, not a display string. `handler` returns a
`Destination`, either `{ path, query }` or `{ redirectTo: URL }`, and may throw if the params
cannot be processed.

**2. Register it** in `shared/lib/deep-links/routes/index.ts`: import the route and call
`addRoute(<route>)`. That call is what makes the destination reachable, and `addRoute` throws
in `DEBUG` builds if two routes claim the same pathname.

**3. Add an E2E test.** Not optional. From review on
[#38003 (add deep link for settings page)](https://github.com/MetaMask/metamask-extension/pull/38003): *"We always need e2e
tests for these routes (I'm sure some teams are slipping by without adding them, but they
aren't supposed to!)"*

**4. Add the CODEOWNERS entry** for the route file if the feature team owns the surface,
following `routes/perps.ts @MetaMask/perps`.

A proposed decision record would change this procedure.
`decisions/core/0020-shared-deeplink-registry.md` (proposed, MetaMask/decisions#149) proposes
a shared registry package as the single source of truth for the public deeplink contract, and
names the `addRoute(...)` registration in `shared/lib/deep-links/routes/index.ts` as the
pattern it intends to replace. It carries the status `Proposed`, has drawn no reviews, and
states its own approval criteria as unmet. The four steps above are current practice.

## Not documented here

Four things a route author may need that this document does not establish:

- What a user sees when a handler throws.
- What happens when an incoming link matches no registered route.
- Whether a pathname, once shipped, can be changed or removed.
- Naming rules for a new public pathname.

Each is decided outside this document. Absence here is not evidence that any of them is
unconstrained.

## Key Files

| File | Purpose |
|---|---|
| `shared/lib/deep-links/routes/` | Route definitions, one file per route. |
| `shared/lib/deep-links/routes/index.ts` | Route registration. A route is unreachable until it is added here. |
| `shared/lib/deep-links/routes/route.ts` | The `Route` class and the internal destination constants a handler returns. Owned by Security. |
| `shared/lib/deep-links/security-policy.ts` | Security boundary policy, carrying the header instruction quoted above. Owned by Security. |
| `app/scripts/lib/deep-links/deep-link-router.ts` | Deeplink routing. Owned by Security. |
| `ui/pages/deep-link/` | Deeplink UI surface. Owned by Security. |
| `.github/CODEOWNERS` | The ownership line quoted above. |
| `AGENTS.md` | Carries rule 17. Owned by Security. |

