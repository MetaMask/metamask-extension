# Performance Testing: Per-Chain Token Cache Storage

This document guides you through testing the performance of the new per-chain token cache storage in `TokenListController`, comparing it with the main branch's single-file approach.

---

## 📋 Overview

### What Changed

| Aspect            | Main Branch                                        | This PR                                    |
| ----------------- | -------------------------------------------------- | ------------------------------------------ |
| Storage format    | Single `TokenListController` state with all chains | Separate file per chain via StorageService |
| Write pattern     | Full state rewrite on any change                   | Only changed chain is written              |
| Read pattern      | Load entire cache at once                          | Parallel per-chain reads                   |
| State persistence | `persist: true` for `tokensChainsCache`            | `persist: false` (stored separately)       |

### Expected Benefits

- **Reduced write amplification**: Adding a new chain writes ~30KB instead of ~4MB
- **Faster incremental updates**: 197x faster for single chain updates
- **Better onboarding performance**: 3x faster, 57% less data written

### Potential Tradeoffs

- **Cold restart**: Slightly slower due to parallel file reads + getAllKeys overhead

---

## 🔧 Setup: Enable Performance Logging

### Step 1: Enable logging in BrowserStorageAdapter

Edit `app/scripts/lib/stores/browser-storage-adapter.ts`:

```typescript
// Line 10 - Change from:
const PERF_LOGGING_ENABLED = false;

// To:
const PERF_LOGGING_ENABLED = true;
```

### Step 2: Enable logging in ExtensionStore

Edit `app/scripts/lib/stores/extension-store.ts`:

```typescript
// Line 12 - Change from:
const PERF_LOGGING_ENABLED = false;

// To:
const PERF_LOGGING_ENABLED = true;
```

### Step 3: Build and load extension

```bash
yarn start
```

Load the extension in Chrome and open DevTools Console.

---

## 📊 Testing Scenarios

### Scenario 1: Cold Restart (Existing User)

**Purpose**: Measure time to load cached token lists on extension startup.

#### Steps:

1. Set up extension with multiple networks enabled (Ethereum, Polygon, BSC, Arbitrum, Base, etc.)
2. Wait for token lists to be cached (visit each network or wait for polling)
3. Close and reopen the browser (or disable/enable extension)
4. Open DevTools Console immediately
5. Watch for performance logs

#### Logs to Look For:

**This PR:**

```
[ControllerStorage PERF] getAllPersistedState started
[ControllerStorage PERF] TokenListController - 0.04KB - read: X.XXms, total: X.XXms
[ControllerStorage PERF] getAllPersistedState complete - XXX.XXms

[StorageService PERF] getAllKeys TokenListController - 7 keys found - XXX.XXms
[StorageService PERF] getItem TokenListController:tokensChainsCache:0x1 - XXXX.XXKB - read: XX.XXms, total: XX.XXms
[StorageService PERF] getItem TokenListController:tokensChainsCache:0x89 - XXX.XXKB - read: XX.XXms, total: XX.XXms
... (one per chain, loaded in parallel)
```

**Main Branch:**

```
[ControllerStorage PERF] getAllPersistedState started
[ControllerStorage PERF] TokenListController - 4102.55KB - read: 112.51ms, total: 135.27ms
[ControllerStorage PERF] getAllPersistedState complete - 288.21ms
```

#### What to Compare:

| Metric                            | This PR              | Main Branch           |
| --------------------------------- | -------------------- | --------------------- |
| TokenListController state size    | ~0.04KB (shell)      | ~4,100KB (full cache) |
| getAllPersistedState time         | Record this          | Record this           |
| StorageService parallel load time | Sum of getItem calls | N/A                   |

---

### Scenario 2: Fresh Onboarding

**Purpose**: Measure data written during initial token list fetching.

#### Steps:

1. Reset extension state (or use fresh profile)
2. Create/import wallet
3. Enable multiple networks (Ethereum, Polygon, BSC, Arbitrum, Optimism, Base, Linea)
4. Wait for token lists to be fetched for each network
5. Watch console for write logs

#### Logs to Look For:

**This PR:**

```
[StorageService PERF] getAllKeys TokenListController - 0 keys found - XXX.XXms
[StorageService PERF] setItem TokenListController:tokensChainsCache:0x1 - 1610.14KB - stringify: X.XXms, write: X.XXms, total: XX.XXms
[StorageService PERF] setItem TokenListController:tokensChainsCache:0x89 - 324.46KB - stringify: X.XXms, write: X.XXms, total: X.XXms
[StorageService PERF] setItem TokenListController:tokensChainsCache:0x38 - 1288.32KB - stringify: X.XXms, write: X.XXms, total: XX.XXms
... (one per chain)
```

**Main Branch:**

```
[ControllerStorage PERF] setItem TokenListController - 0.06KB - stringify: 0.00ms, write: 0.02ms, total: 0.02ms
[ControllerStorage PERF] setItem TokenListController - 1609.28KB - stringify: 13.41ms, write: 11.58ms, total: 24.99ms
[ControllerStorage PERF] setItem TokenListController - 1656.21KB - stringify: 12.85ms, write: 12.20ms, total: 25.04ms
[ControllerStorage PERF] setItem TokenListController - 2137.56KB - stringify: 12.47ms, write: 11.40ms, total: 23.87ms
[ControllerStorage PERF] setItem TokenListController - 4068.75KB - stringify: 22.00ms, write: 22.62ms, total: 44.62ms
```

#### What to Compare:

| Metric             | This PR               | Main Branch           |
| ------------------ | --------------------- | --------------------- |
| Total data written | Sum of all setItem KB | Sum of all setItem KB |
| Number of writes   | Count setItem calls   | Count setItem calls   |
| Total write time   | Sum of total times    | Sum of total times    |

---

### Scenario 3: Add New Chain

**Purpose**: Measure the impact of adding a single new network.

#### Steps:

1. Have extension running with existing cached networks
2. Add a new network (e.g., Monad, Sonic, or any network not yet cached)
3. Switch to that network to trigger token list fetch
4. Watch for the single write log

#### Logs to Look For:

**This PR:**

```
[StorageService PERF] setItem TokenListController:tokensChainsCache:0x8f - 33.79KB - stringify: 0.17ms, write: 0.07ms, total: 0.23ms
```

**Main Branch:**

```
[ControllerStorage PERF] setItem TokenListController - 4102.55KB - stringify: 23.52ms, write: 21.82ms, total: 45.34ms
```

#### What to Compare:

| Metric              | This PR                | Main Branch             |
| ------------------- | ---------------------- | ----------------------- |
| Data written        | ~34KB (new chain only) | ~4,103KB (entire cache) |
| Write time          | <1ms                   | ~45ms                   |
| Write amplification | None                   | 121x                    |

---

## 📈 Results Template

Copy this template to record your results:

```markdown
## Performance Results

### Environment

- Chrome Version:
- Extension Build:
- Date:

### Cold Restart

| Metric                        | This PR | Main Branch |
| ----------------------------- | ------- | ----------- |
| getAllPersistedState          | ms      | ms          |
| TokenListController read size | KB      | KB          |
| Cache load time               | ms      | ms          |
| Total overhead                | ms      | ms          |

### Onboarding

| Metric             | This PR | Main Branch |
| ------------------ | ------- | ----------- |
| Total data written | KB      | KB          |
| Number of writes   |         |             |
| Total write time   | ms      | ms          |

### Add New Chain

| Metric       | This PR | Main Branch |
| ------------ | ------- | ----------- |
| Data written | KB      | KB          |
| Time         | ms      | ms          |
```

---

## 🔍 Debugging Tips

### Check Storage Contents

In DevTools Console:

```javascript
// View all StorageService keys
chrome.storage.local.get(null, (items) => {
  const storageKeys = Object.keys(items).filter((k) =>
    k.startsWith('storageService:TokenListController'),
  );
  console.log('StorageService keys:', storageKeys);
  storageKeys.forEach((key) => {
    const size = JSON.stringify(items[key]).length / 1024;
    console.log(`  ${key}: ${size.toFixed(2)}KB`);
  });
});
```

### Check TokenListController State Size

```javascript
// In extension console
chrome.storage.local.get('TokenListController', (result) => {
  if (result.TokenListController) {
    const size = JSON.stringify(result.TokenListController).length / 1024;
    console.log(`TokenListController state: ${size.toFixed(2)}KB`);
    console.log(
      'tokensChainsCache chains:',
      Object.keys(result.TokenListController.tokensChainsCache || {}),
    );
  }
});
```

### Force Token List Refresh

Switch networks or wait for the 4-hour polling interval to trigger fresh fetches.

---

## 🔄 Testing Against Main Branch

### Switch to Main Branch

```bash
git checkout main
yarn install
yarn start
```

Enable the same `PERF_LOGGING_ENABLED = true` flags and repeat the scenarios.

### Switch Back to This PR

```bash
git checkout <your-branch>
yarn install
yarn start
```

---

## 📝 Notes

- **First run may be slower**: The migration (186.ts) runs once to move data from old format to new format
- **Parallel reads**: StorageService loads chains in parallel, so wall-clock time is close to the slowest chain, not the sum
- **Debounced writes**: TokenListController debounces writes by 500ms, so rapid changes batch together
- **Cache validity**: Token lists have a 4-hour cache threshold before refetching

---

## 🐛 Known Issues

1. **Migration overhead**: First cold start after upgrade will include migration time
2. **getAllKeys overhead**: Reading all keys from storage adds ~200-300ms on first load
3. **Large chains dominate**: Ethereum mainnet (~1.6MB) dominates both read and write times

---

## 📝 Complete Logging Code Reference

This section contains **complete file contents** for easy copy-paste when re-running performance tests.

---

### This PR: Complete `browser-storage-adapter.ts`

**File path:** `app/scripts/lib/stores/browser-storage-adapter.ts`

To enable logging: Set `PERF_LOGGING_ENABLED = true` on line 10.

```typescript
import browser from 'webextension-polyfill';
import type { Json } from '@metamask/utils';
import type {
  StorageAdapter,
  StorageGetResult,
} from '@metamask/storage-service';
import { STORAGE_KEY_PREFIX } from '@metamask/storage-service';

// Toggle for performance logging (set to true for benchmarking)
const PERF_LOGGING_ENABLED = true;

/**
 * Check if performance logging should be enabled for a given namespace/key.
 *
 * @param namespace - Controller namespace
 * @param key - Data key (optional)
 * @returns Whether to log performance for this operation
 */
function shouldLogPerf(namespace: string, key?: string): boolean {
  if (!PERF_LOGGING_ENABLED) {
    return false;
  }
  // Log for TokenListController operations
  return (
    namespace.includes('Token') ||
    (key !== undefined && (key.includes('token') || key.includes('Token')))
  );
}

/**
 * Calculate the size of a value in KB.
 *
 * @param value - The value to measure
 * @returns Size in KB as a formatted string
 */
function getSizeKB(value: unknown): string {
  const serialized = JSON.stringify(value);
  return (serialized.length / 1024).toFixed(2);
}

/**
 * Extension-specific storage adapter using browser.storage.local.
 *
 * Keys are formatted as: storageService:{namespace}:{key}
 * Example: storageService:TokenListController:tokensChainsCache
 */
export class BrowserStorageAdapter implements StorageAdapter {
  /**
   * Build the full storage key.
   *
   * @param namespace - Controller namespace
   * @param key - Data key
   * @returns Full key: storageService:{namespace}:{key}
   */
  #makeKey(namespace: string, key: string): string {
    return `${STORAGE_KEY_PREFIX}${namespace}:${key}`;
  }

  /**
   * Retrieve an item from browser.storage.local.
   *
   * @param namespace - Controller namespace
   * @param key - Data key
   * @returns StorageGetResult: { result } if found, {} if not found, { error } on failure
   */
  async getItem(namespace: string, key: string): Promise<StorageGetResult> {
    const startTime = performance.now();
    try {
      const fullKey = this.#makeKey(namespace, key);
      const result = await browser.storage.local.get(fullKey);
      const readDuration = performance.now() - startTime;

      // Key not found
      if (!(fullKey in result)) {
        if (shouldLogPerf(namespace, key)) {
          console.warn(
            `[StorageService PERF] getItem ${namespace}:${key} - NOT FOUND - ${readDuration.toFixed(2)}ms`,
          );
        }
        return {};
      }

      const value = result[fullKey] as Json;

      if (shouldLogPerf(namespace, key)) {
        const totalDuration = performance.now() - startTime;
        const sizeKB = getSizeKB(value);
        console.warn(
          `[StorageService PERF] getItem ${namespace}:${key} - ${sizeKB}KB - ` +
            `read: ${readDuration.toFixed(2)}ms, ` +
            `total: ${totalDuration.toFixed(2)}ms`,
        );
      }

      return { result: value };
    } catch (error) {
      console.error(
        `StorageService: Failed to get item: ${namespace}:${key}`,
        error,
      );
      return { error: error as Error };
    }
  }

  /**
   * Store an item in browser.storage.local.
   * browser.storage.local auto-serializes JSON, so we store directly.
   *
   * @param namespace - Controller namespace
   * @param key - Data key
   * @param value - JSON value to store
   */
  async setItem(namespace: string, key: string, value: Json): Promise<void> {
    const startTime = performance.now();
    try {
      const fullKey = this.#makeKey(namespace, key);

      // Measure stringify time (browser.storage.local does this internally)
      const stringifyStart = performance.now();
      const serialized = JSON.stringify(value);
      const stringifyDuration = performance.now() - stringifyStart;

      await browser.storage.local.set({ [fullKey]: value });

      if (shouldLogPerf(namespace, key)) {
        const totalDuration = performance.now() - startTime;
        const sizeKB = (serialized.length / 1024).toFixed(2);
        console.warn(
          `[StorageService PERF] setItem ${namespace}:${key} - ${sizeKB}KB - ` +
            `stringify: ${stringifyDuration.toFixed(2)}ms, ` +
            `write: ${(totalDuration - stringifyDuration).toFixed(2)}ms, ` +
            `total: ${totalDuration.toFixed(2)}ms`,
        );
      }
    } catch (error) {
      console.error(
        `StorageService: Failed to set item: ${namespace}:${key}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Remove an item from browser.storage.local.
   *
   * @param namespace - Controller namespace
   * @param key - Data key
   */
  async removeItem(namespace: string, key: string): Promise<void> {
    const startTime = performance.now();
    try {
      const fullKey = this.#makeKey(namespace, key);
      await browser.storage.local.remove(fullKey);

      if (shouldLogPerf(namespace, key)) {
        const duration = performance.now() - startTime;
        console.warn(
          `[StorageService PERF] removeItem ${namespace}:${key} - ${duration.toFixed(2)}ms`,
        );
      }
    } catch (error) {
      console.error(
        `StorageService: Failed to remove item: ${namespace}:${key}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get all keys for a namespace.
   * Filters by prefix and strips prefix from returned keys.
   *
   * @param namespace - Controller namespace
   * @returns Array of keys without prefix
   */
  async getAllKeys(namespace: string): Promise<string[]> {
    const startTime = performance.now();
    try {
      const prefix = `${STORAGE_KEY_PREFIX}${namespace}:`;
      const all = await browser.storage.local.get(null);

      const filteredKeys = Object.keys(all)
        .filter((k) => k.startsWith(prefix))
        .map((k) => k.slice(prefix.length));

      if (shouldLogPerf(namespace)) {
        const duration = performance.now() - startTime;
        console.warn(
          `[StorageService PERF] getAllKeys ${namespace} - ${filteredKeys.length} keys found - ${duration.toFixed(2)}ms`,
        );
      }

      return filteredKeys;
    } catch (error) {
      console.error(
        `StorageService: Failed to get keys for ${namespace}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Clear all items for a namespace.
   *
   * @param namespace - Controller namespace
   */
  async clear(namespace: string): Promise<void> {
    const startTime = performance.now();
    try {
      const keys = await this.getAllKeys(namespace);
      const fullKeys = keys.map((k) => this.#makeKey(namespace, k));

      if (fullKeys.length > 0) {
        await browser.storage.local.remove(fullKeys);
      }

      if (shouldLogPerf(namespace)) {
        const duration = performance.now() - startTime;
        console.warn(
          `[StorageService PERF] clear ${namespace} - ${keys.length} keys removed - ${duration.toFixed(2)}ms`,
        );
      }
    } catch (error) {
      console.error(
        `StorageService: Failed to clear namespace ${namespace}`,
        error,
      );
      throw error;
    }
  }
}
```

---

### This PR: Complete `extension-store.ts`

**File path:** `app/scripts/lib/stores/extension-store.ts`

To enable logging: Set `PERF_LOGGING_ENABLED = true` on line 13.

```typescript
import browser from 'webextension-polyfill';
import log from 'loglevel';
import { hasProperty, isObject } from '@metamask/utils';
import type {
  MetaMaskStorageStructure,
  BaseStore,
  MetaData,
} from './base-store';

const { sentry } = globalThis;

// Toggle for performance logging (set to true for benchmarking)
const PERF_LOGGING_ENABLED = true;

/**
 * Log performance metrics for a specific controller's state.
 *
 * @param controllerName - The name of the controller
 * @param data - The serialized data
 * @param readTime - Time spent reading from storage
 * @param parseTime - Time spent parsing JSON (optional)
 */
function logControllerReadPerf(
  controllerName: string,
  data: string,
  readTime: number,
  parseTime?: number,
): void {
  if (!PERF_LOGGING_ENABLED) {
    return;
  }
  // Only log for TokenListController
  if (controllerName !== 'TokenListController') {
    return;
  }
  const sizeKB = (data.length / 1024).toFixed(2);
  const totalTime = parseTime !== undefined ? readTime + parseTime : readTime;
  console.warn(
    `[ControllerStorage PERF] ${controllerName} - ${sizeKB}KB - ` +
      `read: ${readTime.toFixed(2)}ms` +
      (parseTime !== undefined ? `, parse: ${parseTime.toFixed(2)}ms` : '') +
      `, total: ${totalTime.toFixed(2)}ms`,
  );
}

/**
 * Log performance metrics for writing a controller's state.
 *
 * @param controllerName - The name of the controller
 * @param data - The value being written
 * @param stringifyTime - Time spent stringifying
 * @param writeTime - Time spent writing to storage
 */
function logControllerWritePerf(
  controllerName: string,
  data: unknown,
  stringifyTime: number,
  writeTime: number,
): void {
  if (!PERF_LOGGING_ENABLED) {
    return;
  }
  // Only log for TokenListController
  if (controllerName !== 'TokenListController') {
    return;
  }
  const serialized = JSON.stringify(data);
  const sizeKB = (serialized.length / 1024).toFixed(2);
  const totalTime = stringifyTime + writeTime;
  console.warn(
    `[ControllerStorage PERF] setItem ${controllerName} - ${sizeKB}KB - ` +
      `stringify: ${stringifyTime.toFixed(2)}ms, ` +
      `write: ${writeTime.toFixed(2)}ms, ` +
      `total: ${totalTime.toFixed(2)}ms`,
  );
}

/**
 * An implementation of the MetaMask Extension BaseStore system that uses the
 * browser.storage.local API to persist and retrieve state.
 */
export default class ExtensionStore implements BaseStore {
  isSupported: boolean;

  constructor() {
    this.isSupported = Boolean(browser.storage.local);
    if (!this.isSupported) {
      log.error('Storage local API not available.');
    }
  }

  #manifest: Set<string> = new Set();

  /**
   * Return all data in `local` extension storage area.
   *
   * @returns All data stored`local` extension storage area.
   */
  async get(): Promise<MetaMaskStorageStructure | null> {
    if (!this.isSupported) {
      log.error('Storage local API not available.');
      return null;
    }
    const { local } = browser.storage;
    const totalStart = performance.now();
    if (PERF_LOGGING_ENABLED) {
      console.warn('[ControllerStorage PERF] getAllPersistedState started');
    }
    console.time('[ExtensionStore]: Reading from local store');
    // don't fetch more than we need, in case extra stuff was put in the db
    // by testing or users playing with the db
    const response = await local.get(['manifest']);
    if (
      isObject(response) &&
      hasProperty(response, 'manifest') &&
      Array.isArray(response.manifest)
    ) {
      const keys = response.manifest;

      // get all keys from the manifest, and load those keys
      const readStart = performance.now();
      const data = await local.get(keys);
      const readDuration = performance.now() - readStart;

      this.#manifest = new Set(keys);
      const { meta } = data;
      delete data.meta;

      // Log per-controller performance for TokenListController
      if (PERF_LOGGING_ENABLED && 'TokenListController' in data) {
        const controllerData = JSON.stringify(data.TokenListController);
        logControllerReadPerf(
          'TokenListController',
          controllerData,
          readDuration,
        );
      }

      console.timeEnd('[ExtensionStore]: Reading from local store');
      if (PERF_LOGGING_ENABLED) {
        const totalDuration = performance.now() - totalStart;
        console.warn(
          `[ControllerStorage PERF] getAllPersistedState complete - ${totalDuration.toFixed(2)}ms`,
        );
      }
      return {
        data,
        meta: meta as unknown as MetaData,
      };
    }

    // don't fetch more than we need, in case extra stuff was put in the db
    // by testing or users playing with the db
    const solidResponse = await local.get(['data', 'meta']);
    if (isObject(solidResponse)) {
      for (const key of Object.keys(solidResponse)) {
        // we loop because we don't always have all the keys (like on a brand new
        // install and sometimes due to apparent state corruption)
        this.#manifest.add(key);
      }
    }
    console.timeEnd('[ExtensionStore]: Reading from local store');
    if (PERF_LOGGING_ENABLED) {
      const totalDuration = performance.now() - totalStart;
      console.warn(
        `[ControllerStorage PERF] getAllPersistedState complete - ${totalDuration.toFixed(2)}ms`,
      );
    }
    return solidResponse;
  }

  async setKeyValues(pairs: Map<string, unknown>): Promise<void> {
    if (!this.isSupported) {
      throw new Error(
        'MetaMask - cannot persist state to local store as this browser does not support this action',
      );
    }

    const { local } = browser.storage;
    const toSet: Record<string, unknown> = Object.create(null);
    const toRemove: string[] = [];
    const changeOps: { op: 'add' | 'delete'; key: string }[] = [];

    // Track TokenListController for perf logging
    let tokenListControllerValue: unknown;
    let tokenListStringifyTime = 0;

    for (const [key, value] of pairs) {
      const keyExists = this.#manifest.has(key);
      const isRemoving = typeof value === 'undefined';
      if (isRemoving) {
        if (!keyExists) {
          log.warn(
            '[ExtensionStore]: Trying to remove a key that does not exist in manifest:',
            key,
          );
          continue;
        }
        changeOps.push({ op: 'delete', key });
        toRemove.push(key);
        continue;
      }
      if (!keyExists) {
        changeOps.push({ op: 'add', key });
      }

      // Measure stringify time for TokenListController
      if (PERF_LOGGING_ENABLED && key === 'TokenListController') {
        tokenListControllerValue = value;
        const stringifyStart = performance.now();
        JSON.stringify(value);
        tokenListStringifyTime = performance.now() - stringifyStart;
      }

      toSet[key] = value;
    }

    const updateManifest = changeOps.length > 0;
    let newManifest: Set<string> | undefined;
    if (updateManifest) {
      // apply any manifest changes to the `toSet` object
      newManifest = new Set(this.#manifest);
      for (const { op, key } of changeOps) {
        newManifest[op](key);
      }
      toSet.manifest = Array.from(newManifest);
    }

    console.time('[ExtensionStore]: Writing to local store');
    log.info(
      `[ExtensionStore]: Writing ${Object.keys(toSet).length} keys to local store`,
    );

    const writeStart = performance.now();
    await local.set(toSet);
    const writeTime = performance.now() - writeStart;

    // Log TokenListController write performance
    if (PERF_LOGGING_ENABLED && tokenListControllerValue !== undefined) {
      logControllerWritePerf(
        'TokenListController',
        tokenListControllerValue,
        tokenListStringifyTime,
        writeTime,
      );
    }

    if (newManifest) {
      // once we know the set was successful, update our in-memory manifest
      this.#manifest = newManifest;
    }
    log.info(
      `[ExtensionStore]: Removing ${toRemove.length} keys from local store`,
    );
    // we cannot set and remove keys in one operation, so we do two operations.
    // This helps clear out old data and save space, but if it fails we can
    // still function.
    try {
      await local.remove(toRemove);
    } catch (error) {
      if (sentry) {
        const sentryError = new AggregateError(
          [error],
          'Error removing keys from local store',
        );
        sentry.captureException(sentryError);
      }
      log.error(
        '[ExtensionStore]: Error removing keys from local store:',
        error,
      );
    }
    console.timeEnd('[ExtensionStore]: Writing to local store');
  }

  /**
   * Overwrite data in `local` extension storage area
   *
   * @param data - The data to set
   * @param data.data - The MetaMask State tree
   * @param data.meta - The metadata object
   */
  async set({ data, meta }: Required<MetaMaskStorageStructure>): Promise<void> {
    if (!this.isSupported) {
      throw new Error(
        'MetaMask - cannot persist state to local store as this browser does not support this action',
      );
    }

    const { local } = browser.storage;
    const perfStart = performance.now();

    // PERF: Log TokenListController size (should be tiny on PR branch - no cache!)
    if (
      PERF_LOGGING_ENABLED &&
      isObject(data) &&
      hasProperty(data, 'TokenListController')
    ) {
      const tlcSize = (
        JSON.stringify(data.TokenListController).length / 1024
      ).toFixed(2);
      console.warn(
        `[ControllerStorage PERF] set() - TokenListController size: ${tlcSize}KB`,
      );
    }

    console.time('[ExtensionStore]: Overwriting local store');
    await local.set({ data, meta });
    // we ensure we keep track of data and meta in the manifest if we need to
    // reset later
    this.#manifest.add('data');
    this.#manifest.add('meta');
    console.timeEnd('[ExtensionStore]: Overwriting local store');

    // PERF: Log total state size written
    if (PERF_LOGGING_ENABLED) {
      const elapsed = performance.now() - perfStart;
      const totalSize = (JSON.stringify({ data, meta }).length / 1024).toFixed(
        2,
      );
      console.warn(
        `[ControllerStorage PERF] set() complete - ${totalSize}KB - ${elapsed.toFixed(2)}ms`,
      );
    }
  }

  /**
   * Removes all keys contained in the manifest from the `local` extension
   * storage area.
   */
  async reset(): Promise<void> {
    if (!this.isSupported) {
      throw new Error(
        'MetaMask - cannot persist state to local store as this browser does not support this action',
      );
    }
    const { local } = browser.storage;
    return await local.remove(['manifest', ...this.#manifest]);
  }
}
```

---

### Main Branch: Complete `extension-store.ts` with logging

**File path:** `app/scripts/lib/stores/extension-store.ts`

For comparison testing on main branch, **replace the entire file** with this version:

```typescript
import browser from 'webextension-polyfill';
import log from 'loglevel';
import { hasProperty, isObject } from '@metamask/utils';
import type {
  MetaMaskStorageStructure,
  BaseStore,
  MetaData,
} from './base-store';

const { sentry } = globalThis;

// ============ PERF LOGGING (for testing) ============
const PERF_LOGGING_ENABLED = true;

function getSizeKB(obj: unknown): string {
  try {
    const str = JSON.stringify(obj);
    return (str.length / 1024).toFixed(2);
  } catch {
    return 'N/A';
  }
}

function logControllerReadPerf(
  controllerName: string,
  data: unknown,
  timeMs: number,
): void {
  if (!PERF_LOGGING_ENABLED) {
    return;
  }
  const sizeKB = getSizeKB(data);
  console.warn(
    `[ControllerStorage PERF] ${controllerName} read - ${sizeKB}KB - ${timeMs.toFixed(2)}ms`,
  );
}
// ============ END PERF LOGGING ============

/**
 * An implementation of the MetaMask Extension BaseStore system that uses the
 * browser.storage.local API to persist and retrieve state.
 */
export default class ExtensionStore implements BaseStore {
  isSupported: boolean;

  constructor() {
    this.isSupported = Boolean(browser.storage.local);
    if (!this.isSupported) {
      log.error('Storage local API not available.');
    }
  }

  #manifest: Set<string> = new Set();

  /**
   * Return all data in `local` extension storage area.
   *
   * @returns All data stored`local` extension storage area.
   */
  async get(): Promise<MetaMaskStorageStructure | null> {
    if (!this.isSupported) {
      log.error('Storage local API not available.');
      return null;
    }
    const { local } = browser.storage;
    const totalStart = performance.now();
    if (PERF_LOGGING_ENABLED) {
      console.warn('[ControllerStorage PERF] getAllPersistedState started');
    }
    console.time('[ExtensionStore]: Reading from local store');
    // don't fetch more than we need, in case extra stuff was put in the db
    // by testing or users playing with the db
    const response = await local.get(['manifest']);
    if (
      isObject(response) &&
      hasProperty(response, 'manifest') &&
      Array.isArray(response.manifest)
    ) {
      const keys = response.manifest;

      // get all keys from the manifest, and load those keys
      const readStart = performance.now();
      const data = await local.get(keys);
      const readDuration = performance.now() - readStart;

      this.#manifest = new Set(keys);
      const { meta } = data;
      delete data.meta;

      // PERF: Log TokenListController read
      if (PERF_LOGGING_ENABLED && 'TokenListController' in data) {
        logControllerReadPerf(
          'TokenListController',
          data.TokenListController,
          readDuration,
        );
      }

      console.timeEnd('[ExtensionStore]: Reading from local store');
      if (PERF_LOGGING_ENABLED) {
        const totalDuration = performance.now() - totalStart;
        console.warn(
          `[ControllerStorage PERF] getAllPersistedState complete - ${totalDuration.toFixed(2)}ms`,
        );
      }
      return {
        data,
        meta: meta as unknown as MetaData,
      };
    }

    // don't fetch more than we need, in case extra stuff was put in the db
    // by testing or users playing with the db
    const solidResponse = await local.get(['data', 'meta']);
    if (isObject(solidResponse)) {
      for (const key of Object.keys(solidResponse)) {
        // we loop because we don't always have all the keys (like on a brand new
        // install and sometimes due to apparent state corruption)
        this.#manifest.add(key);
      }
    }
    console.timeEnd('[ExtensionStore]: Reading from local store');
    if (PERF_LOGGING_ENABLED) {
      const totalDuration = performance.now() - totalStart;
      console.warn(
        `[ControllerStorage PERF] getAllPersistedState complete - ${totalDuration.toFixed(2)}ms`,
      );
    }
    return solidResponse;
  }

  async setKeyValues(pairs: Map<string, unknown>): Promise<void> {
    if (!this.isSupported) {
      throw new Error(
        'MetaMask - cannot persist state to local store as this browser does not support this action',
      );
    }

    const { local } = browser.storage;
    const toSet: Record<string, unknown> = Object.create(null);
    const toRemove: string[] = [];
    const changeOps: { op: 'add' | 'delete'; key: string }[] = [];

    for (const [key, value] of pairs) {
      const keyExists = this.#manifest.has(key);
      const isRemoving = typeof value === 'undefined';
      if (isRemoving) {
        if (!keyExists) {
          log.warn(
            '[ExtensionStore]: Trying to remove a key that does not exist in manifest:',
            key,
          );
          continue;
        }
        changeOps.push({ op: 'delete', key });
        toRemove.push(key);
        continue;
      }
      if (!keyExists) {
        changeOps.push({ op: 'add', key });
      }
      toSet[key] = value;
    }

    const updateManifest = changeOps.length > 0;
    let newManifest: Set<string> | undefined;
    if (updateManifest) {
      // apply any manifest changes to the `toSet` object
      newManifest = new Set(this.#manifest);
      for (const { op, key } of changeOps) {
        newManifest[op](key);
      }
      toSet.manifest = Array.from(newManifest);
    }

    console.time('[ExtensionStore]: Writing to local store');
    log.info(
      `[ExtensionStore]: Writing ${Object.keys(toSet).length} keys to local store`,
    );
    await local.set(toSet);

    if (newManifest) {
      // once we know the set was successful, update our in-memory manifest
      this.#manifest = newManifest;
    }
    log.info(
      `[ExtensionStore]: Removing ${toRemove.length} keys from local store`,
    );
    // we cannot set and remove keys in one operation, so we do two operations.
    // This helps clear out old data and save space, but if it fails we can
    // still function.
    try {
      await local.remove(toRemove);
    } catch (error) {
      if (sentry) {
        const sentryError = new AggregateError(
          [error],
          'Error removing keys from local store',
        );
        sentry.captureException(sentryError);
      }
      log.error(
        '[ExtensionStore]: Error removing keys from local store:',
        error,
      );
    }
    console.timeEnd('[ExtensionStore]: Writing to local store');
  }

  /**
   * Overwrite data in `local` extension storage area
   *
   * @param data - The data to set
   * @param data.data - The MetaMask State tree
   * @param data.meta - The metadata object
   */
  async set({ data, meta }: Required<MetaMaskStorageStructure>): Promise<void> {
    if (!this.isSupported) {
      throw new Error(
        'MetaMask - cannot persist state to local store as this browser does not support this action',
      );
    }

    const { local } = browser.storage;
    const perfStart = performance.now();

    // PERF: Log TokenListController size before write
    if (
      PERF_LOGGING_ENABLED &&
      isObject(data) &&
      hasProperty(data, 'TokenListController')
    ) {
      const tlcSize = getSizeKB(data.TokenListController);
      console.warn(
        `[ControllerStorage PERF] set() - TokenListController size: ${tlcSize}KB`,
      );
    }

    console.time('[ExtensionStore]: Overwriting local store');
    await local.set({ data, meta });
    // we ensure we keep track of data and meta in the manifest if we need to
    // reset later
    this.#manifest.add('data');
    this.#manifest.add('meta');
    console.timeEnd('[ExtensionStore]: Overwriting local store');

    // PERF: Log total write time
    if (PERF_LOGGING_ENABLED) {
      const elapsed = performance.now() - perfStart;
      const totalSize = getSizeKB({ data, meta });
      console.warn(
        `[ControllerStorage PERF] set() complete - ${totalSize}KB - ${elapsed.toFixed(2)}ms`,
      );
    }
  }

  /**
   * Removes all keys contained in the manifest from the `local` extension
   * storage area.
   */
  async reset(): Promise<void> {
    if (!this.isSupported) {
      throw new Error(
        'MetaMask - cannot persist state to local store as this browser does not support this action',
      );
    }
    const { local } = browser.storage;
    return await local.remove(['manifest', ...this.#manifest]);
  }
}
```

---

### Expected Log Output

**This PR - Cold Restart:**

```
[ControllerStorage PERF] getAllPersistedState started
[ControllerStorage PERF] getAllPersistedState complete - 216.00ms
[StorageService PERF] getAllKeys TokenListController - 10 keys found - 351.10ms
[StorageService PERF] getItem TokenListController:tokensChainsCache:0x1 - 2022.39KB - read: 183.60ms
[StorageService PERF] getItem TokenListController:tokensChainsCache:0x38 - 1045.19KB - read: 302.00ms
... (parallel reads for each chain)
```

**This PR - Background Save:**

```
[ControllerStorage PERF] set() - TokenListController size: 0.04KB
[ControllerStorage PERF] set() complete - 23432.23KB - 402.60ms
```

**This PR - Add New Chain:**

```
[StorageService PERF] setItem TokenListController:tokensChainsCache:0x8f - 39.15KB - stringify: 0.00ms, write: 2.40ms, total: 2.40ms
```

**Main Branch - Cold Restart:**

```
[ControllerStorage PERF] getAllPersistedState started
[ControllerStorage PERF] getAllPersistedState complete - 374.30ms
[ControllerStorage PERF] TokenListController read - 4601.13KB - 374.30ms
```

**Main Branch - Background Save:**

```
[ControllerStorage PERF] set() - TokenListController size: 4601.13KB
[ControllerStorage PERF] set() complete - 28036.55KB - 559.30ms
```

**Main Branch - Add New Chain:**

```
[ControllerStorage PERF] set() - TokenListController size: 4757.87KB
[ControllerStorage PERF] set() complete - 28192.12KB - 575.80ms
```

---

### Where to Find Logs

Logs appear in the **Service Worker console**:

1. Go to `chrome://extensions/`
2. Find MetaMask
3. Click "service worker" link
4. Open Console tab
5. Filter by "PERF" to see performance logs

---

### Quick Reference: Enable/Disable Logging

| File                         | Line | Variable               |
| ---------------------------- | ---- | ---------------------- |
| `browser-storage-adapter.ts` | 10   | `PERF_LOGGING_ENABLED` |
| `extension-store.ts`         | 13   | `PERF_LOGGING_ENABLED` |

Set to `true` to enable, `false` to disable.
