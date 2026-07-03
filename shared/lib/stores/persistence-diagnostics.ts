import { getErrorMessage, isObject } from '@metamask/utils';

import { IndexedDBStore } from './indexeddb-store';

export const SPLIT_STATE_PERSISTENCE_DIAGNOSTICS_DB_NAME =
  'metamask-split-state-persistence-diagnostics';
export const SPLIT_STATE_PERSISTENCE_DIAGNOSTICS_FEATURE_FLAG =
  'splitStatePersistenceDiagnostics';

const DIAGNOSTICS_DB_VERSION = 1;
const DIAGNOSTICS_KEY = 'split-state-persistence-diagnostics';
const BASELINE_KEY = 'split-state-persistence-diagnostics-baseline';
const PERSIST_INTERVAL_MS = 5 * 60 * 1000;
const BASELINE_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;
const TOP_WRITTEN_KEYS_LIMIT = 10;
const ERROR_MESSAGE_MAX_LENGTH = 200;

export type SplitStatePersistenceDiagnosticsConfig = {
  baselineEnabled: boolean;
  corruptionEnabled: boolean;
};

export type SplitStateDiagnosticError = {
  errorName: string;
  errorMessage: string;
};

export type SplitStateReadDiagnostics = {
  manifestStatus: 'readable' | 'missing' | 'failed';
  manifestKeyCount?: number;
  readableKeys: string[];
  missingKeys: string[];
  failedKeys: (SplitStateDiagnosticError & { key: string })[];
  manifestError?: SplitStateDiagnosticError;
};

export type SplitStatePersistenceDiagnosticsSnapshot = {
  schemaVersion: 1;
  config: SplitStatePersistenceDiagnosticsConfig;
  updatedAt: number;
  totalQueuedUpdates: number;
  totalPersistedBatches: number;
  topWrittenKeys: {
    key: string;
    queuedUpdates: number;
    persistedWrites: number;
  }[];
  readDiagnostics?: SplitStateReadDiagnostics;
};

type KeyStats = { queuedUpdates: number; persistedWrites: number };

export function getSplitStatePersistenceDiagnosticsConfig(
  remoteFeatureFlags: Record<string, unknown> | null | undefined,
) {
  const featureFlag =
    remoteFeatureFlags?.[SPLIT_STATE_PERSISTENCE_DIAGNOSTICS_FEATURE_FLAG];

  if (!isObject(featureFlag) || featureFlag.enabled !== true) {
    return undefined;
  }

  const config: SplitStatePersistenceDiagnosticsConfig = {
    baselineEnabled: featureFlag.baselineEnabled !== false,
    corruptionEnabled: featureFlag.corruptionEnabled !== false,
  };

  return config.baselineEnabled || config.corruptionEnabled
    ? config
    : undefined;
}

export function getSplitStateDiagnosticError(error: unknown) {
  return {
    errorName: error instanceof Error ? error.name : typeof error,
    errorMessage: getErrorMessage(error).slice(0, ERROR_MESSAGE_MAX_LENGTH),
  };
}

function isSplitStateDataKey(key: string) {
  return key !== 'data' && key !== 'manifest' && key !== 'meta';
}

/** Tracks value-free split-state persistence diagnostics. */
export class SplitStatePersistenceDiagnostics {
  #db: IndexedDBStore | undefined;

  #openPromise: Promise<void> | undefined;

  #disabled = false;

  #hydrated = false;

  #lastPersistedAt = 0;

  #totalQueuedUpdates = 0;

  #totalPersistedBatches = 0;

  #keyStats = new Map<string, KeyStats>();

  #config: SplitStatePersistenceDiagnosticsConfig | undefined;

  setConfig(config: SplitStatePersistenceDiagnosticsConfig | undefined) {
    this.#config = config;

    if (!config) {
      this.#resetInMemory();
    }
  }

  recordQueuedUpdate(key: string) {
    if (!this.#config || !isSplitStateDataKey(key)) {
      return;
    }

    this.#totalQueuedUpdates += 1;
    this.#getStats(key).queuedUpdates += 1;
  }

  recordPersistedBatch(pairs: Map<string, unknown>) {
    if (!this.#config) {
      return;
    }

    const persistedKeys = [...pairs.keys()].filter(isSplitStateDataKey);

    if (persistedKeys.length === 0) {
      return;
    }

    this.#totalPersistedBatches += 1;

    for (const key of persistedKeys) {
      this.#getStats(key).persistedWrites += 1;
    }
  }

  /** Returns whether any write diagnostics have been collected. */
  hasData() {
    return (
      this.#totalQueuedUpdates > 0 ||
      this.#totalPersistedBatches > 0 ||
      this.#keyStats.size > 0
    );
  }

  /**
   * Builds the current diagnostics snapshot without retaining state values.
   * @param readDiagnostics
   * @param now
   */
  getSnapshot(
    readDiagnostics?: SplitStateReadDiagnostics,
    now = Date.now(),
  ) {
    const config = this.#config;

    if (!config) {
      return undefined;
    }

    return {
      schemaVersion: 1 as const,
      config,
      updatedAt: now,
      totalQueuedUpdates: this.#totalQueuedUpdates,
      totalPersistedBatches: this.#totalPersistedBatches,
      topWrittenKeys: [...this.#keyStats.entries()]
        .map(([key, stats]) => ({
          key,
          queuedUpdates: stats.queuedUpdates,
          persistedWrites: stats.persistedWrites,
        }))
        .toSorted(
          (first, second) =>
            second.persistedWrites - first.persistedWrites ||
            second.queuedUpdates - first.queuedUpdates ||
            first.key.localeCompare(second.key),
        )
        .slice(0, TOP_WRITTEN_KEYS_LIMIT),
      ...(readDiagnostics ? { readDiagnostics } : {}),
    };
  }

  /**
   * Returns diagnostics for corruption reports when reporting is enabled.
   * @param readDiagnostics
   */
  async getSnapshotForReport(readDiagnostics?: SplitStateReadDiagnostics) {
    await this.#openDatabase().catch(() => undefined);

    if (
      !this.#config?.corruptionEnabled ||
      (!this.hasData() && !readDiagnostics)
    ) {
      return undefined;
    }

    return this.getSnapshot(readDiagnostics);
  }

  /**
   * Persists the current snapshot when the throttle interval has elapsed.
   * @param now
   */
  async persistSnapshotIfDue(now = Date.now()) {
    if (!this.#config || !this.hasData()) {
      return;
    }

    if (
      this.#lastPersistedAt !== 0 &&
      now - this.#lastPersistedAt <
        PERSIST_INTERVAL_MS
    ) {
      return;
    }

    await this.persistSnapshot(now);
  }

  async persistSnapshot(now = Date.now()) {
    if (!this.#config || !this.hasData()) {
      return;
    }

    await this.#openDatabase();

    const snapshot = this.getSnapshot(undefined, now);
    if (!this.#db || !snapshot) {
      return;
    }

    await this.#db.set({
      [DIAGNOSTICS_KEY]: snapshot,
    });
    this.#lastPersistedAt = now;
  }

  /**
   * Returns and marks the weekly baseline snapshot when baseline reporting is due.
   * @param now
   */
  async getWeeklyBaselineSnapshot(now = Date.now()) {
    if (!this.#config?.baselineEnabled) {
      return undefined;
    }

    await this.#openDatabase();

    if (!this.#db || !this.hasData()) {
      return undefined;
    }

    const [baselineMetadata] = await this.#db.get([
      BASELINE_KEY,
    ]);

    if (
      isObject(baselineMetadata) &&
      typeof baselineMetadata.lastSentAt === 'number' &&
      now - baselineMetadata.lastSentAt <
        BASELINE_INTERVAL_MS
    ) {
      return undefined;
    }

    const snapshot = this.getSnapshot(undefined, now);
    if (!snapshot) {
      return undefined;
    }

    await this.#db.set({
      [DIAGNOSTICS_KEY]: snapshot,
      [BASELINE_KEY]: {
        schemaVersion: 1,
        lastSentAt: now,
      },
    });
    this.#lastPersistedAt = now;

    return snapshot;
  }

  /** Clears in-memory and persisted diagnostics. */
  async reset() {
    this.#resetInMemory();
    this.#hydrated = true;

    await this.#openDatabase().catch(() => undefined);
    await this.#db?.reset().catch(() => undefined);
  }

  /** Closes the diagnostics database connection. */
  close() {
    this.#db?.close();
    this.#db = undefined;
    this.#openPromise = undefined;
    this.#hydrated = false;
  }

  #getStats(key: string) {
    let stats = this.#keyStats.get(key);
    if (!stats) {
      stats = { queuedUpdates: 0, persistedWrites: 0 };
      this.#keyStats.set(key, stats);
    }
    return stats;
  }

  #resetInMemory() {
    this.#totalQueuedUpdates = 0;
    this.#totalPersistedBatches = 0;
    this.#keyStats.clear();
    this.#lastPersistedAt = 0;
  }

  async #openDatabase() {
    if (this.#disabled || this.#db) {
      return;
    }

    this.#openPromise ??= this.#doOpenDatabase();

    try {
      await this.#openPromise;
    } finally {
      this.#openPromise = undefined;
    }
  }

  async #doOpenDatabase() {
    try {
      const db = new IndexedDBStore();
      await db.open(
        SPLIT_STATE_PERSISTENCE_DIAGNOSTICS_DB_NAME,
        DIAGNOSTICS_DB_VERSION,
      );
      this.#db = db;
      await this.#hydrateFromDatabase();
    } catch {
      this.#disabled = true;
      this.#db?.close();
      this.#db = undefined;
    }
  }

  async #hydrateFromDatabase() {
    if (this.#hydrated || !this.#db) {
      return;
    }

    this.#hydrated = true;

    const [persistedSnapshot] = await this.#db.get([
      DIAGNOSTICS_KEY,
    ]);

    if (
      !isObject(persistedSnapshot) ||
      persistedSnapshot.schemaVersion !== 1 ||
      !Array.isArray(persistedSnapshot.topWrittenKeys)
    ) {
      return;
    }

    const snapshot =
      persistedSnapshot as Partial<SplitStatePersistenceDiagnosticsSnapshot>;
    this.#totalQueuedUpdates += snapshot.totalQueuedUpdates ?? 0;
    this.#totalPersistedBatches += snapshot.totalPersistedBatches ?? 0;
    this.#lastPersistedAt = Math.max(
      this.#lastPersistedAt,
      snapshot.updatedAt ?? 0,
    );
    this.#config ??= snapshot.config;

    for (const keyDiagnostics of snapshot.topWrittenKeys ?? []) {
      const stats = this.#getStats(keyDiagnostics.key);
      stats.queuedUpdates += keyDiagnostics.queuedUpdates;
      stats.persistedWrites += keyDiagnostics.persistedWrites;
    }
  }
}
