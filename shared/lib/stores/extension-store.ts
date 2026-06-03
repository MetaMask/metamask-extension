import browser from 'webextension-polyfill';
import log from 'loglevel';
import { hasProperty, isObject } from '@metamask/utils';
import type {
  MetaMaskStorageStructure,
  BaseStore,
  MetaData,
} from './base-store';

const MANIFEST_KEY = 'manifest';
const CHUNK_MANIFEST_KEY = '__metamaskChunkManifest';
const CHUNK_KEY_PREFIX = '__metamaskChunk:';
const STORAGE_KEY_MANIFEST_KEYS = [
  '__metamaskStorageKeyManifest0',
  '__metamaskStorageKeyManifest1',
  '__metamaskStorageKeyManifest2',
  '__metamaskStorageKeyManifest3',
] as const;
const STORAGE_KEY_LIST_KEYS = [
  '__metamaskStorageKeyList0',
  '__metamaskStorageKeyList1',
  '__metamaskStorageKeyList2',
  '__metamaskStorageKeyList3',
] as const;
const STORAGE_KEY_MANIFEST_VERSION = 1;
const STORAGE_KEY_POINTER_PREFIX = '__metamaskStorageKeyPointer:';
const STORAGE_KEY_POINTER_SLOTS = [
  '0',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
] as const;
const STATE_STORAGE_KEY_PREFIX = '__metamaskState:';
const CHUNKED_VALUE_MARKER = 'metamask:chunked-storage-value';
const CHUNKED_VALUE_VERSION = 1;
const CHUNK_SIZE = 512 * 1024;
const CHUNK_WRITE_BATCH_SIZE = 32;
const CRITICAL_STATE_KEYS = new Set(['data', 'meta', 'KeyringController']);

type ChunkedStorageValue = {
  metamaskStorageValue: typeof CHUNKED_VALUE_MARKER;
  version: typeof CHUNKED_VALUE_VERSION;
  chunkKeys: string[];
  stringLength: number;
};

type StorageKeyManifest = {
  version: typeof STORAGE_KEY_MANIFEST_VERSION;
  updatedAt: number;
  storageKeys: Record<string, string>;
};

type StorageKeyList = {
  version: typeof STORAGE_KEY_MANIFEST_VERSION;
  updatedAt: number;
  keys: string[];
};

type StorageKeyPointer = {
  version: typeof STORAGE_KEY_MANIFEST_VERSION;
  updatedAt: number;
  storageKey: string | null;
};

type PreparedStorageValue =
  | {
      value: unknown;
      chunkKeys?: undefined;
      chunks?: undefined;
    }
  | {
      value: ChunkedStorageValue;
      chunkKeys: string[];
      chunks: Record<string, string>;
    };

function getSentry() {
  return globalThis.sentry;
}

function isChunkedStorageValue(value: unknown): value is ChunkedStorageValue {
  return (
    isObject(value) &&
    hasProperty(value, 'metamaskStorageValue') &&
    value.metamaskStorageValue === CHUNKED_VALUE_MARKER &&
    hasProperty(value, 'version') &&
    value.version === CHUNKED_VALUE_VERSION &&
    hasProperty(value, 'chunkKeys') &&
    Array.isArray(value.chunkKeys) &&
    value.chunkKeys.every((key) => typeof key === 'string') &&
    hasProperty(value, 'stringLength') &&
    typeof value.stringLength === 'number'
  );
}

function isStorageKeyManifest(value: unknown): value is StorageKeyManifest {
  return (
    isObject(value) &&
    hasProperty(value, 'version') &&
    value.version === STORAGE_KEY_MANIFEST_VERSION &&
    hasProperty(value, 'updatedAt') &&
    typeof value.updatedAt === 'number' &&
    hasProperty(value, 'storageKeys') &&
    isObject(value.storageKeys) &&
    Object.values(value.storageKeys).every(
      (storageKey) => typeof storageKey === 'string',
    )
  );
}

function isStorageKeyList(value: unknown): value is StorageKeyList {
  return (
    isObject(value) &&
    hasProperty(value, 'version') &&
    value.version === STORAGE_KEY_MANIFEST_VERSION &&
    hasProperty(value, 'updatedAt') &&
    typeof value.updatedAt === 'number' &&
    hasProperty(value, 'keys') &&
    Array.isArray(value.keys) &&
    value.keys.every((key) => typeof key === 'string')
  );
}

function isStorageKeyPointer(value: unknown): value is StorageKeyPointer {
  return (
    isObject(value) &&
    hasProperty(value, 'version') &&
    value.version === STORAGE_KEY_MANIFEST_VERSION &&
    hasProperty(value, 'updatedAt') &&
    typeof value.updatedAt === 'number' &&
    hasProperty(value, 'storageKey') &&
    (typeof value.storageKey === 'string' || value.storageKey === null)
  );
}

function makeStorageKeyId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function makeStateStorageKey(key: string): string {
  return `${STATE_STORAGE_KEY_PREFIX}${encodeURIComponent(
    key,
  )}:${makeStorageKeyId()}`;
}

function isGeneratedStateStorageKey(
  storageKey: string | undefined,
): storageKey is string {
  return (
    typeof storageKey === 'string' &&
    storageKey.startsWith(STATE_STORAGE_KEY_PREFIX)
  );
}

function getStorageKeyClass(key: string): string {
  if (key === MANIFEST_KEY) {
    return 'legacy-manifest';
  }
  if (key === CHUNK_MANIFEST_KEY) {
    return 'legacy-chunk-manifest';
  }
  if ((STORAGE_KEY_MANIFEST_KEYS as readonly string[]).includes(key)) {
    return 'generated-root-manifest';
  }
  if ((STORAGE_KEY_LIST_KEYS as readonly string[]).includes(key)) {
    return 'generated-key-list';
  }
  if (key.startsWith(STORAGE_KEY_POINTER_PREFIX)) {
    return 'generated-pointer';
  }
  if (key.startsWith(STATE_STORAGE_KEY_PREFIX)) {
    return 'generated-state-value';
  }
  if (key.startsWith(CHUNK_KEY_PREFIX)) {
    return 'generated-chunk';
  }
  if (CRITICAL_STATE_KEYS.has(key)) {
    return 'legacy-critical-state';
  }
  return 'legacy-split-state';
}

function makeStorageKeyPointerKey(key: string, slot: string): string {
  return `${STORAGE_KEY_POINTER_PREFIX}${encodeURIComponent(key)}:${slot}`;
}

function makeStorageKeyPointerKeys(key: string): string[] {
  return STORAGE_KEY_POINTER_SLOTS.map((slot) =>
    makeStorageKeyPointerKey(key, slot),
  );
}

function makeChunkKey(key: string, chunkId: string, index: number): string {
  return `${CHUNK_KEY_PREFIX}${encodeURIComponent(key)}:${chunkId}:${index}`;
}

function toStorageKeyManifestObject(
  storageKeyManifest: Map<string, string>,
  updatedAt: number,
): StorageKeyManifest {
  return {
    version: STORAGE_KEY_MANIFEST_VERSION,
    updatedAt,
    storageKeys: Object.fromEntries(storageKeyManifest),
  };
}

function toStorageKeyManifestMap(
  value: StorageKeyManifest,
): Map<string, string> {
  return new Map(Object.entries(value.storageKeys));
}

function captureStorageKeyReadError(key: string, error: unknown) {
  const sentry = getSentry();
  if (!sentry) {
    return;
  }
  const sentryError = new AggregateError(
    [error],
    `Error reading key "${key}" from local store`,
  );
  sentry.captureException(sentryError, {
    tags: {
      'persistence.storage_area': 'local',
      'persistence.storage_operation': 'read',
      'persistence.storage_key_class': getStorageKeyClass(key),
    },
  });
}

function captureStorageChunkReadError(key: string, error: unknown) {
  const sentry = getSentry();
  if (!sentry) {
    return;
  }
  const sentryError = new AggregateError(
    [error],
    `Error reading chunks for key "${key}" from local store`,
  );
  sentry.captureException(sentryError, {
    tags: {
      'persistence.storage_area': 'local',
      'persistence.storage_operation': 'read',
      'persistence.storage_key_class': 'generated-chunk',
    },
  });
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

  #writeQueue: Promise<void> = Promise.resolve();

  #chunkManifest: Map<string, string[]> = new Map();

  #storageKeyManifest: Map<string, string> = new Map();

  #storageKeyManifestSlot: (typeof STORAGE_KEY_MANIFEST_KEYS)[number] =
    STORAGE_KEY_MANIFEST_KEYS[0];

  #storageKeyManifestUpdatedAt: number = 0;

  #unreadableStorageKeyManifestKeys = new Set<string>();

  #unreadableStorageKeyListKeys = new Set<string>();

  #unreadableStorageKeyPointerKeys = new Set<string>();

  #manifestKeyUnreadable: boolean = false;

  async #runWrite<Result>(operation: () => Promise<Result>): Promise<Result> {
    const previousQueue = this.#writeQueue;
    let releaseCurrentQueue: () => void = () => undefined;
    const currentQueue = new Promise<void>((resolve) => {
      releaseCurrentQueue = resolve;
    });
    const nextQueue = previousQueue
      .catch(() => undefined)
      .then(() => currentQueue);
    this.#writeQueue = nextQueue;

    await previousQueue.catch(() => undefined);
    try {
      return await operation();
    } finally {
      releaseCurrentQueue();
      if (this.#writeQueue === nextQueue) {
        this.#writeQueue = Promise.resolve();
      }
    }
  }

  #resolveStorageKey(key: string): string {
    return this.#storageKeyManifest.get(key) ?? key;
  }

  #getStorageKeyManifestWriteKeys(): (typeof STORAGE_KEY_MANIFEST_KEYS)[number][] {
    const readableStorageKeyManifestKeys = STORAGE_KEY_MANIFEST_KEYS.filter(
      (key) => !this.#unreadableStorageKeyManifestKeys.has(key),
    );
    if (readableStorageKeyManifestKeys.length > 0) {
      return readableStorageKeyManifestKeys;
    }
    return [...STORAGE_KEY_MANIFEST_KEYS];
  }

  #getNextStorageKeyManifestUpdatedAt(): number {
    return Math.max(Date.now(), this.#storageKeyManifestUpdatedAt + 1);
  }

  async #readStorageKeyPointers(
    keys: string[],
    replaceStorageKeyManifest = false,
    minimumUpdatedAt = 0,
  ): Promise<boolean> {
    const { local } = browser.storage;
    const storageKeyManifest = replaceStorageKeyManifest
      ? new Map<string, string>()
      : this.#storageKeyManifest;
    let readPointer = false;

    const pointerEntries = await Promise.all(
      keys.map(async (key) => {
        const pointers = (
          await Promise.all(
            makeStorageKeyPointerKeys(key).map(async (pointerKey) => {
              try {
                const response = await local.get([pointerKey]);
                if (
                  isObject(response) &&
                  hasProperty(response, pointerKey) &&
                  isStorageKeyPointer(response[pointerKey])
                ) {
                  return response[pointerKey];
                }
              } catch (error) {
                this.#unreadableStorageKeyPointerKeys.add(pointerKey);
                captureStorageKeyReadError(pointerKey, error);
                log.error(
                  `[ExtensionStore]: Error reading storage key pointer "${pointerKey}":`,
                  error,
                );
              }
              return undefined;
            }),
          )
        ).filter(
          (pointer): pointer is StorageKeyPointer => pointer !== undefined,
        );

        const latestPointer = pointers.reduce<StorageKeyPointer | undefined>(
          (latest, current) =>
            !latest || current.updatedAt >= latest.updatedAt ? current : latest,
          undefined,
        );
        return latestPointer ? ([key, latestPointer] as const) : undefined;
      }),
    );
    for (const pointerEntry of pointerEntries) {
      if (pointerEntry && pointerEntry[1].updatedAt >= minimumUpdatedAt) {
        readPointer = true;
        if (pointerEntry[1].storageKey === null) {
          storageKeyManifest.delete(pointerEntry[0]);
        } else {
          storageKeyManifest.set(pointerEntry[0], pointerEntry[1].storageKey);
        }
      }
    }

    if (replaceStorageKeyManifest) {
      this.#storageKeyManifest = storageKeyManifest;
    }
    return readPointer;
  }

  async #readStorageKeyManifest(): Promise<void> {
    const { local } = browser.storage;

    this.#unreadableStorageKeyManifestKeys.clear();
    const manifests = (
      await Promise.all(
        STORAGE_KEY_MANIFEST_KEYS.map(async (storageKey) => {
          try {
            const response = await local.get([storageKey]);
            if (
              isObject(response) &&
              hasProperty(response, storageKey) &&
              isStorageKeyManifest(response[storageKey])
            ) {
              return {
                storageKey,
                manifest: response[storageKey],
              };
            }
          } catch (error) {
            this.#unreadableStorageKeyManifestKeys.add(storageKey);
            captureStorageKeyReadError(storageKey, error);
            log.error(
              `[ExtensionStore]: Error reading storage key manifest "${storageKey}":`,
              error,
            );
          }
          return undefined;
        }),
      )
    ).filter(
      (
        manifest,
      ): manifest is {
        storageKey: (typeof STORAGE_KEY_MANIFEST_KEYS)[number];
        manifest: StorageKeyManifest;
      } => manifest !== undefined,
    );

    if (manifests.length === 0) {
      if (
        this.#unreadableStorageKeyManifestKeys.size <
        STORAGE_KEY_MANIFEST_KEYS.length
      ) {
        this.#storageKeyManifest = new Map();
        this.#storageKeyManifestUpdatedAt = 0;
        this.#storageKeyManifestSlot = STORAGE_KEY_MANIFEST_KEYS[0];
      }
      return;
    }

    const latestManifest = manifests.reduce((latest, current) => {
      return current.manifest.updatedAt >= latest.manifest.updatedAt
        ? current
        : latest;
    });
    this.#storageKeyManifest = toStorageKeyManifestMap(latestManifest.manifest);
    this.#storageKeyManifestSlot = latestManifest.storageKey;
    this.#storageKeyManifestUpdatedAt = latestManifest.manifest.updatedAt;
  }

  async #readStorageKeyList(): Promise<StorageKeyList | undefined> {
    const { local } = browser.storage;

    this.#unreadableStorageKeyListKeys.clear();
    const keyLists = (
      await Promise.all(
        STORAGE_KEY_LIST_KEYS.map(async (storageKeyListKey) => {
          try {
            const response = await local.get([storageKeyListKey]);
            if (
              isObject(response) &&
              hasProperty(response, storageKeyListKey) &&
              isStorageKeyList(response[storageKeyListKey])
            ) {
              return response[storageKeyListKey];
            }
          } catch (error) {
            this.#unreadableStorageKeyListKeys.add(storageKeyListKey);
            captureStorageKeyReadError(storageKeyListKey, error);
            log.error(
              `[ExtensionStore]: Error reading storage key list "${storageKeyListKey}":`,
              error,
            );
          }
          return undefined;
        }),
      )
    ).filter((keyList): keyList is StorageKeyList => keyList !== undefined);

    if (keyLists.length === 0) {
      return undefined;
    }

    const latestKeyList = keyLists.reduce((latest, current) =>
      current.updatedAt >= latest.updatedAt ? current : latest,
    );
    return {
      ...latestKeyList,
      keys: [...new Set(latestKeyList.keys)],
    };
  }

  async #readLegacyManifest(): Promise<string[] | undefined> {
    const { local } = browser.storage;

    this.#manifestKeyUnreadable = false;
    try {
      const manifestResponse = await local.get([MANIFEST_KEY]);
      if (
        isObject(manifestResponse) &&
        hasProperty(manifestResponse, MANIFEST_KEY) &&
        Array.isArray(manifestResponse[MANIFEST_KEY])
      ) {
        return manifestResponse[MANIFEST_KEY].filter(
          (key): key is string => typeof key === 'string',
        );
      }
    } catch (error) {
      this.#manifestKeyUnreadable = true;
      captureStorageKeyReadError(MANIFEST_KEY, error);
      log.error('[ExtensionStore]: Error reading manifest:', error);
    }
    return undefined;
  }

  async #getStoredValue(key: string): Promise<unknown | undefined> {
    const { local } = browser.storage;
    const storageKey = this.#resolveStorageKey(key);
    let response;
    try {
      response = await local.get([storageKey]);
    } catch (error) {
      captureStorageKeyReadError(storageKey, error);
      throw error;
    }
    if (!isObject(response) || !hasProperty(response, storageKey)) {
      return undefined;
    }
    const value = response[storageKey];
    if (!isChunkedStorageValue(value)) {
      return value;
    }
    this.#chunkManifest.set(key, value.chunkKeys);
    try {
      return await this.#getChunkedValue(key, value);
    } catch (error) {
      captureStorageChunkReadError(key, error);
      throw error;
    }
  }

  async #getChunkedValue(
    key: string,
    descriptor: ChunkedStorageValue,
  ): Promise<unknown> {
    const { local } = browser.storage;
    const serializedChunks = await Promise.all(
      descriptor.chunkKeys.map(async (chunkKey) => {
        let response;
        try {
          response = await local.get([chunkKey]);
        } catch (error) {
          throw new Error(
            `MetaMask - chunk "${chunkKey}" for "${key}" could not be read`,
            { cause: error },
          );
        }
        if (!isObject(response)) {
          throw new Error(
            `MetaMask - chunk "${chunkKey}" for "${key}" is invalid`,
          );
        }
        if (!hasProperty(response, chunkKey)) {
          throw new Error(
            `MetaMask - chunk "${chunkKey}" for "${key}" is missing`,
          );
        }
        const chunk = response[chunkKey];
        if (typeof chunk !== 'string') {
          throw new Error(
            `MetaMask - chunk "${chunkKey}" for "${key}" has invalid type "${typeof chunk}"`,
          );
        }
        return chunk;
      }),
    );
    const serializedValue = serializedChunks.join('');
    if (serializedValue.length !== descriptor.stringLength) {
      throw new Error(`MetaMask - chunk data for "${key}" has invalid length`);
    }
    return JSON.parse(serializedValue);
  }

  async #readChunkKeysForStorageKeys(
    storageKeys: Iterable<string>,
  ): Promise<string[]> {
    const { local } = browser.storage;
    const chunkKeys = new Set<string>();

    await Promise.all(
      [...new Set(storageKeys)].map(async (storageKey) => {
        try {
          const response = await local.get([storageKey]);
          if (
            isObject(response) &&
            hasProperty(response, storageKey) &&
            isChunkedStorageValue(response[storageKey])
          ) {
            for (const chunkKey of response[storageKey].chunkKeys) {
              chunkKeys.add(chunkKey);
            }
          }
        } catch (error) {
          captureStorageKeyReadError(storageKey, error);
          log.error(
            `[ExtensionStore]: Error reading storage key "${storageKey}" before reset:`,
            error,
          );
        }
      }),
    );

    return [...chunkKeys];
  }

  async #getStateKey(
    key: string,
    data: Record<string, unknown>,
  ): Promise<void> {
    try {
      const value = await this.#getStoredValue(key);
      if (typeof value !== 'undefined') {
        data[key] = value;
      }
    } catch (error) {
      log.error(`[ExtensionStore]: Error reading key "${key}":`, error);
      if (CRITICAL_STATE_KEYS.has(key)) {
        throw error;
      }
    }
  }

  #prepareStorageValue(
    storageKey: string,
    value: unknown,
  ): PreparedStorageValue {
    const stringifiedValue = JSON.stringify(value);
    if (
      typeof stringifiedValue !== 'string' ||
      stringifiedValue.length <= CHUNK_SIZE
    ) {
      return { value };
    }

    const chunkId = makeStorageKeyId();
    const chunks: Record<string, string> = Object.create(null);
    const chunkKeys: string[] = [];
    for (
      let offset = 0;
      offset < stringifiedValue.length;
      offset += CHUNK_SIZE
    ) {
      const index = chunkKeys.length;
      const chunkKey = makeChunkKey(storageKey, chunkId, index);
      chunkKeys.push(chunkKey);
      chunks[chunkKey] = stringifiedValue.slice(offset, offset + CHUNK_SIZE);
    }

    return {
      value: {
        metamaskStorageValue: CHUNKED_VALUE_MARKER,
        version: CHUNKED_VALUE_VERSION,
        chunkKeys,
        stringLength: stringifiedValue.length,
      },
      chunkKeys,
      chunks,
    };
  }

  async #setChunks(chunks: Record<string, string>) {
    const { local } = browser.storage;
    const entries = Object.entries(chunks);
    for (
      let index = 0;
      index < entries.length;
      index += CHUNK_WRITE_BATCH_SIZE
    ) {
      const batch = entries.slice(index, index + CHUNK_WRITE_BATCH_SIZE);
      try {
        await local.set(Object.fromEntries(batch));
        continue;
      } catch (error) {
        this.#captureWriteError(
          'Error writing chunk batch to local store',
          error,
          'generated-chunk',
        );
      }

      const errors: unknown[] = [];
      for (const [chunkKey, chunkValue] of batch) {
        try {
          await local.set({ [chunkKey]: chunkValue });
        } catch (error) {
          errors.push(error);
          this.#captureWriteError(
            `Error writing required chunk "${chunkKey}" to local store`,
            error,
            getStorageKeyClass(chunkKey),
          );
        }
      }

      if (errors.length > 0) {
        const errorMessage = errors
          .map((error) =>
            error instanceof Error ? error.message : String(error),
          )
          .join('; ');
        throw new AggregateError(
          errors,
          `MetaMask - could not write chunk data to local store: ${errorMessage}`,
        );
      }
    }
  }

  #captureWriteError(
    message: string,
    error: unknown,
    storageKeyClass?: string,
  ) {
    const sentry = getSentry();
    if (sentry) {
      const sentryError = new AggregateError([error], message);
      const tags: Record<string, string> = {
        'persistence.storage_area': 'local',
        'persistence.storage_operation': 'write',
      };
      if (storageKeyClass) {
        tags['persistence.storage_key_class'] = storageKeyClass;
      }
      sentry.captureException(sentryError, {
        tags,
      });
    }
    log.error(`[ExtensionStore]: ${message}:`, error);
  }

  async #commitStateWrite(
    toSet: Record<string, unknown>,
    storageKeyManifest: StorageKeyManifest,
  ): Promise<(typeof STORAGE_KEY_MANIFEST_KEYS)[number]> {
    const { local } = browser.storage;
    const errors: unknown[] = [];
    for (const storageKeyManifestKey of this.#getStorageKeyManifestWriteKeys()) {
      try {
        await local.set({
          ...toSet,
          [storageKeyManifestKey]: storageKeyManifest,
        });
        return storageKeyManifestKey;
      } catch (error) {
        errors.push(error);
        this.#unreadableStorageKeyManifestKeys.add(storageKeyManifestKey);
        this.#captureWriteError(
          `Error writing storage key manifest "${storageKeyManifestKey}" to local store`,
          error,
          getStorageKeyClass(storageKeyManifestKey),
        );
      }
    }
    const errorMessage = errors
      .map((error) => (error instanceof Error ? error.message : String(error)))
      .join('; ');
    throw new AggregateError(
      errors,
      `MetaMask - could not write storage key manifest to local store: ${errorMessage}`,
    );
  }

  async #mirrorStorageKeyManifest(
    storageKeyManifest: StorageKeyManifest,
    committedStorageKeyManifestKey: string,
  ): Promise<void> {
    const { local } = browser.storage;
    for (const storageKeyManifestKey of this.#getStorageKeyManifestWriteKeys()) {
      if (storageKeyManifestKey === committedStorageKeyManifestKey) {
        continue;
      }
      try {
        await local.set({ [storageKeyManifestKey]: storageKeyManifest });
      } catch (error) {
        this.#unreadableStorageKeyManifestKeys.add(storageKeyManifestKey);
        this.#captureWriteError(
          `Error mirroring storage key manifest "${storageKeyManifestKey}" to local store`,
          error,
          getStorageKeyClass(storageKeyManifestKey),
        );
      }
    }
  }

  async #setKeysBestEffort(
    values: Record<string, unknown>,
    message: string,
    storageKeyClass?: string,
  ): Promise<void> {
    const { local } = browser.storage;
    const entries = Object.entries(values);
    if (entries.length === 0) {
      return;
    }

    try {
      await local.set(values);
      return;
    } catch (error) {
      this.#captureWriteError(message, error, storageKeyClass);
    }

    for (const [key, value] of entries) {
      await this.#setKeyBestEffort(key, value);
    }
  }

  async #setKeysRequired(
    values: Record<string, unknown>,
    message: string,
    storageKeyClass?: string,
  ): Promise<void> {
    const { local } = browser.storage;
    const entries = Object.entries(values);
    if (entries.length === 0) {
      return;
    }

    try {
      await local.set(values);
      return;
    } catch (error) {
      this.#captureWriteError(message, error, storageKeyClass);
    }

    const errors: unknown[] = [];
    for (const [key, value] of entries) {
      try {
        await local.set({ [key]: value });
      } catch (error) {
        errors.push(error);
        this.#captureWriteError(
          `Error writing required key "${key}" to local store`,
          error,
          getStorageKeyClass(key),
        );
      }
    }
    if (errors.length > 0) {
      const errorMessage = errors
        .map((error) =>
          error instanceof Error ? error.message : String(error),
        )
        .join('; ');
      throw new AggregateError(errors, `${message}: ${errorMessage}`);
    }
  }

  async #commitStateWriteWithPointerFallback(
    toSet: Record<string, unknown>,
    storageKeyManifest: StorageKeyManifest,
  ): Promise<(typeof STORAGE_KEY_MANIFEST_KEYS)[number] | undefined> {
    try {
      return await this.#commitStateWrite(toSet, storageKeyManifest);
    } catch (error) {
      this.#captureWriteError(
        'Error writing storage key manifest; writing state values without root manifest',
        error,
        'generated-root-manifest',
      );
      await this.#setKeysRequired(
        toSet,
        'Error writing state values without storage key manifest',
        'generated-state-value',
      );
      return undefined;
    }
  }

  async #setStorageKeyPointersBestEffort(
    storageKeyManifest: Map<string, string>,
    keys: Iterable<string>,
    updatedAt: number,
  ): Promise<void> {
    const pointers: Record<string, StorageKeyPointer> = Object.create(null);
    for (const key of keys) {
      const storageKey = storageKeyManifest.get(key);
      if (!storageKey) {
        continue;
      }
      const pointer: StorageKeyPointer = {
        version: STORAGE_KEY_MANIFEST_VERSION,
        updatedAt,
        storageKey,
      };
      for (const pointerKey of makeStorageKeyPointerKeys(key)) {
        pointers[pointerKey] = pointer;
      }
    }
    await this.#setKeysBestEffort(
      pointers,
      'Error writing storage key pointers to local store',
      'generated-pointer',
    );
  }

  async #setStorageKeyPointerTombstonesBestEffort(
    keys: Iterable<string>,
    updatedAt: number,
  ): Promise<void> {
    const pointers: Record<string, StorageKeyPointer> = Object.create(null);
    for (const key of keys) {
      const pointer: StorageKeyPointer = {
        version: STORAGE_KEY_MANIFEST_VERSION,
        updatedAt,
        storageKey: null,
      };
      for (const pointerKey of makeStorageKeyPointerKeys(key)) {
        pointers[pointerKey] = pointer;
      }
    }
    await this.#setKeysBestEffort(
      pointers,
      'Error writing storage key pointer tombstones to local store',
      'generated-pointer',
    );
  }

  async #setStorageKeyListBestEffort(
    keys: Iterable<string>,
    updatedAt: number,
  ): Promise<void> {
    const keyList: StorageKeyList = {
      version: STORAGE_KEY_MANIFEST_VERSION,
      updatedAt,
      keys: [...new Set(keys)],
    };
    const keyLists = Object.fromEntries(
      STORAGE_KEY_LIST_KEYS.map((storageKeyListKey) => [
        storageKeyListKey,
        keyList,
      ]),
    );
    await this.#setKeysBestEffort(
      keyLists,
      'Error writing storage key list to local store',
      'generated-key-list',
    );
  }

  async #setKeyBestEffort(key: string, value: unknown): Promise<void> {
    const { local } = browser.storage;
    try {
      await local.set({ [key]: value });
    } catch (error) {
      this.#captureWriteError(
        `Error writing auxiliary key "${key}" to local store`,
        error,
        getStorageKeyClass(key),
      );
    }
  }

  async #removeKeysBestEffort(keys: string[]): Promise<void> {
    const { local } = browser.storage;
    const deduplicatedKeys = [...new Set(keys)];
    if (deduplicatedKeys.length === 0) {
      return;
    }

    for (const key of deduplicatedKeys) {
      try {
        await local.remove(key);
      } catch (error) {
        this.#captureWriteError(
          `Error removing key "${key}" from local store`,
          error,
          getStorageKeyClass(key),
        );
      }
    }
  }

  #queueObsoleteStorageForRemoval(key: string, toRemove: string[]): void {
    const storageKey = this.#storageKeyManifest.get(key);
    if (isGeneratedStateStorageKey(storageKey)) {
      toRemove.push(storageKey);
    }
  }

  #queueStorageValue({
    key,
    storageKey,
    value,
    toSet,
    chunksToSet,
    toRemove,
    newChunkManifest,
  }: {
    key: string;
    storageKey: string;
    value: unknown;
    toSet: Record<string, unknown>;
    chunksToSet: Record<string, string>;
    toRemove: string[];
    newChunkManifest: Map<string, string[]>;
  }): void {
    const preparedValue = this.#prepareStorageValue(storageKey, value);
    toSet[storageKey] = preparedValue.value;

    const oldChunkKeys = newChunkManifest.get(key);
    if (oldChunkKeys) {
      toRemove.push(...oldChunkKeys);
    }

    if (preparedValue.chunks) {
      Object.assign(chunksToSet, preparedValue.chunks);
      newChunkManifest.set(key, preparedValue.chunkKeys);
    } else {
      newChunkManifest.delete(key);
    }
  }

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
    console.time('[ExtensionStore]: Reading from local store');
    this.#unreadableStorageKeyPointerKeys.clear();
    // don't fetch more than we need, in case extra stuff was put in the db
    // by testing or users playing with the db
    const storageKeyManifestPromise = this.#readStorageKeyManifest();
    const storageKeyListPromise = this.#readStorageKeyList();
    let manifestKeys: string[] | undefined;
    let readManifestKeys = false;
    const getManifestKeys = async (): Promise<string[] | undefined> => {
      if (!readManifestKeys) {
        manifestKeys = await this.#readLegacyManifest();
        readManifestKeys = true;
      }
      return manifestKeys;
    };

    await storageKeyManifestPromise;
    let storageKeyManifestKeys = [...this.#storageKeyManifest.keys()];
    const storageKeyList = await storageKeyListPromise;
    const hasGeneratedStorageMetadata =
      storageKeyManifestKeys.length > 0 ||
      this.#unreadableStorageKeyManifestKeys.size > 0 ||
      this.#unreadableStorageKeyListKeys.size > 0 ||
      storageKeyList !== undefined;
    let hasGeneratedPointerMetadata = false;
    const updateGeneratedPointerMetadata = (readPointer: boolean) => {
      hasGeneratedPointerMetadata =
        hasGeneratedPointerMetadata ||
        readPointer ||
        this.#unreadableStorageKeyPointerKeys.size > 0;
    };
    if (
      storageKeyManifestKeys.length > 0 &&
      storageKeyList &&
      storageKeyList.updatedAt > this.#storageKeyManifestUpdatedAt
    ) {
      updateGeneratedPointerMetadata(
        await this.#readStorageKeyPointers(storageKeyList.keys, true),
      );
      this.#storageKeyManifestUpdatedAt = storageKeyList.updatedAt;
      storageKeyManifestKeys = [...this.#storageKeyManifest.keys()];
    }
    if (storageKeyManifestKeys.length > 0) {
      updateGeneratedPointerMetadata(
        await this.#readStorageKeyPointers(
          storageKeyManifestKeys,
          false,
          this.#storageKeyManifestUpdatedAt,
        ),
      );
      storageKeyManifestKeys = [...this.#storageKeyManifest.keys()];
    }
    const hasCurrentSplitStorageKeys = storageKeyManifestKeys.some(
      (key) => key !== 'data' && key !== 'meta',
    );
    const hasCurrentDataStorageKeys =
      this.#storageKeyManifest.has('data') &&
      this.#storageKeyManifest.has('meta') &&
      !hasCurrentSplitStorageKeys;
    if (
      storageKeyManifestKeys.length > 0 &&
      !hasCurrentSplitStorageKeys &&
      !hasCurrentDataStorageKeys &&
      storageKeyList === undefined &&
      this.#unreadableStorageKeyListKeys.size > 0
    ) {
      const legacyManifestKeys = await getManifestKeys();
      if (legacyManifestKeys) {
        const previousStorageKeyManifest = new Map(this.#storageKeyManifest);
        const readLegacyManifestPointer = await this.#readStorageKeyPointers(
          legacyManifestKeys,
          true,
          this.#storageKeyManifestUpdatedAt,
        );
        updateGeneratedPointerMetadata(readLegacyManifestPointer);
        if (!readLegacyManifestPointer) {
          this.#storageKeyManifest = previousStorageKeyManifest;
        }
        storageKeyManifestKeys = [...this.#storageKeyManifest.keys()];
      }
    }
    if (storageKeyManifestKeys.length === 0 && storageKeyList) {
      updateGeneratedPointerMetadata(
        await this.#readStorageKeyPointers(storageKeyList.keys, true),
      );
      this.#storageKeyManifestUpdatedAt = storageKeyList.updatedAt;
      storageKeyManifestKeys = [...this.#storageKeyManifest.keys()];
    }
    if (
      storageKeyManifestKeys.length === 0 &&
      storageKeyList === undefined &&
      !hasGeneratedStorageMetadata
    ) {
      updateGeneratedPointerMetadata(
        await this.#readStorageKeyPointers(['data', 'meta']),
      );
      storageKeyManifestKeys = [...this.#storageKeyManifest.keys()];
    }
    if (
      storageKeyManifestKeys.length === 0 &&
      !hasGeneratedStorageMetadata &&
      !hasGeneratedPointerMetadata
    ) {
      const legacyManifestKeys = await getManifestKeys();
      if (legacyManifestKeys) {
        updateGeneratedPointerMetadata(
          await this.#readStorageKeyPointers(legacyManifestKeys),
        );
        if (storageKeyList) {
          this.#storageKeyManifestUpdatedAt = storageKeyList.updatedAt;
        }
        storageKeyManifestKeys = [...this.#storageKeyManifest.keys()];
      }
    }
    const hasSplitStorageKeys = storageKeyManifestKeys.some(
      (key) => key !== 'data' && key !== 'meta',
    );
    let hasDataStorageKeys =
      this.#storageKeyManifest.has('data') &&
      this.#storageKeyManifest.has('meta') &&
      !hasSplitStorageKeys;
    let keys: string[] | undefined;
    if (hasSplitStorageKeys) {
      keys = storageKeyManifestKeys;
    } else if (
      !hasDataStorageKeys &&
      !hasGeneratedStorageMetadata &&
      !hasGeneratedPointerMetadata
    ) {
      keys = await getManifestKeys();
    }

    if (keys) {
      const stateKeys = keys.filter(
        (key): key is string => typeof key === 'string',
      );
      this.#manifest = new Set(stateKeys);
      const data: Record<string, unknown> = Object.create(null);
      await Promise.all(
        stateKeys.map(async (key) => this.#getStateKey(key, data)),
      );
      const { meta } = data;
      delete data.meta;
      console.timeEnd('[ExtensionStore]: Reading from local store');
      return {
        data,
        meta: meta as unknown as MetaData,
      };
    }

    // don't fetch more than we need, in case extra stuff was put in the db
    // by testing or users playing with the db
    if (!hasDataStorageKeys) {
      updateGeneratedPointerMetadata(
        await this.#readStorageKeyPointers(['data', 'meta']),
      );
      const updatedStorageKeyManifestKeys = [
        ...this.#storageKeyManifest.keys(),
      ];
      const hasUpdatedSplitStorageKeys = updatedStorageKeyManifestKeys.some(
        (key) => key !== 'data' && key !== 'meta',
      );
      hasDataStorageKeys =
        this.#storageKeyManifest.has('data') &&
        this.#storageKeyManifest.has('meta') &&
        !hasUpdatedSplitStorageKeys;
    }
    const solidResponse: MetaMaskStorageStructure = {};
    const solidData: Record<string, unknown> = Object.create(null);
    const solidManifest = new Set<string>();
    if (
      hasDataStorageKeys ||
      (!hasGeneratedStorageMetadata && !hasGeneratedPointerMetadata)
    ) {
      await Promise.all([
        this.#getStateKey('data', solidData),
        this.#getStateKey('meta', solidData),
      ]);
    }
    if (hasProperty(solidData, 'data')) {
      solidResponse.data = solidData.data as MetaMaskStorageStructure['data'];
      solidManifest.add('data');
    }
    if (hasProperty(solidData, 'meta')) {
      solidResponse.meta = solidData.meta as MetaData;
      solidManifest.add('meta');
    }
    if (
      (hasGeneratedStorageMetadata || hasGeneratedPointerMetadata) &&
      !hasProperty(solidResponse, 'data') &&
      !hasProperty(solidResponse, 'meta')
    ) {
      throw new Error(
        'MetaMask - could not recover state from generated storage metadata',
      );
    }
    this.#manifest = solidManifest;
    console.timeEnd('[ExtensionStore]: Reading from local store');
    return solidResponse;
  }

  async setKeyValues(pairs: Map<string, unknown>): Promise<void> {
    return await this.#runWrite(async () => {
      if (!this.isSupported) {
        throw new Error(
          'MetaMask - cannot persist state to local store as this browser does not support this action',
        );
      }

      const toSet: Record<string, unknown> = Object.create(null);
      const toRemove: string[] = [];
      const changeOps: { op: 'add' | 'delete'; key: string }[] = [];
      const newChunkManifest = new Map(this.#chunkManifest);
      const newStorageKeyManifest = new Map(this.#storageKeyManifest);
      const storageKeyPointersToSet = new Set<string>();
      const storageKeyPointerTombstonesToSet = new Set<string>();
      for (const key of this.#manifest) {
        if (!newStorageKeyManifest.has(key)) {
          newStorageKeyManifest.set(key, key);
        }
      }
      const chunksToSet: Record<string, string> = Object.create(null);
      let hasChanges = false;
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
          hasChanges = true;
          changeOps.push({ op: 'delete', key });
          this.#queueObsoleteStorageForRemoval(key, toRemove);
          const chunkKeys = newChunkManifest.get(key);
          if (chunkKeys) {
            toRemove.push(...chunkKeys);
            newChunkManifest.delete(key);
          }
          storageKeyPointerTombstonesToSet.add(key);
          newStorageKeyManifest.delete(key);
          continue;
        }
        hasChanges = true;
        if (!keyExists) {
          changeOps.push({ op: 'add', key });
        }
        this.#queueObsoleteStorageForRemoval(key, toRemove);
        const storageKey = makeStateStorageKey(key);
        newStorageKeyManifest.set(key, storageKey);
        storageKeyPointersToSet.add(key);
        this.#queueStorageValue({
          key,
          storageKey,
          value,
          toSet,
          chunksToSet,
          toRemove,
          newChunkManifest,
        });
      }

      if (!hasChanges) {
        return;
      }

      const updateManifest = changeOps.length > 0;
      let newManifest: Set<string> | undefined;
      if (updateManifest) {
        // apply any manifest changes to the `toSet` object
        newManifest = new Set(this.#manifest);
        for (const { op, key } of changeOps) {
          newManifest[op](key);
        }
      }
      const storageKeyManifest = toStorageKeyManifestObject(
        newStorageKeyManifest,
        this.#getNextStorageKeyManifestUpdatedAt(),
      );

      console.time('[ExtensionStore]: Writing to local store');
      await this.#setChunks(chunksToSet);
      log.info(
        `[ExtensionStore]: Writing ${Object.keys(toSet).length} keys to local store`,
      );
      const committedStorageKeyManifestKey =
        await this.#commitStateWriteWithPointerFallback(
          toSet,
          storageKeyManifest,
        );

      if (newManifest) {
        // once we know the set was successful, update our in-memory manifest
        this.#manifest = newManifest;
      }
      this.#storageKeyManifest = newStorageKeyManifest;
      if (committedStorageKeyManifestKey) {
        this.#storageKeyManifestSlot = committedStorageKeyManifestKey;
      }
      this.#storageKeyManifestUpdatedAt = storageKeyManifest.updatedAt;
      this.#chunkManifest = newChunkManifest;
      await this.#setStorageKeyPointersBestEffort(
        newStorageKeyManifest,
        storageKeyPointersToSet,
        storageKeyManifest.updatedAt,
      );
      await this.#setStorageKeyPointerTombstonesBestEffort(
        storageKeyPointerTombstonesToSet,
        storageKeyManifest.updatedAt,
      );
      await this.#setStorageKeyListBestEffort(
        this.#manifest,
        storageKeyManifest.updatedAt,
      );
      if (committedStorageKeyManifestKey) {
        await this.#mirrorStorageKeyManifest(
          storageKeyManifest,
          committedStorageKeyManifestKey,
        );
      }
      log.info(
        `[ExtensionStore]: Removing ${toRemove.length} keys from local store`,
      );
      // we cannot set and remove keys in one operation, so we do two operations.
      // This helps clear out old data and save space, but if it fails we can
      // still function.
      await this.#removeKeysBestEffort(toRemove);
      console.timeEnd('[ExtensionStore]: Writing to local store');
    });
  }

  /**
   * Overwrite data in `local` extension storage area
   *
   * @param data - The data to set
   * @param data.data - The MetaMask State tree
   * @param data.meta - The metadata object
   */
  async set({ data, meta }: Required<MetaMaskStorageStructure>): Promise<void> {
    return await this.#runWrite(async () => {
      if (!this.isSupported) {
        throw new Error(
          'MetaMask - cannot persist state to local store as this browser does not support this action',
        );
      }

      console.time('[ExtensionStore]: Overwriting local store');
      try {
        const dataStorageKey = makeStateStorageKey('data');
        const metaStorageKey = makeStateStorageKey('meta');
        const newChunkManifest = new Map<string, string[]>();
        const newStorageKeyManifest = new Map<string, string>();
        const chunksToSet: Record<string, string> = Object.create(null);
        const toSet: Record<string, unknown> = Object.create(null);
        const storageKeyPointerTombstonesToSet = new Set(
          [...this.#manifest, ...this.#storageKeyManifest.keys()].filter(
            (key) => key !== 'data' && key !== 'meta',
          ),
        );
        const toRemove: string[] = [
          ...[...this.#storageKeyManifest.values()].filter(
            isGeneratedStateStorageKey,
          ),
          ...[...this.#chunkManifest.values()].flat(),
        ];

        newStorageKeyManifest.set('data', dataStorageKey);
        newStorageKeyManifest.set('meta', metaStorageKey);
        this.#queueStorageValue({
          key: 'data',
          storageKey: dataStorageKey,
          value: data,
          toSet,
          chunksToSet,
          toRemove,
          newChunkManifest,
        });
        this.#queueStorageValue({
          key: 'meta',
          storageKey: metaStorageKey,
          value: meta,
          toSet,
          chunksToSet,
          toRemove,
          newChunkManifest,
        });
        const storageKeyManifest = toStorageKeyManifestObject(
          newStorageKeyManifest,
          this.#getNextStorageKeyManifestUpdatedAt(),
        );

        await this.#setChunks(chunksToSet);
        const committedStorageKeyManifestKey =
          await this.#commitStateWriteWithPointerFallback(
            toSet,
            storageKeyManifest,
          );
        // we ensure we keep track of data and meta in the manifest if we need to
        // reset later
        this.#manifest = new Set(['data', 'meta']);
        this.#storageKeyManifest = newStorageKeyManifest;
        if (committedStorageKeyManifestKey) {
          this.#storageKeyManifestSlot = committedStorageKeyManifestKey;
        }
        this.#storageKeyManifestUpdatedAt = storageKeyManifest.updatedAt;
        this.#chunkManifest = newChunkManifest;
        await this.#setStorageKeyPointersBestEffort(
          newStorageKeyManifest,
          ['data', 'meta'],
          storageKeyManifest.updatedAt,
        );
        await this.#setStorageKeyPointerTombstonesBestEffort(
          storageKeyPointerTombstonesToSet,
          storageKeyManifest.updatedAt,
        );
        if (committedStorageKeyManifestKey) {
          await this.#mirrorStorageKeyManifest(
            storageKeyManifest,
            committedStorageKeyManifestKey,
          );
        } else {
          await this.#setStorageKeyListBestEffort(
            this.#manifest,
            storageKeyManifest.updatedAt,
          );
        }
        await this.#removeKeysBestEffort(toRemove);
      } finally {
        console.timeEnd('[ExtensionStore]: Overwriting local store');
      }
    });
  }

  /**
   * Removes all keys contained in the manifest from the `local` extension
   * storage area.
   */
  async reset(): Promise<void> {
    return await this.#runWrite(async () => {
      if (!this.isSupported) {
        throw new Error(
          'MetaMask - cannot persist state to local store as this browser does not support this action',
        );
      }

      await this.#readStorageKeyManifest();
      const storageKeyList = await this.#readStorageKeyList();
      const hasReadableGeneratedMetadata =
        this.#storageKeyManifest.size > 0 || storageKeyList !== undefined;
      const legacyManifestKeys =
        this.#manifest.size === 0 && !hasReadableGeneratedMetadata
          ? await this.#readLegacyManifest()
          : undefined;
      const logicalKeys = new Set([
        'data',
        'meta',
        ...this.#manifest,
        ...this.#storageKeyManifest.keys(),
        ...(storageKeyList?.keys ?? []),
        ...(legacyManifestKeys ?? []),
      ]);
      const storageKeys = new Set(this.#storageKeyManifest.values());

      await this.#readStorageKeyPointers([...logicalKeys], false);
      for (const storageKey of this.#storageKeyManifest.values()) {
        storageKeys.add(storageKey);
      }

      const chunkKeys = new Set([
        ...[...this.#chunkManifest.values()].flat(),
        ...(await this.#readChunkKeysForStorageKeys(storageKeys)),
      ]);
      const storagePointerKeys = [...logicalKeys].flatMap((key) =>
        makeStorageKeyPointerKeys(key),
      );
      await this.#removeKeysBestEffort([
        MANIFEST_KEY,
        CHUNK_MANIFEST_KEY,
        ...STORAGE_KEY_MANIFEST_KEYS,
        ...STORAGE_KEY_LIST_KEYS,
        ...this.#manifest,
        ...(legacyManifestKeys ?? []),
        ...storageKeys,
        ...storagePointerKeys,
        ...chunkKeys,
      ]);

      this.#manifest = new Set();
      this.#chunkManifest = new Map();
      this.#storageKeyManifest = new Map();
      this.#storageKeyManifestSlot = STORAGE_KEY_MANIFEST_KEYS[0];
      this.#storageKeyManifestUpdatedAt = 0;
      this.#unreadableStorageKeyManifestKeys.clear();
      this.#unreadableStorageKeyListKeys.clear();
      this.#manifestKeyUnreadable = false;
    });
  }
}
