import { getErrorMessage, hasProperty, isObject } from '@metamask/utils';

import { IndexedDBStore } from './indexeddb-store';

export const SPLIT_STATE_PERSISTENCE_DIAGNOSTICS_DB_NAME =
  'metamask-split-state-persistence-diagnostics';
export const SPLIT_STATE_PERSISTENCE_DIAGNOSTICS_DB_VERSION = 1;
export const SPLIT_STATE_PERSISTENCE_DIAGNOSTICS_KEY =
  'split-state-persistence-diagnostics';
export const SPLIT_STATE_PERSISTENCE_DIAGNOSTICS_BASELINE_KEY =
  'split-state-persistence-diagnostics-baseline';
export const SPLIT_STATE_PERSISTENCE_DIAGNOSTICS_INTERVAL_MS =
  5 * 60 * 1000;
export const SPLIT_STATE_PERSISTENCE_DIAGNOSTICS_BASELINE_INTERVAL_MS =
  7 * 24 * 60 * 60 * 1000;
export const SPLIT_STATE_PERSISTENCE_DIAGNOSTICS_SIZE_SAMPLE_RATE = 20;

const TOP_WRITTEN_KEYS_LIMIT = 10;
const RECENT_WIDE_BATCHES_LIMIT = 20;
const WIDE_BATCH_MIN_KEY_COUNT = 4;
const LARGEST_KEYS_PER_BATCH_LIMIT = 5;
const ERROR_MESSAGE_MAX_LENGTH = 200;

export type SplitStateSizeBucket =
  | 'unknown'
  | 'undefined'
  | 'lt_4kb'
  | '4kb_16kb'
  | '16kb_64kb'
  | '64kb_256kb'
  | '256kb_1mb'
  | 'gt_1mb';

export type SplitStateDiagnosticError = {
  errorName: string;
  errorMessage: string;
};

export type SplitStateFailedRead = SplitStateDiagnosticError & {
  key: string;
};

export type SplitStateReadDiagnostics = {
  manifestStatus: 'readable' | 'missing' | 'failed';
  manifestKeyCount?: number;
  readableKeys: string[];
  missingKeys: string[];
  failedKeys: SplitStateFailedRead[];
  manifestError?: SplitStateDiagnosticError;
};

export type SplitStateWrittenKeyDiagnostics = {
  key: string;
  queuedUpdates: number;
  persistedWrites: number;
  lastSizeBucket?: SplitStateSizeBucket;
  maxSizeBucket?: SplitStateSizeBucket;
};

export type SplitStateLargestBatchKey = {
  key: string;
  sizeBucket: SplitStateSizeBucket;
};

export type SplitStateWideBatchDiagnostics = {
  keys: string[];
  keyCount: number;
  totalSizeBucket: SplitStateSizeBucket;
  largestKeys: SplitStateLargestBatchKey[];
};

export type SplitStatePersistenceDiagnosticsSnapshot = {
  schemaVersion: 1;
  updatedAt: number;
  totalQueuedUpdates: number;
  totalPersistedBatches: number;
  topWrittenKeys: SplitStateWrittenKeyDiagnostics[];
  recentWideBatches: SplitStateWideBatchDiagnostics[];
  readDiagnostics?: SplitStateReadDiagnostics;
};

type SplitStatePersistenceDiagnosticsBaselineMetadata = {
  schemaVersion: 1;
  lastSentAt: number;
};

type KeyStats = {
  queuedUpdates: number;
  persistedWrites: number;
  maxSizeInChars: number;
  lastSizeBucket?: SplitStateSizeBucket;
  maxSizeBucket?: SplitStateSizeBucket;
};

type MeasuredValue = {
  sizeBucket: SplitStateSizeBucket;
  sizeInChars: number | null;
};

const SIZE_BUCKET_ORDER = new Map<SplitStateSizeBucket, number>([
  ['unknown', 0],
  ['undefined', 0],
  ['lt_4kb', 1],
  ['4kb_16kb', 2],
  ['16kb_64kb', 3],
  ['64kb_256kb', 4],
  ['256kb_1mb', 5],
  ['gt_1mb', 6],
]);

/**
 * Builds a small, value-free diagnostic error object.
 *
 * @param error - The error to summarize.
 * @returns A diagnostic-safe error summary.
 */
export function getSplitStateDiagnosticError(
  error: unknown,
): SplitStateDiagnosticError {
  return {
    errorName: error instanceof Error ? error.name : typeof error,
    errorMessage: getErrorMessage(error).slice(0, ERROR_MESSAGE_MAX_LENGTH),
  };
}

/**
 * Gets a coarse JSON size bucket for a value.
 *
 * @param value - The value to size.
 * @returns The value's size bucket.
 */
export function getSplitStateSizeBucket(
  value: unknown,
): SplitStateSizeBucket {
  return measureValue(value).sizeBucket;
}

function isSplitStateDataKey(key: string): boolean {
  return key !== 'data' && key !== 'manifest' && key !== 'meta';
}

function measureValue(value: unknown): MeasuredValue {
  if (value === undefined) {
    return {
      sizeBucket: 'undefined',
      sizeInChars: 0,
    };
  }

  try {
    const json = JSON.stringify(value);
    if (typeof json !== 'string') {
      return {
        sizeBucket: 'unknown',
        sizeInChars: null,
      };
    }
    const sizeInChars = json.length;
    return {
      sizeBucket: getSizeBucketForCharLength(sizeInChars),
      sizeInChars,
    };
  } catch {
    return {
      sizeBucket: 'unknown',
      sizeInChars: null,
    };
  }
}

function getSizeBucketForCharLength(sizeInChars: number): SplitStateSizeBucket {
  if (sizeInChars < 4 * 1024) {
    return 'lt_4kb';
  } else if (sizeInChars < 16 * 1024) {
    return '4kb_16kb';
  } else if (sizeInChars < 64 * 1024) {
    return '16kb_64kb';
  } else if (sizeInChars < 256 * 1024) {
    return '64kb_256kb';
  } else if (sizeInChars < 1024 * 1024) {
    return '256kb_1mb';
  }
  return 'gt_1mb';
}

function getLargerSizeBucket(
  first?: SplitStateSizeBucket,
  second?: SplitStateSizeBucket,
): SplitStateSizeBucket | undefined {
  if (!first) {
    return second;
  }
  if (!second) {
    return first;
  }
  return (SIZE_BUCKET_ORDER.get(first) ?? 0) >=
    (SIZE_BUCKET_ORDER.get(second) ?? 0)
    ? first
    : second;
}

function isSplitStatePersistenceDiagnosticsSnapshot(
  value: unknown,
): value is SplitStatePersistenceDiagnosticsSnapshot {
  return (
    isObject(value) &&
    hasProperty(value, 'schemaVersion') &&
    value.schemaVersion === 1 &&
    hasProperty(value, 'updatedAt') &&
    typeof value.updatedAt === 'number' &&
    hasProperty(value, 'topWrittenKeys') &&
    Array.isArray(value.topWrittenKeys) &&
    hasProperty(value, 'recentWideBatches') &&
    Array.isArray(value.recentWideBatches)
  );
}

function isSplitStatePersistenceDiagnosticsBaselineMetadata(
  value: unknown,
): value is SplitStatePersistenceDiagnosticsBaselineMetadata {
  return (
    isObject(value) &&
    hasProperty(value, 'schemaVersion') &&
    value.schemaVersion === 1 &&
    hasProperty(value, 'lastSentAt') &&
    typeof value.lastSentAt === 'number'
  );
}

/**
 * Tracks split-state persistence diagnostics without retaining controller
 * values.
 */
export class SplitStatePersistenceDiagnostics {
  #db: IndexedDBStore | undefined;

  #openPromise: Promise<void> | undefined;

  #disabled = false;

  #hydrated = false;

  #lastPersistedAt = 0;

  #totalQueuedUpdates = 0;

  #totalPersistedBatches = 0;

  #keyStats = new Map<string, KeyStats>();

  #recentWideBatches: SplitStateWideBatchDiagnostics[] = [];

  recordQueuedUpdate(key: string): void {
    if (!isSplitStateDataKey(key)) {
      return;
    }

    this.#totalQueuedUpdates += 1;
    this.#getStats(key).queuedUpdates += 1;
  }

  recordPersistedBatch(pairs: Map<string, unknown>): void {
    const persistedEntries = [...pairs.entries()].filter(([key]) =>
      isSplitStateDataKey(key),
    );

    if (persistedEntries.length === 0) {
      return;
    }

    this.#totalPersistedBatches += 1;
    const shouldSampleSizes =
      this.#totalPersistedBatches %
        SPLIT_STATE_PERSISTENCE_DIAGNOSTICS_SIZE_SAMPLE_RATE ===
      0;
    const measuredEntries: (MeasuredValue & { key: string })[] = [];

    for (const [key, value] of persistedEntries) {
      const stats = this.#getStats(key);
      stats.persistedWrites += 1;

      if (!shouldSampleSizes) {
        continue;
      }

      const measuredEntry = {
        key,
        ...measureValue(value),
      };
      measuredEntries.push(measuredEntry);

      stats.lastSizeBucket = measuredEntry.sizeBucket;
      stats.maxSizeBucket = getLargerSizeBucket(
        stats.maxSizeBucket,
        measuredEntry.sizeBucket,
      );
      if (
        measuredEntry.sizeInChars !== null &&
        measuredEntry.sizeInChars > stats.maxSizeInChars
      ) {
        stats.maxSizeInChars = measuredEntry.sizeInChars;
      }
    }

    if (
      !shouldSampleSizes ||
      measuredEntries.length < WIDE_BATCH_MIN_KEY_COUNT
    ) {
      return;
    }

    const totalSizeInChars = measuredEntries.reduce<number | null>(
      (total, entry) => {
        if (total === null || entry.sizeInChars === null) {
          return null;
        }
        return total + entry.sizeInChars;
      },
      0,
    );

    this.#recentWideBatches.push({
      keys: measuredEntries.map(({ key }) => key),
      keyCount: measuredEntries.length,
      totalSizeBucket:
        totalSizeInChars === null
          ? 'unknown'
          : getSizeBucketForCharLength(totalSizeInChars),
      largestKeys: measuredEntries
        .toSorted(
          (first, second) =>
            (second.sizeInChars ?? -1) - (first.sizeInChars ?? -1),
        )
        .slice(0, LARGEST_KEYS_PER_BATCH_LIMIT)
        .map(({ key, sizeBucket }) => ({
          key,
          sizeBucket,
        })),
    });

    this.#recentWideBatches = this.#recentWideBatches.slice(
      -RECENT_WIDE_BATCHES_LIMIT,
    );
  }

  hasData(): boolean {
    return (
      this.#totalQueuedUpdates > 0 ||
      this.#totalPersistedBatches > 0 ||
      this.#keyStats.size > 0 ||
      this.#recentWideBatches.length > 0
    );
  }

  getSnapshot(
    readDiagnostics?: SplitStateReadDiagnostics,
    now = Date.now(),
  ): SplitStatePersistenceDiagnosticsSnapshot {
    const snapshot: SplitStatePersistenceDiagnosticsSnapshot = {
      schemaVersion: 1,
      updatedAt: now,
      totalQueuedUpdates: this.#totalQueuedUpdates,
      totalPersistedBatches: this.#totalPersistedBatches,
      topWrittenKeys: [...this.#keyStats.entries()]
        .map(([key, stats]) => {
          const keyDiagnostics: SplitStateWrittenKeyDiagnostics = {
            key,
            queuedUpdates: stats.queuedUpdates,
            persistedWrites: stats.persistedWrites,
          };

          if (stats.lastSizeBucket) {
            keyDiagnostics.lastSizeBucket = stats.lastSizeBucket;
          }
          if (stats.maxSizeBucket) {
            keyDiagnostics.maxSizeBucket = stats.maxSizeBucket;
          }

          return keyDiagnostics;
        })
        .toSorted(
          (first, second) =>
            second.persistedWrites - first.persistedWrites ||
            second.queuedUpdates - first.queuedUpdates ||
            first.key.localeCompare(second.key),
        )
        .slice(0, TOP_WRITTEN_KEYS_LIMIT),
      recentWideBatches: this.#recentWideBatches,
    };

    if (readDiagnostics) {
      snapshot.readDiagnostics = readDiagnostics;
    }

    return snapshot;
  }

  async getSnapshotForReport(
    readDiagnostics?: SplitStateReadDiagnostics,
  ): Promise<SplitStatePersistenceDiagnosticsSnapshot | undefined> {
    await this.#openDatabase().catch(() => undefined);

    if (!this.hasData() && !readDiagnostics) {
      return undefined;
    }

    return this.getSnapshot(readDiagnostics);
  }

  async persistSnapshotIfDue(now = Date.now()): Promise<void> {
    if (!this.hasData()) {
      return;
    }

    if (
      this.#lastPersistedAt !== 0 &&
      now - this.#lastPersistedAt <
        SPLIT_STATE_PERSISTENCE_DIAGNOSTICS_INTERVAL_MS
    ) {
      return;
    }

    await this.persistSnapshot(now);
  }

  async persistSnapshot(now = Date.now()): Promise<void> {
    if (!this.hasData()) {
      return;
    }

    await this.#openDatabase();

    if (!this.#db) {
      return;
    }

    await this.#db.set({
      [SPLIT_STATE_PERSISTENCE_DIAGNOSTICS_KEY]: this.getSnapshot(
        undefined,
        now,
      ),
    });
    this.#lastPersistedAt = now;
  }

  async getWeeklyBaselineSnapshot(
    now = Date.now(),
  ): Promise<SplitStatePersistenceDiagnosticsSnapshot | undefined> {
    await this.#openDatabase();

    if (!this.#db || !this.hasData()) {
      return undefined;
    }

    const [baselineMetadata] = await this.#db.get([
      SPLIT_STATE_PERSISTENCE_DIAGNOSTICS_BASELINE_KEY,
    ]);

    if (
      isSplitStatePersistenceDiagnosticsBaselineMetadata(
        baselineMetadata,
      ) &&
      now - baselineMetadata.lastSentAt <
        SPLIT_STATE_PERSISTENCE_DIAGNOSTICS_BASELINE_INTERVAL_MS
    ) {
      return undefined;
    }

    const snapshot = this.getSnapshot(undefined, now);
    await this.#db.set({
      [SPLIT_STATE_PERSISTENCE_DIAGNOSTICS_KEY]: snapshot,
      [SPLIT_STATE_PERSISTENCE_DIAGNOSTICS_BASELINE_KEY]: {
        schemaVersion: 1,
        lastSentAt: now,
      },
    });
    this.#lastPersistedAt = now;

    return snapshot;
  }

  async reset(): Promise<void> {
    this.#totalQueuedUpdates = 0;
    this.#totalPersistedBatches = 0;
    this.#keyStats.clear();
    this.#recentWideBatches = [];
    this.#lastPersistedAt = 0;
    this.#hydrated = true;

    await this.#openDatabase().catch(() => undefined);
    await this.#db?.reset().catch(() => undefined);
  }

  close(): void {
    this.#db?.close();
    this.#db = undefined;
    this.#openPromise = undefined;
    this.#hydrated = false;
  }

  #getStats(key: string): KeyStats {
    let stats = this.#keyStats.get(key);
    if (!stats) {
      stats = {
        queuedUpdates: 0,
        persistedWrites: 0,
        maxSizeInChars: 0,
      };
      this.#keyStats.set(key, stats);
    }
    return stats;
  }

  async #openDatabase(): Promise<void> {
    if (this.#disabled || this.#db) {
      return;
    }

    if (!this.#openPromise) {
      this.#openPromise = this.#doOpenDatabase();
    }

    try {
      await this.#openPromise;
    } finally {
      this.#openPromise = undefined;
    }
  }

  async #doOpenDatabase(): Promise<void> {
    try {
      const db = new IndexedDBStore();
      await db.open(
        SPLIT_STATE_PERSISTENCE_DIAGNOSTICS_DB_NAME,
        SPLIT_STATE_PERSISTENCE_DIAGNOSTICS_DB_VERSION,
      );
      this.#db = db;
      await this.#hydrateFromDatabase();
    } catch {
      this.#disabled = true;
      this.#db?.close();
      this.#db = undefined;
    }
  }

  async #hydrateFromDatabase(): Promise<void> {
    if (this.#hydrated || !this.#db) {
      return;
    }

    this.#hydrated = true;

    const [persistedSnapshot] = await this.#db.get([
      SPLIT_STATE_PERSISTENCE_DIAGNOSTICS_KEY,
    ]);

    if (
      !isSplitStatePersistenceDiagnosticsSnapshot(persistedSnapshot)
    ) {
      return;
    }

    this.#mergePersistedSnapshot(persistedSnapshot);
  }

  #mergePersistedSnapshot(
    snapshot: SplitStatePersistenceDiagnosticsSnapshot,
  ): void {
    this.#totalQueuedUpdates += snapshot.totalQueuedUpdates;
    this.#totalPersistedBatches += snapshot.totalPersistedBatches;
    this.#lastPersistedAt = Math.max(this.#lastPersistedAt, snapshot.updatedAt);

    for (const keyDiagnostics of snapshot.topWrittenKeys) {
      const stats = this.#getStats(keyDiagnostics.key);
      stats.queuedUpdates += keyDiagnostics.queuedUpdates;
      stats.persistedWrites += keyDiagnostics.persistedWrites;
      stats.lastSizeBucket =
        keyDiagnostics.lastSizeBucket ?? stats.lastSizeBucket;
      stats.maxSizeBucket = getLargerSizeBucket(
        stats.maxSizeBucket,
        keyDiagnostics.maxSizeBucket,
      );
    }

    this.#recentWideBatches = [
      ...snapshot.recentWideBatches.slice(-RECENT_WIDE_BATCHES_LIMIT),
      ...this.#recentWideBatches,
    ].slice(-RECENT_WIDE_BATCHES_LIMIT);
  }
}
