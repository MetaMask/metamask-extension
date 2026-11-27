# Braze identity

Braze identifies users with the primary SRP's Profile Sync canonical profile
ID (`external_id`, matching Mobile). `@braze/web-sdk` runs inside the hidden
preinstalled snap
([`@metamask/braze-snap`](https://github.com/MetaMask/internal-snaps/tree/main/packages/braze-snap)),
so no extension document or extension dependency includes Braze code.

## Gates (`BrazeService` + `shared/lib/braze.ts`)

| State | Action |
| --- | --- |
| Onboarding incomplete, Basic Functionality off, or both MetaMetrics & marketing off | `clear`: stop the snap and clear its unencrypted state (0 network calls; defers if `Installing`) |
| Locked, auto-sign-in pending, missing profile ID, or no UI document open (`!isUiOpen`) | `keep`: leave persisted Braze state intact so background wakeups never start sessions |
| Unlocked, signed in, canonical profile ID present, either consent on, and UI open | `identify`: send `syncUser` (`profileId`, ISO 639-1 `language`, `config`), retrying if `flushed: false` |

- Builds without `BRAZE_WEB_API_KEY` and `BRAZE_SDK_ENDPOINT`, and test builds (`IN_TEST`), omit the preinstalled snap and skip registering `BrazeService`.
- See `@metamask/braze-snap` README for the snap threat model and unencrypted storage details.

Pull requests modifying the `@metamask/braze-snap` version, the params sent by `braze-service.ts`, the snap ID, origin, or clear path require review from `@MetaMask/engagement` and snap owners.
