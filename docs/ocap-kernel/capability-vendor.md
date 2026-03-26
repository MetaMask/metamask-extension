# Capability Vendor System

The CapabilityVendor system is a subcluster within the ocap kernel that dynamically constructs exo capabilities from host controller messenger actions at runtime using an LLM. Once constructed, capabilities are ordinary kernel objects: passable to other vats, invocable via `E()`, and revocable.

---

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
                                                           │     └── issues OCAP URL for publicFacet
                                                           ├── requestCapability(request)
                                                           │     └── LLM → approval UI → Compartment.evaluate
                                                           ├── getCapabilities()
                                                           └── revokeCapability(id)
```

---

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

```ts
invoke(method: string, args: unknown[] = []): Promise<unknown>
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

The catalog data is a static JSON file with curated entries covering accounts, network, preferences, signing, tokens, and currency rate controllers.

### 4. LLM Service (Offscreen)

**File:** `app/offscreen/ocap-kernel/services/llm-service.ts`

A kernel service exo with a single method:

```ts
prompt(request: string): Promise<LlmResponse>
```

**Currently stubbed.** Always returns a hardcoded `PersonalMessageSigner` capability regardless of the request string. The `LlmResponse` type defines the structured output shape:

```typescript
type LlmResponse = {
  capabilityName: string;   // e.g. "PersonalMessageSigner"
  sourceCode: string;       // JS source evaluable in a Compartment
  description: string;      // Natural-language description
  methodNames: string[];    // Methods on the returned exo
};
```

### 5. Vendor Vat (Kernel)

**Source:** `app/offscreen/ocap-kernel/vats/capability-vendor/index.ts`
**Bundle:** `app/offscreen/ocap-kernel/vats/capability-vendor/index.bundle`

A vat that exports `buildRootObject()` returning an admin facet (the root object) and an internal public facet.

#### Bootstrap

The `bootstrap(_vats, services)` method receives `hostApiProxy`, `llmService`, `methodCatalog`, and `ocapURLIssuerService`. It issues an OCAP URL for the public facet via `E(ocapURLIssuerService).issue(publicFacet)` and returns `{ ocapURL }` as the bootstrap result. The offscreen orchestrator extracts this URL and forwards it to the `OcapKernelController` so it's available in the UI.

#### Admin Facet (Root Object)

- `bootstrap(_vats, services)` — stores service references, issues OCAP URL
- `getPublicFacet()` — returns the public facet
- `requestCapability(request)` — convenience delegation to public facet
- `getCapabilities()` — returns all in-memory capability records
- `revokeCapability(id)` — removes a capability from the registry

#### Public Facet

- `requestCapability(request)` — the core vending flow:
  1. Calls `E(llmService).prompt(request)` to get an `LlmResponse`
  2. Submits an approval request via `E(hostApiProxy).invoke('ApprovalController:addRequest', ...)` with type `ocap:capabilityApproval`
  3. If rejected, throws `'Capability rejected by user'`
  4. Evaluates the (potentially user-edited) source code in a `new Compartment` with endowments `{ E, makeDiscoverableExo, hostApiProxy }`
  5. Returns a `CapabilityRecord` with the constructed exo

### 6. OcapKernelController (Background)

**File:** `app/scripts/controllers/ocap-kernel-controller.ts`

A `BaseController` that stores kernel-related state accessible to the UI. Currently holds:

- `capabilityVendorUrl: string | null` — the OCAP URL issued by the vendor vat at bootstrap

The offscreen orchestrator sets this via `E(hostApiProxy).invoke('OcapKernelController:setCapabilityVendorUrl', [url])` after the vendor subcluster launches.

### 7. Kernel Management UI

**File:** `ui/pages/ocap-kernel/ocap-kernel-page.tsx`

A React page accessible from the global menu drawer. Displays the capability vendor OCAP URL (from `OcapKernelController` state) with a copy-to-clipboard button. Accessible at the `/ocap-kernel` route.

### 8. Kernel Entry Orchestration (Offscreen)

**File:** `app/offscreen/ocap-kernel/index.ts`

The `runKernel()` function orchestrates the full startup sequence:

1. Creates the kernel worker and CapTP connection
2. Pings the kernel to verify connectivity
3. Creates the three service exos (hostApiProxy, methodCatalog, llmService)
4. Registers them with the kernel via `E(kernelP).registerKernelServiceObject()`
5. Resolves the vat bundle path to a `chrome-extension://` URL
6. Launches the vendor subcluster via `E(kernelP).launchSubcluster()` with services: `hostApiProxy`, `methodCatalog`, `llmService`, `ocapURLIssuerService`
7. Extracts the OCAP URL from `bootstrapResult` and forwards it to `OcapKernelController`
8. Exposes `globalThis.runSmokeTest` for manual testing via the offscreen console

### 9. Vat Bundling

**Script:** `scripts/bundle-vats.sh`
**package.json:** `yarn bundle-vats`

Vat source files are bundled using the ocap-kernel CLI (`node <cli-path> bundle <entry>`). The CLI produces `.bundle` files next to the source. Webpack copies `.bundle` files (excluding `.ts` source) to the dist output.

---

## Data Flow: Vending a Capability

```
1. Caller: E(vendorPublicFacet).requestCapability("sign a message")
                │
2. Vendor vat:  E(llmService).prompt("sign a message")
                │
3. LLM service: returns LlmResponse { capabilityName, sourceCode, ... }
                │
4. Vendor vat:  E(hostApiProxy).invoke('ApprovalController:addRequest', [...])
                │
5. Extension:   shows approval confirmation UI to the user
                │
6. User:        approves (optionally edits capability details)
                │
7. Vendor vat:  new Compartment({ E, makeDiscoverableExo, hostApiProxy })
                compartment.evaluate(sourceCode)
                │
8. Result:      PersonalMessageSigner exo with getAccounts(), signMessage()
                │
9. Usage:       E(capability).getAccounts()
                  → E(hostApiProxy).invoke('AccountsController:listAccounts')
                    → chrome.runtime.sendMessage(...)
                      → controllerMessenger.call('AccountsController:listAccounts')
                        → returns InternalAccount[]
```

---

## Capability Approval Flow

When `requestCapability` is called, the vendor vat submits an approval request to the MetaMask `ApprovalController` with type `ocap:capabilityApproval`. The request data includes:

- `capabilityName` — the LLM-suggested name
- `description` — natural-language description
- `methodNames` — list of methods on the exo
- `sourceCode` — the evaluable JS source

The extension shows a confirmation UI. The user can approve or reject. The approval result may include edited values (name, description, methods, source), which the vendor vat uses instead of the original LLM output.

---

## Revocation Flow

Revoking a capability involves two layers:

1. **Vendor registry** — `adminFacet.revokeCapability(capabilityId)` removes the record from the vendor vat's in-memory registry.
2. **Kernel-level** — `kernel.revoke(kref)` marks the kernel object as revoked. Any subsequent `E(capability).method()` call from any vat will fail.

The host application's UI orchestrates both:

```ts
async function revokeCapability(capabilityId: string): Promise<void> {
  const capabilities = await E(vendorAdminFacet).getCapabilities();
  const record = capabilities.find((c) => c.id === capabilityId);
  if (!record) throw new Error('Capability not found');

  kernel.revoke(record.kref);
  await E(vendorAdminFacet).revokeCapability(capabilityId);
}
```

---

## Stubbed / MVP Components

| Component | Status | What's Stubbed | Production Behavior |
|-----------|--------|---------------|-------------------|
| **LLM Service** | Stubbed | Always returns the same `PersonalMessageSigner` response, ignores the request string | Calls an actual LLM API with the method catalog as context, returns dynamically generated capability source |
| **Method Catalog** | Partial | Static JSON with curated entries | Comprehensive catalog of all safe controller actions, potentially auto-generated from messenger type definitions |
| **Host API Proxy Bridge** | No allowlist | Dispatches any action string to the controller messenger | Allowlist of permitted actions, possibly per-capability scoping |
| **Capability Persistence** | Disabled | Capabilities exist only in memory, lost on kernel restart | Durable storage of capability records and recreation from persisted `sourceCode` on restart |
| **Kernel Storage Reset** | Dev-only | `?reset-storage=true` on the kernel worker URL clears persisted state each load | Removed; kernel state persists across restarts |
| **Vat Bundle CLI Path** | Hardcoded | `scripts/bundle-vats.sh` references an absolute local path to the CLI | CLI published as a package dependency or available via `npx` |
| **Approval UI** | MVP | Basic confirmation dialog via `ApprovalController` | Richer UI with source code viewer, capability preview, and edit controls |

---

## Types

**File:** `app/offscreen/ocap-kernel/types.ts`

```typescript
type HostApiProxy = {
  invoke: (method: string, args?: unknown[]) => Promise<unknown>;
};

type LlmService = {
  prompt: (request: string) => Promise<LlmResponse>;
};

type OcapURLIssuerService = {
  issue: (obj: unknown) => Promise<string>;
};

type LlmResponse = {
  capabilityName: string;
  sourceCode: string;
  description: string;
  methodNames: string[];
};

type CapabilityRecord = {
  id: string;
  name: string;
  description: string;
  methodNames: string[];
  exo: unknown;
  sourceCode: string;
};

type CapabilityApprovalResult = {
  approved: boolean;
  capabilityName?: string;
  description?: string;
  methodNames?: string[];
  sourceCode?: string;
};
```

---

## Open Questions

1. **LLM tool use** — whether the LLM service exposes the method catalog as a tool (recommended for large catalogs) or includes it in the system prompt.
2. **Kref tracking** — the vendor vat doesn't know its capabilities' krefs (allocated by the kernel when the exo crosses a message boundary). The host app needs a mechanism to associate capability IDs with krefs for revocation.
3. **Approval/policy gating** — how the host app gates access to the public facet when sharing it with third-party vats via OCAP URL. Currently gated by user approval UI.
4. **Error handling** — what happens when the LLM generates invalid source code (`Compartment.evaluate()` throws). Retry? Return error to caller?
5. **Capability reconstruction on restart** — vended capability exos need to be reconstructable from baggage. This may require storing the evaluated capability objects in baggage, or re-evaluating source code on resuscitation.

---

## File Map

```
shared/constants/
  offscreen-communication.ts          # OffscreenCommunicationTarget.hostApiProxy enum entry

app/scripts/
  background.js                       # Calls setupHostApiProxyBridge() after controller init
  controllers/
    ocap-kernel-controller.ts         # OcapKernelController: stores capabilityVendorUrl
  controller-init/
    ocap-kernel-controller-init.ts    # Controller init for OcapKernelController
    messengers/
      ocap-kernel-controller-messenger.ts # Messenger factory
  lib/offscreen-bridge/
    host-api-proxy-bridge.ts          # Background-side chrome.runtime.onMessage listener

app/offscreen/ocap-kernel/
  index.ts                            # Kernel entry: registers services, launches subcluster
  types.ts                            # Shared types (LlmResponse, CapabilityRecord, etc.)
  services/
    host-api-proxy.ts                 # Exo: forwards invoke() to background via sendMessage
    method-catalog.ts                 # Exo: query interface over static catalog
    method-catalog-data.json          # Curated controller action entries
    llm-service.ts                    # Exo: returns stock LLM response (stubbed)
  vats/capability-vendor/
    index.ts                          # Vat source: buildRootObject with admin + public facets
    index.bundle                      # Pre-built vat bundle (generated by yarn bundle-vats)

ui/pages/ocap-kernel/
  ocap-kernel-page.tsx                # Kernel management UI (OCAP URL display)
  index.ts                            # Page re-export

scripts/
  bundle-vats.sh                      # Bundles vat sources using ocap-kernel CLI

development/webpack/
  webpack.config.ts                   # CopyPlugin entry for vat bundles

packages/                             # (external packages, referenced for context)
  kernel-browser-runtime/src/
    kernel-worker/kernel-worker.ts    # Kernel init, CapTP setup, initRemoteComms call
    background-captp.ts               # makeBackgroundCapTP — getKernel() via CapTP
  ocap-kernel/src/
    kernel-facet.ts                   # KernelFacet method list
    remotes/kernel/OcapURLManager.ts  # OCAP URL issue/redeem internals
    remotes/kernel/remote-comms.ts    # parseOcapURL, remote identity generation
    rpc/kernel-control/               # RPC handler specs
  kernel-utils/src/
    discoverable.ts                   # makeDiscoverableExo, GET_DESCRIPTION constant
    exo.ts                            # makeDefaultExo
    schema.ts                         # MethodSchema type definition
  kernel-agents/src/
    capabilities/discover.ts          # discover() — converts discoverable exo to capability record
  kernel-cli/README.md                # CLI command reference
```
