# Dial SDK Audit Report

> Security, reliability, and compatibility audit of `@dial-wtf/sdk` v0.3.0
> Conducted from the perspective of MetaMask extension integration
> Auditor: Claude (automated), 2026-03-26
> Branch: `implement-dial-sdk`

---

## Executive Summary

The Dial SDK (v0.3.0, Private Alpha) provides a well-structured, TypeScript-first communication toolkit for wallet-to-wallet calling, messaging, and video conferencing. The codebase is clean, documented, and follows reasonable patterns.

However, **21 findings** were identified that impact integration with a Chrome extension (MV3) like MetaMask. Of these, **5 are critical** for the extension context, **7 are medium severity**, and **9 are low/informational**. The most impactful issues relate to the SDK's assumption of a standard browser environment, which does not hold in a Chrome extension service worker.

**Overall Assessment:** Suitable for integration with targeted workarounds. The SDK's pluggable provider pattern (`IContactsBookProvider`) is well-designed and allows us to bypass most critical issues by implementing a custom provider.

---

## Findings

### CRITICAL (Must address before integration)

#### C1: Hard import of `siwe` in AuthService crashes if not installed

**File:** `src/services/auth.ts:5`
**Code:** `import { SiweMessage } from "siwe";`

Despite `siwe` being listed as an **optional** peer dependency in `package.json`, the `AuthService` unconditionally imports it at module level. If `siwe` is not installed, the entire SDK fails to load with a module-not-found error. This is not tree-shakeable.

**Impact for MetaMask:** MetaMask has its own SIWE handling and may not want to add the `siwe` npm package. Even if unused, this import will execute at load time.

**Recommendation to SDK team:** Use dynamic `import()` or move the SIWE parsing to a separate entry point. The auth verify endpoint already receives the parsed fields - the client-side `SiweMessage` parsing in `verifySiwe()` is redundant since the server will verify anyway.

**Workaround:** Install `siwe` as a dependency (MetaMask already has it via `@metamask/message-signing-snap`), or we can bypass `AuthService.verifySiwe()` entirely since MetaMask's background already handles SIWE message creation/signing.

---

#### C2: Environment detection fails in Chrome Extension service worker

**File:** `src/utils/environment.ts:17-25`

```typescript
export function detectEnvironment(): Environment {
  if (typeof window !== "undefined" && typeof document !== "undefined") {
    return "browser";
  }
  if (typeof process !== "undefined" && process.versions?.node) {
    return "node";
  }
  return "unknown";
}
```

Chrome extension MV3 service workers have:
- No `window` global
- No `document` global
- No `process.versions.node`

Result: `detectEnvironment()` returns `"unknown"`, `IS_BROWSER` = `false`.

**Impact for MetaMask:** Any service worker code that initializes the SDK will get `IS_BROWSER = false`. The `LocalContactsBookProvider.ensureLoaded()` returns early when `!IS_BROWSER` (line 105), meaning contacts are never loaded from storage. The `persist()` method also no-ops.

**Recommendation to SDK team:** Add Chrome extension detection:
```typescript
if (typeof chrome !== "undefined" && chrome.runtime?.id) {
  return "extension";
}
```
Or better: let the consumer override the environment via config.

**Workaround:** We bypass this entirely by implementing a custom `IContactsBookProvider` that uses `chrome.storage.local` or MetaMask's existing state management.

---

#### C3: localStorage unavailable in extension service worker

**File:** `src/services/contacts-book-local.ts:108, 125`

The `LocalContactsBookProvider` uses `localStorage.getItem()` and `localStorage.setItem()` directly. In a Chrome extension MV3 service worker, `localStorage` is **not available** at all.

**Impact for MetaMask:** The default contacts provider will silently fail, producing an always-empty contacts book.

**Workaround:** We implement a `MetaMaskContactsBookProvider` that stores contacts in MetaMask's Redux state (backed by the existing `AddressBookController`), making the local provider irrelevant.

---

#### C4: No AbortSignal composition (timeout vs caller signal)

**File:** `src/http/client.ts:107`

```typescript
signal: signal ?? controller.signal,
```

The HTTP client creates an internal `AbortController` for timeout, but uses `??` to choose between the caller's signal and the internal one. This means:
- If the caller provides a signal, the timeout never fires
- If the caller doesn't provide a signal, they can't abort externally

**Impact for MetaMask:** MetaMask frequently needs to abort API calls (e.g., when switching accounts, navigating away). If the extension provides its own AbortSignal, request timeouts are silently disabled.

**Recommendation to SDK team:** Use `AbortSignal.any([signal, controller.signal])` (available in Node 20+, modern browsers) or implement a composite abort strategy.

**Workaround:** Wrap SDK calls with our own timeout handling at the integration layer.

---

#### C5: No real-time event delivery mechanism

**Files:** `src/client/user-dialer.ts`, `src/client/event-emitter.ts`

The SDK exposes an event system (`on('call:incoming', ...)`) but there is **no WebSocket, SSE, or polling** implementation. The `_emit()` method is public but nothing triggers it from the server. Events can only be emitted programmatically.

**Impact for MetaMask:** Incoming calls, messages, and real-time updates will not be received. The event system is a facade with no backend delivery.

**Recommendation to SDK team:** Implement a WebSocket client that connects after authentication and dispatches events. This is the most critical gap for a communication SDK.

**Workaround:** For MetaMask's initial integration, we focus on the contacts/profile/ENS features which are pull-based (HTTP). Real-time call features will require SDK updates.

---

### MEDIUM (Should address, has workarounds)

#### M1: ApiContactsBookProvider.get() is O(n) - fetches all contacts

**File:** `src/services/contacts-book-api.ts:32-41`

```typescript
async get(walletAddress: WalletAddress): Promise<Contact | null> {
  try {
    const contacts = await this.getAll();
    return contacts.find(...) ?? null;
  } catch { return null; }
}
```

To look up one contact, the entire contact list is fetched. No `/profile/contacts/:address` single-get endpoint.

**Impact:** Poor performance for users with many contacts. Also, `has()` calls `get()` which calls `getAll()`.

---

#### M2: ContactsBook constructor swallows initial load errors

**File:** `src/services/contacts-book.ts:29`

```typescript
this.load().catch(() => {});
```

If the initial auto-load fails (network error, corrupted storage, permission denied), the error is silently ignored. The contacts book will appear empty with no indication of failure.

**Impact:** Users may see an empty contacts list with no error message. No way to distinguish "no contacts" from "load failed".

---

#### M3: No retry logic or exponential backoff in HTTP client

**File:** `src/http/client.ts`

The HTTP client makes single-attempt requests. Any transient failure (network hiccup, 503, connection reset) immediately throws. For a communication SDK used in a browser extension that may have intermittent connectivity, this is fragile.

**Impact:** MetaMask users on flaky connections will see errors instead of automatic recovery.

---

#### M4: Content Security Policy violations

**File:** `src/services/calls.ts:204-208`

```typescript
setRingtone(audioUrl: string): void {
  if (typeof window !== 'undefined' && typeof Audio !== 'undefined') {
    const audio = new Audio(audioUrl);
    audio.preload = 'auto';
  }
}
```

Chrome extensions have strict CSP. Loading audio from arbitrary URLs via `new Audio()` may violate the extension's CSP unless the URL is from the extension itself or an explicitly allowed domain.

**Impact:** Using `setRingtone()` will likely fail silently or throw a CSP error.

---

#### M5: Session token stored only in memory

**Files:** `src/http/client.ts:23`, `src/client/user-dialer.ts:44`

The auth token is stored as `private authToken?: string` on the HttpClient instance. In MV3, the service worker can be terminated and restarted at any time. When restarted, all in-memory state is lost.

**Impact:** The Dial session will be lost every time the service worker restarts (typically after 30 seconds of inactivity). Users would need to re-authenticate frequently.

**Workaround:** Use `exportSession()` / `restoreSession()` with `chrome.storage.session` for persistence.

---

#### M6: Race condition in concurrent load() calls

**Files:** `src/services/contacts-book.ts:36-45`, `src/services/contacts-book-local.ts:101-103`

Both `ContactsBook` and `LocalContactsBookProvider` use a simple `loaded` boolean flag:

```typescript
async load(): Promise<Contact[]> {
  const contacts = await this.provider.getAll(); // async!
  this.cache.clear();
  // ...
}
```

If `getAll()` is called twice before the first `load()` resolves, two parallel loads execute. The second `load()` starts before the first sets `this.loaded = true`, causing duplicate network requests and potential cache corruption.

---

#### M7: Network type inconsistency

**File:** `src/types/client.ts:15-20`

```typescript
export type Network = 'mainnet' | 'testnet' | 'devnet';
export const DEFAULT_NETWORK: Network | 'alpha' = 'alpha';
```

The `Network` type excludes `'staging'` and `'alpha'`, but `API_BASE_URLS` includes them and the default is `'alpha'`. The `DialClientConfig.network` type is `Network | 'staging' | 'alpha'` - this ad-hoc union is confusing and error-prone.

---

### LOW / INFORMATIONAL

#### L1: Hand-rolled Base58 encoding

**File:** `src/client/dial-client.ts:335-360`

Comment says "In a real implementation, use bs58 library" but ships the naive implementation. May have edge cases with large Solana signatures.

---

#### L2: No request deduplication

Multiple rapid calls to `profile.get()` or `contacts.getAll()` fire independent HTTP requests with no dedup. MetaMask's usage patterns (React renders, multiple components) will amplify this.

---

#### L3: Timestamp type ambiguity

**File:** `src/types/common.ts:21`

`Timestamp = string | Date` forces consumers to handle both types everywhere. The SDK itself creates ISO strings, but the type allows Date objects.

---

#### L4: `_emit()` is publicly callable

**File:** `src/client/user-dialer.ts:283`

```typescript
_emit<T extends DialEventType>(event: T, payload: Parameters<EventListener<T>>[0]): void {
```

Marked `@internal` but is `public`. External code can forge SDK events.

---

#### L5: Deprecated `messages` alias still exposed

**File:** `src/client/user-dialer.ts:101`

`public readonly messages: ChatService;` is deprecated in favor of `chat` but still in the public API.

---

#### L6: No response validation (no Zod/io-ts)

**File:** `src/http/client.ts:128-132`

API responses are cast directly to TypeScript types:
```typescript
return (data as ApiResponse<T>).data;
return data as T;
```

No runtime validation. Malformed API responses will silently corrupt application state.

---

#### L7: Eager service instantiation hurts tree-shaking

**File:** `src/client/user-dialer.ts:182-189`

All services (calls, chat, profile, voicemail, conference, contacts) are instantiated in the constructor, even if unused. For MetaMask's bundle-size-sensitive extension, this adds unnecessary weight.

---

#### L8: No bundle size analysis / no tree-shaking markers

The SDK doesn't have `sideEffects: false` in package.json or per-file sideEffects annotations. Bundlers (webpack/rollup) may not be able to tree-shake unused services.

---

#### L9: `updateAvatar()` is a stub

**File:** `src/services/profile.ts:64-71`

```typescript
async updateAvatar(_options: { file: File | Blob }): Promise<DialProfile> {
  // In a real implementation, this would upload the file first
  const response = await this.http.post<DialProfile>(
    this.endpoint('/profile/avatar'),
    { hasAvatar: true }
  );
```

The avatar upload doesn't actually send the file. It sends `{ hasAvatar: true }`.

---

## Compatibility Matrix

| Feature | Extension Popup | Extension Service Worker | Extension Offscreen |
|---------|----------------|--------------------------|---------------------|
| DialClient init | OK | OK | OK |
| SIWE auth | OK (MetaMask handles signing) | OK | N/A |
| Profile CRUD | OK | OK | OK |
| Contacts CRUD | OK (custom provider) | OK (custom provider) | N/A |
| Call start/end | OK | OK | OK |
| Call media streams | OK (with offscreen doc) | NO (no media APIs) | OK |
| localStorage | OK | NO | OK |
| WebSocket events | OK | Partial (SW lifecycle) | OK |

---

## Recommendations for Integration

1. **Implement `MetaMaskContactsBookProvider`** - Custom `IContactsBookProvider` backed by MetaMask's Redux store / AddressBookController. Bypasses C2, C3, M6.

2. **Authenticate via MetaMask's existing signing** - Use `dial.asUser()` with SIWE credentials produced by MetaMask's existing keyring/signing infrastructure. Bypasses C1.

3. **Persist Dial session in extension storage** - Use `chrome.storage.session` to persist `exportSession()` data. Restore on service worker restart. Addresses M5.

4. **Wrap HTTP calls with MetaMask's fetch** - Provide MetaMask's fetch implementation via `config.fetch` to leverage existing proxy/CORS handling.

5. **Focus initial integration on pull-based features** - Contacts, profiles, ENS lookup. Defer real-time features (calls, messaging) until C5 is addressed by SDK team.

6. **Add `siwe` as explicit dependency** - Required by C1. MetaMask already has `siwe` in its dependency tree via other packages.

---

## Files Reviewed

| File | Lines | Notes |
|------|-------|-------|
| `src/index.ts` | 211 | Main barrel exports |
| `src/client/dial-client.ts` | 361 | Main client, auth helpers |
| `src/client/user-dialer.ts` | 287 | Authenticated client |
| `src/client/event-emitter.ts` | ~50 | EventEmitter3 wrapper |
| `src/services/auth.ts` | 145 | SIWE/SIWS authentication |
| `src/services/base.ts` | 27 | Base service class |
| `src/services/calls.ts` | 234 | Calling service |
| `src/services/contacts-book.ts` | 124 | ContactsBook orchestrator |
| `src/services/contacts-book-local.ts` | 131 | localStorage provider |
| `src/services/contacts-book-api.ts` | 72 | API provider |
| `src/services/profile.ts` | 245 | Profile management |
| `src/services/registry.ts` | 82 | Public registry |
| `src/http/client.ts` | 277 | HTTP client |
| `src/types/common.ts` | 71 | Common types |
| `src/types/client.ts` | 58 | Client config types |
| `src/types/profile.ts` | 145 | Profile & contact types |
| `src/types/contacts-book.ts` | 56 | Provider interface |
| `src/errors.ts` | 145 | Error hierarchy |
| `src/utils/environment.ts` | 148 | Environment detection |

**Total lines reviewed:** ~2,978
