# Capability Vendor System — Architecture

The CapabilityVendor system is a subcluster within the ocap kernel that dynamically constructs exo capabilities from host controller messenger actions at runtime using an LLM. Once constructed, capabilities are ordinary kernel objects: passable to other vats, invocable via `E()`, and revocable.

## Execution Contexts

The system spans three execution contexts connected by message-passing boundaries:

```
Background Service Worker          Offscreen Document              Kernel Worker
(owns root controller messenger)   (CapTP proxy to kernel)         (runs kernel + vats)

  controllerMessenger.call() <──── chrome.runtime.sendMessage ──── E(hostApiProxy).invoke()
         │                              │                               │
         │                     registerKernelServiceObject()            │
         │                     launchSubcluster()                       │
         │                              │                               │
         └──────────────────────────────┘                     Vendor Vat (SES Compartment)
                                                                │
                                                         buildRootObject()
                                                           ├── bootstrap(vats, services)
                                                           ├── vendCapability(request)
                                                           ├── getCapabilities()
                                                           └── revokeCapability(id)
```

## Components

### 1. Host API Proxy Bridge (Background)

**File:** `app/scripts/lib/offscreen-bridge/host-api-proxy-bridge.ts`

A `chrome.runtime.onMessage` listener in the background service worker that:
- Filters messages by `OffscreenCommunicationTarget.hostApiProxy`
- Calls `controllerMessenger.call(action, ...args)` with the requested action
- Returns the result (or serialized error) via `sendResponse`

This follows the same pattern as the Ledger and Trezor offscreen bridges. The bridge is set up in `background.js` immediately after the MetaMask controller is created.

**Security note:** The bridge currently exposes ALL controller messenger actions without an allowlist. Any action string can be dispatched. This is acceptable for MVP but must be restricted before production use.

### 2. Host API Proxy Service (Offscreen)

**File:** `app/offscreen/ocap-kernel/services/host-api-proxy.ts`

A kernel service exo registered in the offscreen document with a single method:

```
invoke(method: string, ...args: unknown[]): Promise<unknown>
```

Wraps `chrome.runtime.sendMessage()` to forward calls to the background bridge. Registered as a kernel service so vats can call it via `E(hostApiProxy).invoke(...)`.

### 3. Method Catalog Service (Offscreen)

**File:** `app/offscreen/ocap-kernel/services/method-catalog.ts`
**Data:** `app/offscreen/ocap-kernel/services/method-catalog-data.json`

A kernel service exo that provides query access to a curated set of controller messenger actions. Methods:

- `getAllMethods()` — returns all catalog entries
- `getControllers()` — returns distinct controller names
- `getMethodsByController(controller)` — returns entries for a specific controller
- `search(query)` — case-insensitive search across names and descriptions

The catalog data is a static JSON file with 8 curated entries covering accounts, network, preferences, signing, tokens, and currency rate controllers.

### 4. LLM Service (Offscreen)

**File:** `app/offscreen/ocap-kernel/services/llm-service.ts`

A kernel service exo with a single method:

```
prompt(request: string): Promise<LlmResponse>
```

**Currently stubbed.** Always returns a hardcoded `AccountMessageSigner` capability regardless of the request string. The `LlmResponse` type defines the structured output shape:

```typescript
type LlmResponse = {
  capabilityName: string;   // e.g. "AccountMessageSigner"
  sourceCode: string;       // JS source evaluable in a Compartment
  description: string;      // Natural-language description
  methodNames: string[];    // Methods on the returned exo
}
```

### 5. Vendor Vat (Kernel)

**Source:** `app/offscreen/ocap-kernel/vats/capability-vendor/index.ts`
**Bundle:** `app/offscreen/ocap-kernel/vats/capability-vendor/index.bundle`

A vat that exports `buildRootObject()` returning an admin facet with:

- `bootstrap(_vats, services)` — receives and stores `hostApiProxy`, `llmService`, and `methodCatalog` references from kernel services
- `getPublicFacet()` — returns the public facet
- `vendCapability(request)` — convenience method delegating to the public facet
- `getCapabilities()` — returns all in-memory capability records
- `revokeCapability(id)` — removes a capability from the registry

The **public facet** has one method:

- `vendCapability(request)` — calls the LLM service, evaluates the returned source in a `new Compartment(endowments)` with `{ E, makeDefaultExo, hostApiProxy }` as endowments, and returns a `CapabilityRecord`

### 6. Kernel Entry Orchestration (Offscreen)

**File:** `app/offscreen/ocap-kernel/index.ts`

The `runKernel()` function orchestrates the full startup sequence:

1. Creates the kernel worker and CapTP connection
2. Pings the kernel to verify connectivity
3. Creates the three service exos
4. Registers them with the kernel via `E(kernelP).registerKernelServiceObject()`
5. Resolves the vat bundle path to a `chrome-extension://` URL
6. Launches the vendor subcluster via `E(kernelP).launchSubcluster()`
7. Runs a smoke test (temporary) that vends a capability and calls `getAccounts()` on it

### 7. Vat Bundling

**Script:** `scripts/bundle-vats.sh`
**package.json:** `yarn bundle-vats`

Vat source files are bundled using the ocap-kernel CLI (`node <cli-path> bundle <entry>`). The CLI produces `.bundle` files next to the source. Webpack copies `.bundle` files (excluding `.ts` source) to the dist output.

## Data Flow: Vending a Capability

```
1. Caller: E(vendorRoot).vendCapability("sign a message")
                │
2. Vendor vat:  E(llmService).prompt("sign a message")
                │
3. LLM service: returns LlmResponse { capabilityName, sourceCode, ... }
                │
4. Vendor vat:  new Compartment({ E, makeDefaultExo, hostApiProxy })
                compartment.evaluate(sourceCode)
                │
5. Result:      AccountMessageSigner exo with getAccounts(), signMessage()
                │
6. Usage:       E(capability).getAccounts()
                  → E(hostApiProxy).invoke('AccountsController:listAccounts')
                    → chrome.runtime.sendMessage(...)
                      → controllerMessenger.call('AccountsController:listAccounts')
                        → returns InternalAccount[]
```

## Stubbed / MVP Components

| Component | Status | What's Stubbed | Production Behavior |
|-----------|--------|---------------|-------------------|
| **LLM Service** | Stubbed | Always returns the same `AccountMessageSigner` response, ignores the request string | Calls an actual LLM API with the method catalog as context, returns dynamically generated capability source |
| **Method Catalog** | Partial | Static JSON with 8 hand-curated entries | Comprehensive catalog of all safe controller actions, potentially auto-generated from messenger type definitions |
| **Host API Proxy Bridge** | No allowlist | Dispatches any action string to the controller messenger | Allowlist of permitted actions, possibly per-capability scoping |
| **Capability Persistence** | Disabled | Capabilities exist only in memory, lost on kernel restart | Durable storage of capability records and recreation from persisted `sourceCode` on restart |
| **Smoke Test** | Temporary | Inline test code in `runKernel()` that exercises the full pipeline | Removed; replaced by proper E2E tests |
| **Kernel Storage Reset** | Dev-only | `?reset-storage=true` on the kernel worker URL clears persisted state each load | Removed; kernel state persists across restarts |
| **Vat Bundle CLI Path** | Hardcoded | `scripts/bundle-vats.sh` references an absolute local path to the CLI | CLI published as a package dependency or available via `npx` |

## File Map

```
shared/constants/
  offscreen-communication.ts          # OffscreenCommunicationTarget.hostApiProxy enum entry

app/scripts/
  background.js                       # Calls setupHostApiProxyBridge() after controller init
  lib/offscreen-bridge/
    host-api-proxy-bridge.ts          # Background-side chrome.runtime.onMessage listener

app/offscreen/ocap-kernel/
  index.ts                            # Kernel entry: registers services, launches subcluster
  services/
    host-api-proxy.ts                 # Exo: forwards invoke() to background via sendMessage
    method-catalog.ts                 # Exo: query interface over static catalog
    method-catalog-data.json          # Curated controller action entries
    llm-service.ts                    # Exo: returns stock LLM response (stubbed)
  vats/capability-vendor/
    index.ts                          # Vat source: buildRootObject with admin + public facets
    index.bundle                      # Pre-built vat bundle (generated by yarn bundle-vats)

scripts/
  bundle-vats.sh                      # Bundles vat sources using ocap-kernel CLI

development/webpack/
  webpack.config.ts                   # CopyPlugin entry for vat bundles
```
