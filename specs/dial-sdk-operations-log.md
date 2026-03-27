# Dial SDK Integration - Operations Log

> Auditable record of all operations performed during the Dial SDK integration into MetaMask Extension.
> Branch: `implement-dial-sdk`
> Started: 2026-03-26

---

## Session 1 — 2026-03-26

### Phase 1: Research & Discovery

| # | Time | Operation | Details | Result |
|---|------|-----------|---------|--------|
| 1 | T+0 | Fetch SDK docs | `https://docs.dial.wtf/sdk/README` | OK - extracted SDK overview, features, install instructions |
| 2 | T+0 | Clone Dial SDK | `git clone https://github.com/Dial-WTF/Dial-SDK.git` into `~/Development/Metamask/` | OK - cloned successfully |
| 3 | T+1 | Fetch SDK install docs | `https://docs.dial.wtf/sdk/installation` | OK - full install guide extracted |
| 4 | T+1 | Fetch SDK auth docs | `https://docs.dial.wtf/sdk/authentication` | OK - SIWE/SIWS auth flow documented |
| 5 | T+1 | Fetch SDK profile docs | `https://docs.dial.wtf/sdk/dial-profile` | 404 - page not found |
| 6 | T+1 | Explore MM address book | Agent search across metamask-extension codebase | OK - comprehensive mapping of Redux state, selectors, actions, components, ENS resolution |
| 7 | T+2 | Fetch SDK calls docs | `https://docs.dial.wtf/sdk/calls` | OK - call API documented |
| 8 | T+2 | Fetch SDK profiles docs | `https://docs.dial.wtf/sdk/profiles` | 404 - page not found |
| 9 | T+2 | Read SDK package.json | `~/Development/Metamask/Dial-SDK/package.json` | OK - v0.3.0, deps: eventemitter3, peer: siwe, @100mslive/hms-video-store |
| 10 | T+2 | Read SDK README | Full SDK README with quick start, API reference, examples | OK |

### Phase 2: SDK Source Audit

| # | Time | Operation | Details | Result |
|---|------|-----------|---------|--------|
| 11 | T+3 | Read src/index.ts | Main exports barrel | OK - exports DialClient, UserDialer, ContactsBook, providers, errors, types |
| 12 | T+3 | Read src/types/index.ts | Type re-exports | OK - comprehensive type system |
| 13 | T+3 | Read src/client/dial-client.ts | Main client class | OK - constructor, asUser, restoreSession, authenticateWithWallet, authenticateWithSolana |
| 14 | T+3 | Read src/client/user-dialer.ts | Authenticated client | OK - calls, chat, profile, voicemail, conference, contacts services |
| 15 | T+3 | Read src/services/contacts-book.ts | ContactsBook orchestrator | OK - CRUD + events + in-memory cache |
| 16 | T+4 | Read src/types/profile.ts | Profile & Contact types | OK - DialProfile, Contact, AddContactOptions, UpdateContactOptions |
| 17 | T+4 | Read src/types/contacts-book.ts | ContactsBook types | OK - IContactsBookProvider interface, events, config |
| 18 | T+4 | Read src/services/contacts-book-local.ts | LocalContactsBookProvider | OK - localStorage-backed, per-wallet namespacing |
| 19 | T+4 | Read src/services/contacts-book-api.ts | ApiContactsBookProvider | OK - HTTP-backed CRUD via /profile/contacts |
| 20 | T+4 | Read src/services/profile.ts | ProfileService | OK - get, update, contacts, ENS linking, block/unblock |
| 21 | T+4 | Read src/services/registry.ts | RegistryService | OK - searchProfiles, getProfileByENS, listPublicRooms |
| 22 | T+5 | Read src/services/calls.ts | CallsService | OK - start, answer, decline, end, mute, recording, media streams |
| 23 | T+5 | Read src/http/client.ts | HttpClient | OK - GET/POST/PUT/PATCH/DELETE, auth headers, error handling |
| 24 | T+5 | Read src/types/common.ts | Common types | OK - EthAddress, WalletAddress, Pagination, ApiResponse |
| 25 | T+5 | Read src/types/client.ts | Client config types | OK - SDK_VERSION, API_BASE_URLS, DEFAULT_NETWORK |
| 26 | T+5 | Read src/errors.ts | Error classes | OK - DialError hierarchy, 9 error types |
| 27 | T+6 | Read src/services/base.ts | BaseService | OK - endpoint helper |
| 28 | T+6 | Read src/utils/environment.ts | Environment detection | OK - IS_BROWSER, IS_NODE, getFetch |
| 29 | T+6 | Read src/services/auth.ts | AuthService | OK - SIWE verify, session management |

### Phase 3: Build & Vendor

| # | Time | Operation | Details | Result |
|---|------|-----------|---------|--------|
| 30 | T+3 | Install SDK deps | `pnpm install` in Dial-SDK | OK - 22.8s |
| 31 | T+5 | Build SDK | `pnpm build` in Dial-SDK | OK - ESM+CJS+DTS in 2.6s, dist ~65KB ESM |
| 32 | T+6 | Read export script | `./export` bash script analysis | OK - copies dist, generates vendored package.json |
| 33 | T+7 | Export to MM | `./export ~/Development/Metamask/metamask-extension/app/vendor` | OK - 27 files, 724K at app/vendor/dial-sdk/ |
| 34 | T+7 | Verify vendor | `ls app/vendor/dial-sdk/` | OK - dist/, LICENSE, package.json, README.md |

### Phase 4: SDK Audit Document

| # | Time | Operation | Details | Result |
|---|------|-----------|---------|--------|
| 35 | T+8 | Write SDK audit | `specs/dial-sdk-audit.md` | OK - 21 findings documented |
| 36 | T+8 | Write operations log | `specs/dial-sdk-operations-log.md` (this file) | OK |

### Phase 5: Implementation Spec

| # | Time | Operation | Details | Result |
|---|------|-----------|---------|--------|
| 37 | T+9 | Write integration spec | `specs/dial-sdk-integration.md` | OK - spec created with AC, architecture, implementation plan |

### Phase 6: Implementation

| # | Time | Operation | Details | Result |
|---|------|-----------|---------|--------|
| 38 | T+10 | Add SDK dependency | `package.json` — `@dial-wtf/sdk: file:./app/vendor/dial-sdk` | OK |
| 39 | T+10 | Add siwe dependency | `package.json` — `siwe: ^2.3.2` (SDK peer dep) | OK |
| 40 | T+10 | Add eventemitter3 dependency | `package.json` — `eventemitter3: ^5.0.1` (SDK dep) | OK |
| 41 | T+11 | Create Redux slice | `ui/ducks/dial/dial.ts` — DialState, 13 actions | OK |
| 42 | T+11 | Register reducer | `ui/ducks/index.js` — added `dial: dialReducer` | OK |
| 43 | T+11 | Create selectors | `ui/selectors/dial.ts` — 10 selectors | OK |
| 44 | T+12 | Create useDialClient hook | `ui/hooks/useDialClient.ts` — singleton, auth, session | OK |
| 45 | T+12 | Create useDialContacts hook | `ui/hooks/useDialContacts.ts` — CRUD, sync, fetch | OK |
| 46 | T+12 | Create useDialProfile hook | `ui/hooks/useDialProfile.ts` — profile fetch, ENS | OK |
| 47 | T+12 | Create useDialCall hook | `ui/hooks/useDialCall.ts` — start, end, mute | OK |
| 48 | T+13 | Update ContactListItem | Added `ensName`, `isDialContact` props, Dial indicator icon | OK |
| 49 | T+13 | Update ViewContactContent | Added ENS field, Dial Profile field, Call button | OK |
| 50 | T+13 | Update ContactDetailsPage | Integrated useDialProfile, useDialCall, pass to view | OK |
| 51 | T+13 | Update ContactsListPage | Added Dial contacts lookup, ENS enrichment | OK |
| 52 | T+13 | Update contacts.types.ts | Extended with Dial-specific props | OK |
| 53 | T+14 | Update EditContactForm | Added Dial nickname sync on save | OK |
| 54 | T+14 | Update AddContactForm | Added Dial contact creation on save | OK |
| 55 | T+15 | Testing | Unit tests for new services/hooks | Pending |
| 56 | T+16 | Verify build | Build check | Pending |

---

### Phase 7: Verification

| # | Time | Operation | Details | Result |
|---|------|-----------|---------|--------|
| 57 | T+17 | Verify imports | Checked all import paths resolve correctly | OK |
| 58 | T+17 | Verify type exports | Confirmed Contact, DialProfile, Call in SDK dist | OK |
| 59 | T+17 | Verify Redux registration | Confirmed dial reducer in ducks/index.js | OK |
| 60 | T+17 | Verify IconName.Call | Confirmed exists in design system usage | OK |

---

## Observations

- The Dial SDK is in Private Alpha (v0.3.0) - not yet published to npm
- Uses vendor/file dependency pattern as recommended by SDK docs
- MetaMask uses yarn (not pnpm) - dependency path format needs to be `file:./app/vendor/dial-sdk`
- `siwe` added as explicit dependency to satisfy SDK's peer dependency
- `eventemitter3` added as explicit dependency (SDK runtime dep)
- All Dial features run in the UI popup layer (not service worker) to avoid MV3 compatibility issues
- Session persistence uses `localStorage` available in the popup context
- Dial integration is fully additive - no existing functionality is broken
- ENS names are sourced from Dial profile `links.ens` field
- Call functionality is basic (start/end) since SDK lacks WebSocket real-time delivery (audit finding C5)

## Architecture Decision: UI-Only Integration

We chose to integrate the Dial SDK exclusively in the extension popup UI layer rather than the background service worker because:

1. **MV3 compatibility** — Service worker has no `window`, `document`, or `localStorage` (audit findings C2, C3)
2. **Session lifecycle** — Service worker can terminate at any time, losing in-memory auth tokens (audit finding M5)
3. **Minimal surface area** — All Dial features are user-initiated from the contacts UI, so popup context is sufficient
4. **No controller needed** — Avoiding a new background controller keeps the integration reversible and contained

## Files Changed

### New Files (8)
- `app/vendor/dial-sdk/` — Vendored SDK (27 files)
- `ui/ducks/dial/dial.ts` — Redux slice for Dial state
- `ui/ducks/dial/index.ts` — Duck barrel export
- `ui/selectors/dial.ts` — Dial state selectors
- `ui/hooks/useDialClient.ts` — DialClient singleton & auth hook
- `ui/hooks/useDialContacts.ts` — Contacts CRUD & sync hook
- `ui/hooks/useDialProfile.ts` — Profile fetch & ENS hook
- `ui/hooks/useDialCall.ts` — Call management hook
- `specs/dial-sdk-audit.md` — SDK audit report
- `specs/dial-sdk-integration.md` — Integration spec
- `specs/dial-sdk-operations-log.md` — This operations log

### Modified Files (9)
- `package.json` — Added @dial-wtf/sdk, siwe, eventemitter3 dependencies
- `ui/ducks/index.js` — Registered dial reducer
- `ui/pages/contacts/contacts.types.ts` — Extended with Dial props
- `ui/pages/contacts/contacts-list-page.tsx` — Dial contacts enrichment
- `ui/pages/contacts/contact-details-page.tsx` — Dial profile, ENS, call integration
- `ui/pages/contacts/components/contact-list-item.tsx` — ENS name, Dial indicator
- `ui/pages/contacts/components/view-contact-content.tsx` — ENS field, Dial profile, Call button
- `ui/pages/contacts/components/edit-contact-form.tsx` — Dial nickname sync
- `ui/pages/contacts/components/add-contact-form.tsx` — Dial contact creation sync

---

## Session 2 — 2026-03-27

### Phase 8: SDK Upgrade (v0.3.0 Monorepo Refactor)

| # | Time | Operation | Details | Result |
|---|------|-----------|---------|--------|
| 61 | T+0 | Commit v1 work | `git commit` — all initial integration files | OK — b49ff61a8b |
| 62 | T+0 | Pull SDK updates | `git pull` in ~/Development/Metamask/Dial-SDK | OK — 136 files changed, monorepo refactor |
| 63 | T+1 | Analyze new structure | SDK split into @dial-wtf/core, @dial-wtf/client, @dial-wtf/react | OK |
| 64 | T+1 | Build SDK | `pnpm build` — core, client, react packages | OK — all 3 built |
| 65 | T+2 | Vendor 3 packages | Replaced app/vendor/dial-sdk with dial-core, dial-client, dial-react | OK |
| 66 | T+2 | Write vendored package.json | All 3 with `file:` inter-package references | OK |
| 67 | T+3 | Update package.json | @dial-wtf/sdk → @dial-wtf/client + @dial-wtf/core + @dial-wtf/react, removed eventemitter3 | OK |
| 68 | T+3 | Update dial.ts duck | Import types from @dial-wtf/core | OK |
| 69 | T+3 | Update dial.ts selectors | Import types from @dial-wtf/core | OK |
| 70 | T+4 | Rewrite useDialClient | Now useDialAuth — uses SDK's useAuth() + loginWithWallet() | OK |
| 71 | T+4 | Rewrite useDialContacts | Uses UserDialerContext from @dial-wtf/react | OK |
| 72 | T+4 | Rewrite useDialProfile | Uses UserDialerContext from @dial-wtf/react | OK |
| 73 | T+4 | Rewrite useDialCall | Uses UserDialerContext from @dial-wtf/react | OK |
| 74 | T+5 | Add DialProvider | Wrapped contacts router with DialProvider + Outlet layout | OK |

### Key Changes in SDK v0.3.0 (Monorepo)

**Audit fixes addressed:**
- C1: siwe dynamically imported (won't crash if missing)
- C2: Extension environment detection (`IS_EXTENSION`, `IS_BROWSER_LIKE`)
- C4: AbortSignal composition with fallback
- P2-4: `autoLoad` defaults to `false`
- P2-5: Auto 401 refresh via `setSessionRefresher()`
- P2-6: GET request deduplication
- P2-7: Domain auto-detection for extensions
- P2-8: `Contact.chainId` optional field added
- P2-10: `Timestamp` narrowed to `string`

**New: `@dial-wtf/react` package**
- `DialProvider` context component
- `useAuth()` with `loginWithWallet()`, `loginWithSolana()`
- Service accessor hooks: `useContacts()`, `useProfile()`, `useCalls()`, etc.
- `useDialEvent()` for event subscriptions

### Files Changed (Session 2)

**Replaced:**
- `app/vendor/dial-sdk/` → `app/vendor/dial-core/`, `app/vendor/dial-client/`, `app/vendor/dial-react/`

**Modified:**
- `package.json` — Updated dependencies to 3-package model
- `ui/ducks/dial/dial.ts` — Imports from @dial-wtf/core
- `ui/selectors/dial.ts` — Imports from @dial-wtf/core
- `ui/hooks/useDialClient.ts` — Rewritten as useDialAuth, uses SDK's useAuth()
- `ui/hooks/useDialContacts.ts` — Uses UserDialerContext
- `ui/hooks/useDialProfile.ts` — Uses UserDialerContext
- `ui/hooks/useDialCall.ts` — Uses UserDialerContext
- `ui/pages/contacts/contacts-router.tsx` — Added DialProvider + Outlet layout

---

*This log is updated as operations are performed.*
