import browser from 'webextension-polyfill';
import type { Json } from '@metamask/utils';
import type {
  StorageAdapter,
  StorageGetResult,
} from '@metamask/storage-service';
import { STORAGE_KEY_PREFIX } from '@metamask/storage-service';

const STORAGE_SERVICE_INDEX_KEY_PREFIX = `${STORAGE_KEY_PREFIX}__keyIndex:`;
const STORAGE_SERVICE_KEY_LIST_KEY_PREFIX = `${STORAGE_KEY_PREFIX}__keyList:`;
const STORAGE_SERVICE_VALUE_KEY_PREFIX = `${STORAGE_KEY_PREFIX}__value:`;
const STORAGE_SERVICE_POINTER_KEY_PREFIX = `${STORAGE_KEY_PREFIX}__valuePointer:`;
const STORAGE_SERVICE_NAMESPACE_CLEAR_KEY_PREFIX = `${STORAGE_KEY_PREFIX}__namespaceClear:`;
const STORAGE_SERVICE_INDEX_VERSION = 1;
const STORAGE_SERVICE_INDEX_SLOTS = ['0', '1', '2', '3'] as const;
const STORAGE_SERVICE_KEY_LIST_SLOTS = ['0', '1', '2', '3'] as const;
const STORAGE_SERVICE_POINTER_SLOTS = [
  '0',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
] as const;
const STORAGE_SERVICE_NAMESPACE_CLEAR_SLOTS = ['0', '1', '2', '3'] as const;

type StorageServiceIndex = {
  version: typeof STORAGE_SERVICE_INDEX_VERSION;
  updatedAt: number;
  keys: Record<string, string>;
};

type StorageServicePointer = {
  version: typeof STORAGE_SERVICE_INDEX_VERSION;
  updatedAt: number;
  storageKey: string | null;
};

type StorageServiceKeyList = {
  version: typeof STORAGE_SERVICE_INDEX_VERSION;
  updatedAt: number;
  keys: string[];
};

type StorageServiceNamespaceClearMarker = {
  version: typeof STORAGE_SERVICE_INDEX_VERSION;
  updatedAt: number;
};

type NamespaceIndex = {
  hasIndex: boolean;
  index: Map<string, string>;
  updatedAt: number;
  unreadableIndexKeys: Set<string>;
};

type NamespaceIndexCommit = {
  committedIndexKey: string;
  indexValue: StorageServiceIndex;
};

type NamespaceKeyList = {
  keyList?: StorageServiceKeyList;
  unreadableKeyListKeys: Set<string>;
};

type StorageServicePointerState = {
  pointer?: StorageServicePointer;
  unreadablePointerKeys: Set<string>;
};

type NamespaceClearMarkerState = {
  marker?: StorageServiceNamespaceClearMarker;
  unreadableClearMarkerKeys: Set<string>;
};

const storageServiceNamespaceMutationQueues = new Map<string, Promise<void>>();

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isStorageServiceIndex(value: unknown): value is StorageServiceIndex {
  return (
    isObject(value) &&
    value.version === STORAGE_SERVICE_INDEX_VERSION &&
    typeof value.updatedAt === 'number' &&
    isObject(value.keys) &&
    Object.values(value.keys).every(
      (storageKey) => typeof storageKey === 'string',
    )
  );
}

function isStorageServicePointer(
  value: unknown,
): value is StorageServicePointer {
  return (
    isObject(value) &&
    value.version === STORAGE_SERVICE_INDEX_VERSION &&
    typeof value.updatedAt === 'number' &&
    (typeof value.storageKey === 'string' || value.storageKey === null)
  );
}

function isStorageServiceKeyList(
  value: unknown,
): value is StorageServiceKeyList {
  return (
    isObject(value) &&
    value.version === STORAGE_SERVICE_INDEX_VERSION &&
    typeof value.updatedAt === 'number' &&
    Array.isArray(value.keys) &&
    value.keys.every((key) => typeof key === 'string')
  );
}

function isStorageServiceNamespaceClearMarker(
  value: unknown,
): value is StorageServiceNamespaceClearMarker {
  return (
    isObject(value) &&
    value.version === STORAGE_SERVICE_INDEX_VERSION &&
    typeof value.updatedAt === 'number'
  );
}

function makeStorageKeyId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function makeStorageServiceIndexKey(namespace: string, slot: string): string {
  return `${STORAGE_SERVICE_INDEX_KEY_PREFIX}${encodeURIComponent(
    namespace,
  )}:${slot}`;
}

function makeStorageServiceKeyListKey(namespace: string, slot: string): string {
  return `${STORAGE_SERVICE_KEY_LIST_KEY_PREFIX}${encodeURIComponent(
    namespace,
  )}:${slot}`;
}

function makeStorageServiceKeyListKeys(namespace: string): string[] {
  return STORAGE_SERVICE_KEY_LIST_SLOTS.map((slot) =>
    makeStorageServiceKeyListKey(namespace, slot),
  );
}

function makeStorageServiceValueKey(namespace: string, key: string): string {
  return `${STORAGE_SERVICE_VALUE_KEY_PREFIX}${encodeURIComponent(
    namespace,
  )}:${encodeURIComponent(key)}:${makeStorageKeyId()}`;
}

function isGeneratedStorageServiceValueKey(
  storageKey: string | null | undefined,
): storageKey is string {
  return (
    typeof storageKey === 'string' &&
    storageKey.startsWith(STORAGE_SERVICE_VALUE_KEY_PREFIX)
  );
}

function makeStorageServicePointerKey(
  namespace: string,
  key: string,
  slot: string,
): string {
  return `${STORAGE_SERVICE_POINTER_KEY_PREFIX}${encodeURIComponent(
    namespace,
  )}:${encodeURIComponent(key)}:${slot}`;
}

function makeStorageServicePointerKeys(
  namespace: string,
  key: string,
): string[] {
  return STORAGE_SERVICE_POINTER_SLOTS.map((slot) =>
    makeStorageServicePointerKey(namespace, key, slot),
  );
}

function makeStorageServiceNamespaceClearKey(
  namespace: string,
  slot: string,
): string {
  return `${STORAGE_SERVICE_NAMESPACE_CLEAR_KEY_PREFIX}${encodeURIComponent(
    namespace,
  )}:${slot}`;
}

function makeStorageServiceNamespaceClearKeys(namespace: string): string[] {
  return STORAGE_SERVICE_NAMESPACE_CLEAR_SLOTS.map((slot) =>
    makeStorageServiceNamespaceClearKey(namespace, slot),
  );
}

function toStorageServiceIndexObject(
  index: Map<string, string>,
  updatedAt: number,
): StorageServiceIndex {
  return {
    version: STORAGE_SERVICE_INDEX_VERSION,
    updatedAt,
    keys: Object.fromEntries(index),
  };
}

function toStorageServiceKeyListObject(
  keys: Iterable<string>,
  updatedAt: number,
): StorageServiceKeyList {
  return {
    version: STORAGE_SERVICE_INDEX_VERSION,
    updatedAt,
    keys: [...new Set(keys)],
  };
}

async function runStorageServiceNamespaceMutation<Result>(
  namespace: string,
  operation: () => Promise<Result>,
): Promise<Result> {
  const previousQueue =
    storageServiceNamespaceMutationQueues.get(namespace) ?? Promise.resolve();
  let releaseCurrentQueue: () => void = () => undefined;
  const currentQueue = new Promise<void>((resolve) => {
    releaseCurrentQueue = resolve;
  });
  const nextQueue = previousQueue
    .catch(() => undefined)
    .then(() => currentQueue);
  storageServiceNamespaceMutationQueues.set(namespace, nextQueue);

  await previousQueue.catch(() => undefined);
  try {
    return await operation();
  } finally {
    releaseCurrentQueue();
    if (storageServiceNamespaceMutationQueues.get(namespace) === nextQueue) {
      storageServiceNamespaceMutationQueues.delete(namespace);
    }
  }
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

  #makeIndexKeys(namespace: string): string[] {
    return STORAGE_SERVICE_INDEX_SLOTS.map((slot) =>
      makeStorageServiceIndexKey(namespace, slot),
    );
  }

  async #readStorageServicePointerState(
    namespace: string,
    key: string,
  ): Promise<StorageServicePointerState> {
    const unreadablePointerKeys = new Set<string>();
    const pointers = (
      await Promise.all(
        makeStorageServicePointerKeys(namespace, key).map(
          async (pointerKey) => {
            try {
              const result = await browser.storage.local.get(pointerKey);
              if (isStorageServicePointer(result[pointerKey])) {
                return result[pointerKey];
              }
            } catch (error) {
              unreadablePointerKeys.add(pointerKey);
              console.error(
                `StorageService: Failed to get value pointer for ${namespace}:${key}`,
                error,
              );
            }
            return undefined;
          },
        ),
      )
    ).filter(
      (pointer): pointer is StorageServicePointer => pointer !== undefined,
    );

    return {
      pointer: pointers.reduce<StorageServicePointer | undefined>(
        (latest, current) =>
          !latest || current.updatedAt >= latest.updatedAt ? current : latest,
        undefined,
      ),
      unreadablePointerKeys,
    };
  }

  async #readStorageServicePointer(
    namespace: string,
    key: string,
  ): Promise<StorageServicePointer | undefined> {
    return (await this.#readStorageServicePointerState(namespace, key)).pointer;
  }

  async #readStorageServiceKeyListState(
    namespace: string,
  ): Promise<NamespaceKeyList> {
    const unreadableKeyListKeys = new Set<string>();
    const keyLists = (
      await Promise.all(
        makeStorageServiceKeyListKeys(namespace).map(async (keyListKey) => {
          try {
            const result = await browser.storage.local.get(keyListKey);
            if (isStorageServiceKeyList(result[keyListKey])) {
              return result[keyListKey];
            }
          } catch (error) {
            unreadableKeyListKeys.add(keyListKey);
            console.error(
              `StorageService: Failed to get key list for ${namespace}`,
              error,
            );
          }
          return undefined;
        }),
      )
    ).filter(
      (keyList): keyList is StorageServiceKeyList => keyList !== undefined,
    );

    const latestKeyList = keyLists.reduce<StorageServiceKeyList | undefined>(
      (latest, current) =>
        !latest || current.updatedAt >= latest.updatedAt ? current : latest,
      undefined,
    );
    if (!latestKeyList) {
      return { unreadableKeyListKeys };
    }
    return {
      keyList: {
        ...latestKeyList,
        keys: [...new Set(latestKeyList.keys)],
      },
      unreadableKeyListKeys,
    };
  }

  async #readStorageServiceKeyList(
    namespace: string,
  ): Promise<StorageServiceKeyList | undefined> {
    return (await this.#readStorageServiceKeyListState(namespace)).keyList;
  }

  async #readStorageServiceNamespaceClearMarkerState(
    namespace: string,
  ): Promise<NamespaceClearMarkerState> {
    const unreadableClearMarkerKeys = new Set<string>();
    const markers = (
      await Promise.all(
        makeStorageServiceNamespaceClearKeys(namespace).map(
          async (markerKey) => {
            try {
              const result = await browser.storage.local.get(markerKey);
              if (isStorageServiceNamespaceClearMarker(result[markerKey])) {
                return result[markerKey];
              }
            } catch (error) {
              unreadableClearMarkerKeys.add(markerKey);
              console.error(
                `StorageService: Failed to get namespace clear marker for ${namespace}`,
                error,
              );
            }
            return undefined;
          },
        ),
      )
    ).filter(
      (marker): marker is StorageServiceNamespaceClearMarker =>
        marker !== undefined,
    );

    return {
      marker: markers.reduce<StorageServiceNamespaceClearMarker | undefined>(
        (latest, current) =>
          !latest || current.updatedAt >= latest.updatedAt ? current : latest,
        undefined,
      ),
      unreadableClearMarkerKeys,
    };
  }

  async #readStorageServiceNamespaceClearMarker(
    namespace: string,
  ): Promise<StorageServiceNamespaceClearMarker | undefined> {
    return (await this.#readStorageServiceNamespaceClearMarkerState(namespace))
      .marker;
  }

  async #readNamespaceIndex(namespace: string): Promise<NamespaceIndex> {
    const indexKeys = this.#makeIndexKeys(namespace);
    const unreadableIndexKeys = new Set<string>();

    const indexes = (
      await Promise.all(
        indexKeys.map(async (indexKey) => {
          try {
            const result = await browser.storage.local.get(indexKey);
            if (isStorageServiceIndex(result[indexKey])) {
              return result[indexKey];
            }
          } catch (error) {
            unreadableIndexKeys.add(indexKey);
            console.error(
              `StorageService: Failed to get key index for ${namespace}`,
              error,
            );
          }
          return undefined;
        }),
      )
    ).filter((index): index is StorageServiceIndex => index !== undefined);

    if (indexes.length === 0) {
      return {
        hasIndex: false,
        index: new Map(),
        updatedAt: 0,
        unreadableIndexKeys,
      };
    }

    const latestIndex = indexes.reduce((latest, current) =>
      current.updatedAt >= latest.updatedAt ? current : latest,
    );

    return {
      hasIndex: true,
      index: new Map(Object.entries(latestIndex.keys)),
      updatedAt: latestIndex.updatedAt,
      unreadableIndexKeys,
    };
  }

  async #commitNamespaceIndex(
    namespace: string,
    index: Map<string, string>,
    previousUpdatedAt: number,
    unreadableIndexKeys: Set<string>,
    values: Record<string, Json> = {},
  ): Promise<NamespaceIndexCommit> {
    const indexValue = toStorageServiceIndexObject(
      index,
      Math.max(Date.now(), previousUpdatedAt + 1),
    );
    const indexKeys = this.#makeIndexKeys(namespace);
    const writableIndexKeys = indexKeys.filter(
      (indexKey) => !unreadableIndexKeys.has(indexKey),
    );
    const candidateIndexKeys =
      writableIndexKeys.length > 0 ? writableIndexKeys : indexKeys;
    const errors: unknown[] = [];

    for (const indexKey of candidateIndexKeys) {
      try {
        await browser.storage.local.set({
          ...values,
          [indexKey]: indexValue,
        });
        return { committedIndexKey: indexKey, indexValue };
      } catch (error) {
        errors.push(error);
        unreadableIndexKeys.add(indexKey);
        console.error(
          `StorageService: Failed to set key index for ${namespace}`,
          error,
        );
      }
    }

    const errorMessage = errors
      .map((error) => (error instanceof Error ? error.message : String(error)))
      .join('; ');

    throw new AggregateError(
      errors,
      `StorageService: Failed to set key index for ${namespace}: ${errorMessage}`,
    );
  }

  async #setKeysBestEffort(
    values: Record<
      string,
      | Json
      | StorageServicePointer
      | StorageServiceKeyList
      | StorageServiceNamespaceClearMarker
    >,
    message: string,
  ): Promise<void> {
    const entries = Object.entries(values);
    if (entries.length === 0) {
      return;
    }

    try {
      await browser.storage.local.set(values);
      return;
    } catch (error) {
      console.error(message, error);
    }

    for (const [key, value] of entries) {
      try {
        await browser.storage.local.set({ [key]: value });
      } catch (error) {
        console.error(`StorageService: Failed to set key ${key}`, error);
      }
    }
  }

  async #setStorageServicePointerBestEffort(
    namespace: string,
    key: string,
    storageKey: string | null,
    updatedAt: number,
  ): Promise<void> {
    const pointer: StorageServicePointer = {
      version: STORAGE_SERVICE_INDEX_VERSION,
      updatedAt,
      storageKey,
    };
    const pointers = Object.fromEntries(
      makeStorageServicePointerKeys(namespace, key).map((pointerKey) => [
        pointerKey,
        pointer,
      ]),
    );
    await this.#setKeysBestEffort(
      pointers,
      `StorageService: Failed to set value pointers for ${namespace}:${key}`,
    );
  }

  async #setStorageServicePointerTombstonesBestEffort(
    namespace: string,
    keys: Iterable<string>,
    updatedAt: number,
  ): Promise<void> {
    const pointer: StorageServicePointer = {
      version: STORAGE_SERVICE_INDEX_VERSION,
      updatedAt,
      storageKey: null,
    };
    const pointers = Object.fromEntries(
      [...new Set(keys)].flatMap((key) =>
        makeStorageServicePointerKeys(namespace, key).map((pointerKey) => [
          pointerKey,
          pointer,
        ]),
      ),
    );
    await this.#setKeysBestEffort(
      pointers,
      `StorageService: Failed to set value pointer tombstones for ${namespace}`,
    );
  }

  async #setStorageServiceKeyListBestEffort(
    namespace: string,
    keys: Iterable<string>,
    updatedAt: number,
  ): Promise<void> {
    const keyList = toStorageServiceKeyListObject(keys, updatedAt);
    const keyLists = Object.fromEntries(
      makeStorageServiceKeyListKeys(namespace).map((keyListKey) => [
        keyListKey,
        keyList,
      ]),
    );
    await this.#setKeysBestEffort(
      keyLists,
      `StorageService: Failed to set key lists for ${namespace}`,
    );
  }

  async #setStorageServiceNamespaceClearMarkerBestEffort(
    namespace: string,
    updatedAt: number,
  ): Promise<void> {
    const marker: StorageServiceNamespaceClearMarker = {
      version: STORAGE_SERVICE_INDEX_VERSION,
      updatedAt,
    };
    const markers = Object.fromEntries(
      makeStorageServiceNamespaceClearKeys(namespace).map((markerKey) => [
        markerKey,
        marker,
      ]),
    );
    await this.#setKeysBestEffort(
      markers,
      `StorageService: Failed to set namespace clear markers for ${namespace}`,
    );
  }

  async #mirrorNamespaceIndex(
    namespace: string,
    indexValue: StorageServiceIndex,
    committedIndexKey: string,
    unreadableIndexKeys: Set<string>,
  ): Promise<void> {
    for (const indexKey of this.#makeIndexKeys(namespace)) {
      if (indexKey === committedIndexKey || unreadableIndexKeys.has(indexKey)) {
        continue;
      }

      try {
        await browser.storage.local.set({ [indexKey]: indexValue });
      } catch (error) {
        console.error(
          `StorageService: Failed to mirror key index for ${namespace}`,
          error,
        );
      }
    }
  }

  async #removeKeysBestEffort(keys: string[]): Promise<void> {
    const fullKeys = [...new Set(keys)];
    if (fullKeys.length === 0) {
      return;
    }

    for (const fullKey of fullKeys) {
      try {
        await browser.storage.local.remove(fullKey);
      } catch (error) {
        console.error(`StorageService: Failed to remove key ${fullKey}`, error);
      }
    }
  }

  async #filterKeysUsingPointers(
    namespace: string,
    keys: string[],
    minimumUpdatedAt: number,
    clearUpdatedAt: number,
  ): Promise<string[]> {
    const filteredKeys = await Promise.all(
      keys.map(async (key) => {
        const pointer = await this.#readStorageServicePointer(namespace, key);
        if (
          pointer &&
          pointer.storageKey === null &&
          pointer.updatedAt >= minimumUpdatedAt &&
          pointer.updatedAt > clearUpdatedAt
        ) {
          return undefined;
        }
        return key;
      }),
    );

    return filteredKeys.filter((key): key is string => key !== undefined);
  }

  async #getItem(
    namespace: string,
    key: string,
    allowLegacyFallback: boolean,
  ): Promise<StorageGetResult> {
    try {
      const [namespaceIndex, pointerState, namespaceClearMarkerState] =
        await Promise.all([
          this.#readNamespaceIndex(namespace),
          this.#readStorageServicePointerState(namespace, key),
          this.#readStorageServiceNamespaceClearMarkerState(namespace),
        ]);
      const { pointer } = pointerState;
      const namespaceClearMarker = namespaceClearMarkerState.marker;
      const legacyKey = this.#makeKey(namespace, key);
      const clearUpdatedAt = namespaceClearMarker?.updatedAt ?? -1;
      let fullKey = namespaceIndex.index.get(key);
      const hasGeneratedNamespaceMetadata =
        namespaceIndex.hasIndex ||
        namespaceIndex.unreadableIndexKeys.size > 0 ||
        pointerState.unreadablePointerKeys.size > 0 ||
        namespaceClearMarkerState.unreadableClearMarkerKeys.size > 0 ||
        namespaceClearMarker !== undefined;

      if (fullKey) {
        if (
          pointer &&
          pointer.updatedAt > namespaceIndex.updatedAt &&
          pointer.updatedAt > clearUpdatedAt
        ) {
          if (!pointer.storageKey) {
            return {};
          }
          fullKey = pointer.storageKey;
        } else if (clearUpdatedAt >= namespaceIndex.updatedAt) {
          return {};
        }
      }

      if (!fullKey) {
        if (
          pointer &&
          pointer.updatedAt >= namespaceIndex.updatedAt &&
          pointer.updatedAt > clearUpdatedAt
        ) {
          if (!pointer.storageKey) {
            return {};
          }
          fullKey = pointer.storageKey;
        } else if (clearUpdatedAt >= namespaceIndex.updatedAt) {
          return {};
        } else if (allowLegacyFallback && !hasGeneratedNamespaceMetadata) {
          const namespaceKeyListState =
            await this.#readStorageServiceKeyListState(namespace);
          if (
            !namespaceKeyListState.keyList &&
            namespaceKeyListState.unreadableKeyListKeys.size === 0
          ) {
            fullKey = legacyKey;
          }
        }
      }

      if (!fullKey) {
        return {};
      }

      let result = await browser.storage.local.get(fullKey);
      if (!(fullKey in result)) {
        if (
          pointer &&
          pointer.storageKey &&
          pointer.storageKey !== fullKey &&
          pointer.updatedAt >= namespaceIndex.updatedAt &&
          pointer.updatedAt > clearUpdatedAt
        ) {
          fullKey = pointer.storageKey;
          result = await browser.storage.local.get(fullKey);
        }
      }

      // Key not found
      if (!(fullKey in result)) {
        return {};
      }

      return { result: result[fullKey] as Json };
    } catch (error) {
      console.error(
        `StorageService: Failed to get item: ${namespace}:${key}`,
        error,
      );
      return { error: error as Error };
    }
  }

  /**
   * Retrieve an item from browser.storage.local.
   *
   * @param namespace - Controller namespace
   * @param key - Data key
   * @returns StorageGetResult: { result } if found, {} if not found, { error } on failure
   */
  async getItem(namespace: string, key: string): Promise<StorageGetResult> {
    return await this.#getItem(namespace, key, true);
  }

  async getGeneratedItem(
    namespace: string,
    key: string,
  ): Promise<StorageGetResult> {
    return await this.#getItem(namespace, key, false);
  }

  async hasGeneratedNamespaceState(
    namespace: string,
    keys: string[] = [],
  ): Promise<boolean> {
    try {
      const [
        namespaceIndex,
        namespaceKeyList,
        namespaceClearMarkerState,
        pointerStates,
      ] = await Promise.all([
        this.#readNamespaceIndex(namespace),
        this.#readStorageServiceKeyListState(namespace),
        this.#readStorageServiceNamespaceClearMarkerState(namespace),
        Promise.all(
          [...new Set(keys)].map((key) =>
            this.#readStorageServicePointerState(namespace, key),
          ),
        ),
      ]);

      return (
        namespaceIndex.hasIndex ||
        namespaceIndex.unreadableIndexKeys.size > 0 ||
        namespaceKeyList.keyList !== undefined ||
        namespaceKeyList.unreadableKeyListKeys.size > 0 ||
        namespaceClearMarkerState.marker !== undefined ||
        namespaceClearMarkerState.unreadableClearMarkerKeys.size > 0 ||
        pointerStates.some(
          ({ pointer, unreadablePointerKeys }) =>
            pointer !== undefined || unreadablePointerKeys.size > 0,
        )
      );
    } catch (error) {
      console.error(
        `StorageService: Failed to detect generated namespace state for ${namespace}`,
        error,
      );
      return true;
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
    await runStorageServiceNamespaceMutation(namespace, async () => {
      try {
        const legacyKey = this.#makeKey(namespace, key);
        const [
          {
            hasIndex,
            index,
            updatedAt: previousIndexUpdatedAt,
            unreadableIndexKeys,
          },
          namespaceKeyList,
          namespaceClearMarker,
          previousPointer,
        ] = await Promise.all([
          this.#readNamespaceIndex(namespace),
          this.#readStorageServiceKeyList(namespace),
          this.#readStorageServiceNamespaceClearMarker(namespace),
          this.#readStorageServicePointer(namespace, key),
        ]);
        const previousUpdatedAt = Math.max(
          previousIndexUpdatedAt,
          namespaceKeyList?.updatedAt ?? 0,
          namespaceClearMarker?.updatedAt ?? 0,
          previousPointer?.updatedAt ?? 0,
        );
        const isNamespaceCleared =
          namespaceClearMarker !== undefined &&
          namespaceClearMarker.updatedAt >=
            Math.max(previousIndexUpdatedAt, namespaceKeyList?.updatedAt ?? 0);
        let logicalKeys: Set<string>;
        if (isNamespaceCleared) {
          logicalKeys = new Set();
        } else if (
          namespaceKeyList &&
          namespaceKeyList.updatedAt >= previousIndexUpdatedAt
        ) {
          logicalKeys = new Set(namespaceKeyList.keys);
        } else {
          logicalKeys = new Set(index.keys());
        }
        const effectiveIndex = isNamespaceCleared
          ? new Map<string, string>()
          : new Map(
              [...index.entries()].filter(([indexedKey]) =>
                logicalKeys.has(indexedKey),
              ),
            );
        const previousStorageKey =
          effectiveIndex.get(key) ??
          previousPointer?.storageKey ??
          (hasIndex && !isNamespaceCleared ? undefined : legacyKey);
        const storageKey = makeStorageServiceValueKey(namespace, key);
        effectiveIndex.set(key, storageKey);
        logicalKeys.add(key);
        let updatedAt: number;
        try {
          const { committedIndexKey, indexValue } =
            await this.#commitNamespaceIndex(
              namespace,
              effectiveIndex,
              previousUpdatedAt,
              unreadableIndexKeys,
              { [storageKey]: value },
            );
          updatedAt = indexValue.updatedAt;
          await this.#mirrorNamespaceIndex(
            namespace,
            indexValue,
            committedIndexKey,
            unreadableIndexKeys,
          );
        } catch (error) {
          console.error(
            `StorageService: Failed to commit key index for ${namespace}:${key}`,
            error,
          );
          updatedAt = Math.max(Date.now(), previousUpdatedAt + 1);
          await browser.storage.local.set({ [storageKey]: value });
        }
        await this.#setStorageServicePointerBestEffort(
          namespace,
          key,
          storageKey,
          updatedAt,
        );
        await this.#setStorageServiceKeyListBestEffort(
          namespace,
          logicalKeys,
          updatedAt,
        );
        await this.#removeKeysBestEffort(
          [previousStorageKey].filter(isGeneratedStorageServiceValueKey),
        );
      } catch (error) {
        console.error(
          `StorageService: Failed to set item: ${namespace}:${key}`,
          error,
        );
        throw error;
      }
    });
  }

  /**
   * Remove an item from browser.storage.local.
   *
   * @param namespace - Controller namespace
   * @param key - Data key
   */
  async removeItem(namespace: string, key: string): Promise<void> {
    await runStorageServiceNamespaceMutation(namespace, async () => {
      try {
        const legacyKey = this.#makeKey(namespace, key);
        const [
          {
            hasIndex,
            index,
            updatedAt: previousIndexUpdatedAt,
            unreadableIndexKeys,
          },
          namespaceKeyList,
          namespaceClearMarker,
          previousPointer,
        ] = await Promise.all([
          this.#readNamespaceIndex(namespace),
          this.#readStorageServiceKeyList(namespace),
          this.#readStorageServiceNamespaceClearMarker(namespace),
          this.#readStorageServicePointer(namespace, key),
        ]);
        const previousUpdatedAt = Math.max(
          previousIndexUpdatedAt,
          namespaceKeyList?.updatedAt ?? 0,
          namespaceClearMarker?.updatedAt ?? 0,
          previousPointer?.updatedAt ?? 0,
        );
        const isNamespaceCleared =
          namespaceClearMarker !== undefined &&
          namespaceClearMarker.updatedAt >=
            Math.max(previousIndexUpdatedAt, namespaceKeyList?.updatedAt ?? 0);
        let logicalKeys: Set<string>;
        if (isNamespaceCleared) {
          logicalKeys = new Set();
        } else if (
          namespaceKeyList &&
          namespaceKeyList.updatedAt >= previousIndexUpdatedAt
        ) {
          logicalKeys = new Set(namespaceKeyList.keys);
        } else {
          logicalKeys = new Set(index.keys());
        }
        const effectiveIndex = isNamespaceCleared
          ? new Map<string, string>()
          : new Map(
              [...index.entries()].filter(([indexedKey]) =>
                logicalKeys.has(indexedKey),
              ),
            );
        const storageKey =
          effectiveIndex.get(key) ??
          previousPointer?.storageKey ??
          (hasIndex && !isNamespaceCleared ? undefined : legacyKey);
        effectiveIndex.delete(key);
        logicalKeys.delete(key);
        let updatedAt = Math.max(Date.now(), previousUpdatedAt + 1);

        try {
          const { committedIndexKey, indexValue } =
            await this.#commitNamespaceIndex(
              namespace,
              effectiveIndex,
              previousUpdatedAt,
              unreadableIndexKeys,
            );
          updatedAt = indexValue.updatedAt;
          await this.#mirrorNamespaceIndex(
            namespace,
            indexValue,
            committedIndexKey,
            unreadableIndexKeys,
          );
        } catch (error) {
          console.error(
            `StorageService: Failed to commit key removal for ${namespace}:${key}`,
            error,
          );
        }

        await this.#setStorageServicePointerBestEffort(
          namespace,
          key,
          null,
          updatedAt,
        );
        await this.#setStorageServiceKeyListBestEffort(
          namespace,
          logicalKeys,
          updatedAt,
        );
        await this.#removeKeysBestEffort(
          [storageKey].filter(isGeneratedStorageServiceValueKey),
        );
      } catch (error) {
        console.error(
          `StorageService: Failed to remove item: ${namespace}:${key}`,
          error,
        );
        throw error;
      }
    });
  }

  /**
   * Get all keys for a namespace.
   * Filters by prefix and strips prefix from returned keys.
   *
   * @param namespace - Controller namespace
   * @returns Array of keys without prefix
   */
  async getAllKeys(namespace: string): Promise<string[]> {
    try {
      const [
        { hasIndex, index, updatedAt },
        namespaceKeyList,
        namespaceClearMarker,
      ] = await Promise.all([
        this.#readNamespaceIndex(namespace),
        this.#readStorageServiceKeyList(namespace),
        this.#readStorageServiceNamespaceClearMarker(namespace),
      ]);
      const clearUpdatedAt = namespaceClearMarker?.updatedAt ?? -1;

      if (
        namespaceKeyList &&
        namespaceKeyList.updatedAt >= updatedAt &&
        namespaceKeyList.updatedAt > clearUpdatedAt
      ) {
        return await this.#filterKeysUsingPointers(
          namespace,
          namespaceKeyList.keys,
          namespaceKeyList.updatedAt,
          clearUpdatedAt,
        );
      }

      if (namespaceClearMarker && namespaceClearMarker.updatedAt >= updatedAt) {
        return [];
      }

      if (hasIndex) {
        return await this.#filterKeysUsingPointers(
          namespace,
          [...index.keys()],
          updatedAt,
          clearUpdatedAt,
        );
      }

      return [];
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
    await runStorageServiceNamespaceMutation(namespace, async () => {
      try {
        const [
          {
            hasIndex,
            index,
            updatedAt: previousUpdatedAt,
            unreadableIndexKeys,
          },
          namespaceKeyList,
          namespaceClearMarker,
        ] = await Promise.all([
          this.#readNamespaceIndex(namespace),
          this.#readStorageServiceKeyList(namespace),
          this.#readStorageServiceNamespaceClearMarker(namespace),
        ]);
        const previousUpdatedAtWithFallback = Math.max(
          previousUpdatedAt,
          namespaceKeyList?.updatedAt ?? 0,
          namespaceClearMarker?.updatedAt ?? 0,
        );
        let updatedAt = Math.max(Date.now(), previousUpdatedAtWithFallback + 1);
        const logicalKeys =
          namespaceKeyList && namespaceKeyList.updatedAt >= previousUpdatedAt
            ? namespaceKeyList.keys
            : [...index.keys()];
        const pointers = await Promise.all(
          logicalKeys.map((logicalKey) =>
            this.#readStorageServicePointer(namespace, logicalKey),
          ),
        );
        const pointerStorageKeys = pointers.flatMap((pointer) =>
          pointer?.storageKey ? [pointer.storageKey] : [],
        );
        const fullKeys = [
          ...(hasIndex ? index.values() : []),
          ...pointerStorageKeys,
        ].filter(isGeneratedStorageServiceValueKey);

        try {
          const { committedIndexKey, indexValue } =
            await this.#commitNamespaceIndex(
              namespace,
              new Map(),
              previousUpdatedAtWithFallback,
              unreadableIndexKeys,
            );
          updatedAt = indexValue.updatedAt;
          await this.#mirrorNamespaceIndex(
            namespace,
            indexValue,
            committedIndexKey,
            unreadableIndexKeys,
          );
        } catch (error) {
          console.error(
            `StorageService: Failed to commit namespace clear for ${namespace}`,
            error,
          );
        }

        await this.#setStorageServiceNamespaceClearMarkerBestEffort(
          namespace,
          updatedAt,
        );
        await this.#setStorageServiceKeyListBestEffort(
          namespace,
          [],
          updatedAt,
        );
        await this.#setStorageServicePointerTombstonesBestEffort(
          namespace,
          logicalKeys,
          updatedAt,
        );

        await this.#removeKeysBestEffort(fullKeys);
      } catch (error) {
        console.error(
          `StorageService: Failed to clear namespace ${namespace}`,
          error,
        );
        throw error;
      }
    });
  }
}
