# CapabilityVendor Service — High-Level Specification

## Context

A host application running an ocap kernel instance has many internal APIs (controller methods) that need to be exposed to vats as object capabilities. Rather than hand-writing an exo for every combination of host APIs, we design a **CapabilityVendor** system: a system vat that uses an LLM to dynamically construct exo capabilities from host API methods at runtime. Once constructed, these capabilities are ordinary kernel objects — passable to other vats, invocable via `E()`, persistent across restarts, and revocable.

---

## Architecture Overview

```
Host Application
  │
  ├─ Registers 3 kernel services:
  │   1. hostApiProxy    — proxy to host controller methods
  │   2. methodCatalog   — queryable catalog of available methods + docs
  │   3. llmService      — LLM access ({ prompt })
  │
  ├─ Provides SystemSubclusterConfig for the vendor subcluster
  │
  └─ Kernel.make(platformServices, db, {
       systemSubclusters: [{ name: 'capability-vendor', config: vendorClusterConfig }]
     })

Vendor System Subcluster
  │
  └─ vendor-vat (bootstrap vat)
       ├─ Receives at bootstrap: { hostApiProxy, methodCatalog, llmService, kernelFacet }
       ├─ Root object = admin facet (system subcluster root)
       │    ├─ getPublicFacet()  → returns the public facet
       │    ├─ getCapabilities() → returns metadata for all vended capabilities
       │    └─ revokeCapability(capabilityId) → revokes and cleans up a capability
       │
       └─ Public facet (handed out selectively by host app)
            └─ vendCapability(request: string) → returns a new capability exo
```

---

## Components

### 1. Host API Proxy Service

Registered by the host application as a kernel service. Provides the vendor vat's generated code access to host controller methods.

The exact shape (one method per controller method vs. generic `invoke()`) is left to the host application. Example with generic dispatch:

```ts
// Host application side — registering the proxy service
const hostApiProxy = makeDefaultExo('hostApiProxy', {
  invoke(method: string, ...args: unknown[]): Promise<unknown> {
    // method is e.g. "AccountsController:getAccounts"
    const [controller, methodName] = method.split(':');
    return controllerMessenger.call(controller, methodName, ...args);
  },
});

kernel.registerKernelServiceObject('hostApiProxy', hostApiProxy);
```

### 2. Method Catalog Service

Provides the vendor LLM with metadata about available host API methods. The catalog is static (fixed at startup). Each entry includes the method name, its TypeScript signature, and JSDoc description, namespaced by controller.

```ts
type MethodEntry = {
  name: string;         // e.g. "AccountsController:getAccounts"
  signature: string;    // e.g. "(chainId: string) => Promise<Account[]>"
  description: string;  // JSDoc/TSDoc description
};

type MethodCatalog = {
  // Query methods for the LLM to explore available APIs
  getControllers(): string[];
  getMethodsByController(controller: string): MethodEntry[];
  getAllMethods(): MethodEntry[];
  search(query: string): MethodEntry[];
};
```

Registered as a kernel service:

```ts
kernel.registerKernelServiceObject('methodCatalog', methodCatalog);
```

The LLM service's system prompt can reference this catalog directly, or the catalog can be exposed as a tool the LLM can call during generation. Given the potentially large number of APIs, a tool-based approach (search/query) is recommended over dumping the full catalog into the system prompt.

### 3. LLM Service

A kernel service providing access to an LLM for capability construction. Registered by the host application. Minimal interface:

```ts
type LlmService = {
  prompt(request: string): Promise<LlmResponse>;
};

type LlmResponse = {
  capabilityName: string; // CamelCase name for the capability (e.g. "AccountBalanceChecker")
  sourceCode: string;     // The exo source code
  description: string;    // Natural-language description of the capability
  methodNames: string[];  // Names of the methods on the exo
};
```

The LLM service is responsible for:
- Maintaining the system prompt (context about being a capability vendor, the expected output format, etc.)
- Optionally exposing the method catalog as an LLM tool for context management
- Returning structured output: capability name (CamelCase) + source code + description + method list

### 4. Vendor Vat

The vendor vat is the bootstrap vat of the `capability-vendor` system subcluster. It receives services at bootstrap and exposes two facets.

#### System Subcluster Config (host application side)

```ts
const vendorClusterConfig: SystemSubclusterConfig = {
  name: 'capability-vendor',
  config: {
    bootstrap: 'vendor',
    services: ['hostApiProxy', 'methodCatalog', 'llmService', 'kernelFacet'],
    vats: {
      vendor: {
        sourceSpec: '<path-to-vendor-vat-bundle>',
      },
    },
  },
};
```

#### Vendor Vat Implementation

```ts
import { E } from '@endo/eventual-send';
import { makeDefaultExo } from '@metamask/kernel-utils/exo';
import type { Baggage } from '@metamask/ocap-kernel';

type CapabilityRecord = {
  id: string;
  name: string;         // CamelCase name (e.g. "AccountBalanceChecker")
  description: string;
  sourceCode: string;
  kref: string; // stored for revocation coordination
};

type BootstrapServices = {
  hostApiProxy: {
    invoke(method: string, ...args: unknown[]): Promise<unknown>;
  };
  methodCatalog: {
    getControllers(): Promise<string[]>;
    getMethodsByController(controller: string): Promise<MethodEntry[]>;
    getAllMethods(): Promise<MethodEntry[]>;
    search(query: string): Promise<MethodEntry[]>;
  };
  llmService: {
    prompt(request: string): Promise<LlmResponse>;
  };
  kernelFacet: object;
};

export function buildRootObject(
  _vatPowers: unknown,
  _parameters: unknown,
  baggage: Baggage,
) {
  let hostApiProxy: BootstrapServices['hostApiProxy'];
  let llmService: BootstrapServices['llmService'];

  // Capability registry — persisted in baggage
  // Map<capabilityId, CapabilityRecord>
  let registry: Map<string, CapabilityRecord> = baggage.has('registry')
    ? baggage.get('registry') as Map<string, CapabilityRecord>
    : new Map();

  // Counter for generating capability IDs
  let nextId: number = baggage.has('nextId')
    ? baggage.get('nextId') as number
    : 0;

  /**
   * Evaluate LLM-generated source code into a capability exo.
   *
   * The source code is evaluated in a new Compartment with controlled
   * endowments. It must export a `build` function that receives
   * `{ hostApiProxy, E, makeDefaultExo }` and returns the exo.
   */
  function constructCapability(
    capabilityName: string,
    sourceCode: string,
    description: string,
  ): object {
    const compartment = new Compartment({
      globals: harden({
        E,
        makeDefaultExo,
        hostApiProxy,
      }),
    });

    // The source code must define and return a `build()` function result
    // Example source: `makeDefaultExo('AccountBalanceChecker', { async getBalance(chainId) { ... } })`
    const capability = compartment.evaluate(sourceCode);

    // Attach introspection dunder-methods by wrapping in another exo
    // The exo name uses the LLM-provided CamelCase capability name
    return makeDefaultExo(capabilityName, {
      // Proxy all methods from the inner capability
      ...capability,

      __getSource__(): string {
        return sourceCode;
      },

      __getDescription__(): string {
        return description;
      },
    });
  }

  // --- Public Facet ---
  const publicFacet = makeDefaultExo('capabilityVendorPublic', {
    /**
     * Construct a new capability from a natural-language request.
     *
     * @param request - Natural-language description of the desired capability.
     * @returns The constructed capability exo.
     */
    async vendCapability(request: string): Promise<object> {
      const response = await E(llmService).prompt(request);
      const { capabilityName, sourceCode, description } = response;

      const capability = constructCapability(capabilityName, sourceCode, description);

      const capId = String(nextId);
      nextId += 1;
      baggage.has('nextId')
        ? baggage.set('nextId', nextId)
        : baggage.init('nextId', nextId);

      const record: CapabilityRecord = {
        id: capId,
        name: capabilityName,
        description,
        sourceCode,
        kref: '', // populated by host after kref allocation
      };
      registry.set(capId, record);
      baggage.has('registry')
        ? baggage.set('registry', registry)
        : baggage.init('registry', registry);

      return capability;
    },
  });

  // --- Admin Facet (root object) ---
  return makeDefaultExo('capabilityVendorAdmin', {
    async bootstrap(
      _vats: unknown,
      services: BootstrapServices,
    ): Promise<void> {
      hostApiProxy = services.hostApiProxy;
      llmService = services.llmService;

      if (!baggage.has('hostApiProxy')) {
        baggage.init('hostApiProxy', services.hostApiProxy);
        baggage.init('llmService', services.llmService);
      }
    },

    /**
     * Get the public facet for sharing with other vats.
     */
    getPublicFacet(): object {
      return publicFacet;
    },

    /**
     * List all vended capabilities and their metadata.
     */
    getCapabilities(): CapabilityRecord[] {
      return [...registry.values()];
    },

    /**
     * Revoke a vended capability and remove it from the registry.
     *
     * This removes the vendor's record. The host application is responsible
     * for also calling `kernel.revoke(kref)` to revoke the kernel object
     * itself, ensuring that any vat holding a reference can no longer
     * invoke it.
     *
     * @param capabilityId - The ID of the capability to revoke.
     */
    revokeCapability(capabilityId: string): void {
      if (!registry.has(capabilityId)) {
        throw new Error(`Unknown capability: ${capabilityId}`);
      }
      registry.delete(capabilityId);
      baggage.set('registry', registry);
    },
  });
}
```

---

## Revocation Flow

Revoking a capability involves two layers:

1. **Vendor registry** — `adminFacet.revokeCapability(capabilityId)` removes the record from the vendor vat's baggage. This is bookkeeping.
2. **Kernel-level** — `kernel.revoke(kref)` marks the kernel object as revoked. Any subsequent `E(capability).method()` call from any vat will fail.

The host application's UI orchestrates both:

```ts
// Host application revocation handler
async function revokeCapability(capabilityId: string): Promise<void> {
  // 1. Get the record to find the kref
  const capabilities = await E(vendorAdminFacet).getCapabilities();
  const record = capabilities.find((c) => c.id === capabilityId);
  if (!record) throw new Error('Capability not found');

  // 2. Revoke at kernel level (prevents any further invocation)
  kernel.revoke(record.kref);

  // 3. Clean up vendor registry
  await E(vendorAdminFacet).revokeCapability(capabilityId);
}
```

---

## Dunder Methods on Vended Capabilities

Every vended capability exo includes two introspection methods:

- `__getSource__()` — returns the LLM-generated source code as a string
- `__getDescription__()` — returns the natural-language description

These are available to any vat holding a reference to the capability, enabling transparency and auditability.

---

## Persistence

- The **capability registry** (id, description, sourceCode, kref) is stored in the vendor vat's baggage and survives kernel restarts.
- **Capability exos** themselves are persistent kernel objects (they survive restarts because the vat is persistent).
- On vat resuscitation, the vendor vat restores its registry from baggage and re-hydrates service references (hostApiProxy, llmService) from baggage.

---

## Open Questions for Host Application Implementation

1. **Host API proxy shape** — generic `invoke()` vs. one-method-per-controller-method. Determined by host app patterns.
2. **LLM tool use** — whether the LLM service exposes the method catalog as a tool (recommended for large catalogs) or includes it in the system prompt.
3. **Kref tracking** — the vendor vat currently doesn't know its own capabilities' krefs (they're allocated by the kernel when the exo is returned through a message). The host application needs a mechanism to associate capability IDs with krefs for revocation. Options:
   - The vendor vat could use `kernelFacet` to query this
   - The host app could track the mapping externally when it receives capabilities
4. **Approval/policy gating** — how the host app gates access to `vendCapability()` when sharing the public facet with third-party vats. This could be a wrapper exo that checks policy before delegating.
5. **Error handling** — what happens when the LLM generates invalid source code (Compartment.evaluate() throws). Retry? Return error to caller?
6. **Capability reconstruction on restart** — vended capability exos need to be reconstructable from baggage. This may require storing the evaluated capability objects in baggage, or re-evaluating source code on resuscitation.
