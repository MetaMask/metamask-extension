# Dial SDK Feedback — Part 2: Integration-Discovered Issues

> Follow-up to the initial audit (`dial-sdk-audit.md`)
> These findings emerged during actual integration of `@dial-wtf/sdk` v0.3.0 into MetaMask Extension
> From: MetaMask Extension team
> Date: 2026-03-26

---

## Context

Part 1 covered issues found through static code review. This document covers issues that only became apparent while wiring the SDK into a production Chrome extension with React/Redux, real user flows, and MetaMask's existing address book infrastructure. These are the things that will bite every non-trivial integrator.

---

## Findings

### P2-1: Dual contacts systems create confusion and data inconsistency

**Severity:** High
**Affects:** Any integrator using contacts

The SDK exposes two independent contacts management paths:

| Path | Access | Storage | Events | Cache |
|------|--------|---------|--------|-------|
| `userDialer.contacts` (ContactsBook) | `contacts.getAll()`, `contacts.add()`, etc. | Pluggable provider | `contact:added`, `contact:updated`, etc. | In-memory Map |
| `userDialer.profile` (ProfileService) | `profile.getContacts()`, `profile.addContact()`, etc. | Always API | None | None |

Both hit the same `/profile/contacts` API endpoints, but:
- ContactsBook has an in-memory cache that doesn't know about ProfileService writes
- ProfileService has no event system, so ContactsBook listeners never fire for ProfileService changes
- If a consumer uses both (easy to do since both are on UserDialer), they'll get stale reads and ghost contacts

**Ask:** Pick one canonical path. Our recommendation: make ContactsBook the sole public API and either remove the contact methods from ProfileService or make them delegate to ContactsBook internally.

---

### P2-2: No batch profile lookup — O(n) HTTP calls for contact lists

**Severity:** High
**Affects:** Any UI that renders a list of contacts with profile data

The `Contact` type includes a full embedded `DialProfile`, but:
- `contacts.getAll()` returns contacts (profiles may be stale or skeletal)
- There is no `registry.getProfiles(addresses: string[])` or `registry.batchLookup()` endpoint
- The only way to get fresh profile data is `profile.getProfile({ walletAddress })` — one HTTP call per contact

For a user with 50 contacts, rendering the contact list with avatars and display names requires 50 sequential API calls. This is a dealbreaker for list views.

**Ask:** Add a batch profile endpoint, e.g.:
```typescript
// Fetch up to 100 profiles in a single request
const profiles = await dial.registry.getProfiles({
  addresses: ['0x...', '0x...', '0x...']
});
```

---

### P2-3: `ApiContactsBookProvider` requires unexported `HttpClient`

**Severity:** Medium
**Affects:** Integrators using custom ContactsBook setups

The SDK exports `ApiContactsBookProvider` from the main entry point, but its constructor requires an `HttpClient` instance:

```typescript
// Exported
export { ApiContactsBookProvider } from './services/contacts-book-api';

// But HttpClient is NOT exported
// So consumers can't construct it:
const provider = new ApiContactsBookProvider(/* need HttpClient here */);
```

The only way to get an `HttpClient` is through the internal plumbing of `DialClient` → `UserDialer`, which defeats the purpose of the pluggable provider pattern.

**Ask:** Either:
- Export `HttpClient` (or a factory for it), or
- Give `ApiContactsBookProvider` a config-based constructor: `new ApiContactsBookProvider({ apiKey, baseUrl, token })`

---

### P2-4: ContactsBook auto-loads in constructor — hostile to React lifecycle

**Severity:** Medium
**Affects:** React/Vue/Svelte integrators

```typescript
// contacts-book.ts constructor
constructor(provider: IContactsBookProvider, config?: ContactsBookConfig) {
  this.provider = provider;
  if (config?.autoLoad !== false) {
    this.load().catch(() => {}); // Side effect in constructor!
  }
}
```

In React, object creation during render should be pure. This constructor fires a network request (via the provider) as a side effect, which:
- Can't be cancelled if the component unmounts
- Errors are swallowed with `catch(() => {})`
- Runs before the consumer has a chance to attach event listeners

The `autoLoad` option exists but defaults to `true`.

**Ask:** Change the default to `autoLoad: false`. Document that consumers should call `.load()` explicitly (e.g., in a `useEffect`). This is a one-line change that prevents a class of bugs for every framework integrator.

---

### P2-5: No automatic session refresh on 401

**Severity:** Medium
**Affects:** Any long-lived integration

`AuthService.refreshSession()` exists but is never called automatically. When a session token expires mid-use:

1. An API call fails with 401
2. The error propagates to the consumer
3. The consumer must catch it, call `refreshSession()`, and retry the original request
4. The original request context (params, callback) is lost

Every SDK consumer must independently implement refresh-on-401 retry logic. This is error-prone and results in poor UX (users see flashes of "unauthorized" errors).

**Ask:** Add an interceptor in `HttpClient.request()`:
```typescript
if (response.status === 401 && this.session?.refreshToken) {
  const newSession = await this.auth.refreshSession(this.session);
  this.setAuthToken(newSession.token);
  return this.request(endpoint, options); // Retry once
}
```

---

### P2-6: No request deduplication — React renders cause request storms

**Severity:** Medium
**Affects:** React integrators

In a React app, `useEffect` hooks and re-renders can trigger the same SDK call multiple times in rapid succession:

```typescript
// This fires profile.get() on every render where address changes
useEffect(() => {
  userDialer.profile.getProfile({ walletAddress: address });
}, [address]);
```

The SDK fires a new HTTP request every time. With React 18's strict mode (double-mount in dev), this is immediately visible. In production, component re-renders and parent state changes cause redundant requests.

**Ask:** Add in-flight request deduplication in the HttpClient. If an identical GET request is already in-flight, return the same Promise instead of firing a new request. This is standard practice in API client libraries (Apollo, SWR, React Query all do this internally).

---

### P2-7: `authenticateWithWallet` hardcodes `domain: 'dial.wtf'` — breaks in extensions

**Severity:** High
**Affects:** Chrome extension, Electron, and non-web integrators

```typescript
// dial-client.ts:243
const domain = options.domain ?? "dial.wtf";
```

The SIWE spec (EIP-4361) states that the `domain` field should match the requesting origin. In a Chrome extension:
- The origin is `chrome-extension://abcdef1234567890`
- The domain sent in the SIWE message is `dial.wtf`
- If the Dial backend strictly validates the domain field, auth fails
- If it doesn't validate, this is a security issue (any site can replay the signature)

The helper has an `options.domain` parameter, but:
- `asUser()` (the main auth path) doesn't accept a domain parameter at all
- The docs show `domain: 'dial.wtf'` in all examples without noting this constraint
- There's no guidance on what non-web integrators should use

**Ask:**
1. Document the domain validation behavior (strict or permissive?)
2. If strict: accept `domain` as a parameter on `asUser()`, not just the helper
3. If permissive: document the security implications
4. Add a section in docs for Chrome extension / non-browser integrators

---

### P2-8: No chain-scoping for contacts — data model mismatch with multi-chain wallets

**Severity:** High
**Affects:** Any multi-chain wallet (MetaMask, Rainbow, Rabby, etc.)

MetaMask's address book is keyed by `(chainId, address)`:
```typescript
// MetaMask state shape
addressBook: {
  "0x1": {     // Ethereum mainnet
    "0xabc...": { name: "Alice (ETH)", memo: "..." }
  },
  "0x89": {    // Polygon
    "0xabc...": { name: "Alice (Poly)", memo: "different memo" }
  }
}
```

Dial's contacts are keyed by `walletAddress` alone:
```typescript
// Dial Contact type
interface Contact {
  walletAddress: WalletAddress;  // No chainId
  nickname?: string;             // One nickname per address, globally
  // ...
}
```

The same address can exist in MetaMask's address book on multiple chains with different nicknames and memos. Syncing to Dial loses this distinction — we can only store one nickname per address, and we can't represent chain-specific metadata.

**Ask:** Add an optional `chainId` or `context` field to the Contact type:
```typescript
interface Contact {
  walletAddress: WalletAddress;
  chainId?: string;        // Optional chain scope
  nickname?: string;
  tags?: string[];
  notes?: string;
  addedAt: Timestamp;
}
```

This is additive and backward-compatible (omitting chainId = global contact, same as today).

---

### P2-9: ENS is a free-text `links.ens` field — no verified resolution

**Severity:** Medium
**Affects:** Any integrator displaying ENS names as identity

Currently, ENS data lives in `DialProfile.links.ens` as a plain string:
```typescript
interface ProfileLinks {
  ens?: string;  // User-provided, not verified
  // ...
}
```

There is `profile.linkENS({ ensName })` to set this, but:
- No `registry.resolveENS(address)` to look up the on-chain primary ENS for an address
- No verification that the user actually owns the ENS name they claimed
- No reverse resolution (address -> primary ENS name)
- The `verified.ens` boolean exists but there's no documentation on how/when it gets set

For a wallet like MetaMask, displaying an unverified ENS name next to someone's address is a phishing vector. We need to know the difference between "user claims to be vitalik.eth" and "on-chain reverse resolution confirms this address resolves to vitalik.eth."

**Ask:**
1. Add `registry.resolveENS(address)` for verified on-chain reverse resolution
2. Document the verification flow for `profile.linkENS()` — does the backend check ownership?
3. Ensure `verified.ens` is populated based on on-chain proof, not just the `linkENS` call
4. Consider adding a `resolvedENS` read-only field to `DialProfile` that's always backend-verified

---

### P2-10: Distributed types not compiled under `strict: true`

**Severity:** Low
**Affects:** TypeScript consumers with strict mode enabled

Several patterns in the `.d.ts` output suggest the SDK isn't compiled with `strict: true`:

- `Timestamp = string | Date` — forces consumers to narrow on every use
- Error detail types use `Record<string, unknown>` liberally
- Some method signatures accept `unknown` where narrower types would be safe
- No `readonly` modifiers on properties that shouldn't be mutated

For consumers with `strictNullChecks`, `strictFunctionTypes`, and `noUncheckedIndexedAccess` enabled (MetaMask uses strict mode), this creates friction at every call site.

**Ask:** Compile the SDK with `strict: true` in `tsconfig.json` and:
- Narrow `Timestamp` to `string` (ISO 8601) — the SDK already only produces strings
- Use `Readonly<>` on types that represent API responses
- Replace `unknown` with specific types where the shape is known

---

## Priority Summary

| ID | Title | Severity | Effort | Impact |
|----|-------|----------|--------|--------|
| P2-1 | Dual contacts systems | High | Medium | Data corruption risk |
| P2-2 | No batch profile lookup | High | Medium | Unusable list views |
| P2-7 | Hardcoded SIWE domain | High | Low | Auth broken in extensions |
| P2-8 | No chain-scoping for contacts | High | Low | Data loss on sync |
| P2-3 | HttpClient not exported | Medium | Low | Blocks custom providers |
| P2-4 | Auto-load default | Medium | Trivial | Framework-hostile |
| P2-5 | No auto session refresh | Medium | Medium | Poor long-session UX |
| P2-6 | No request dedup | Medium | Medium | Performance in React |
| P2-9 | ENS not verified | Medium | Medium | Security concern |
| P2-10 | Types not strict | Low | Low | DX friction |

**Top 4 to fix first:** P2-7 (blocks extension auth), P2-8 (data loss), P2-1 (data corruption), P2-2 (performance).

---

## What's Working Well

To be clear, the SDK gets a lot right:

- The `IContactsBookProvider` pluggable interface is excellent — it let us bypass C2/C3 entirely
- TypeScript-first with comprehensive type exports
- Clean error hierarchy with actionable error codes
- The `config.fetch` option allows custom fetch injection, which we use
- Session export/restore pattern works well for persistence
- EventEmitter3 is a solid choice (small, typed, well-maintained)
- The isomorphic design intent is correct, even if the extension edge cases need work

The SDK is clearly early-stage but architecturally sound. These fixes would make it production-ready for the extension ecosystem.
