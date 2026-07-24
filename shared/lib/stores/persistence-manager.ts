import EventEmitter from 'events';
import log from 'loglevel';
import { isEmpty } from 'lodash';
import { RuntimeObject, hasProperty, isObject } from '@metamask/utils';
import { captureException, captureMessage } from '../sentry';
import { MISSING_VAULT_ERROR } from '../../constants/errors';
import { getManifestFlags } from '../manifestFlags';
import { VaultCorruptionType } from '../../constants/state-corruption';
import { StorageWriteErrorType } from '../../constants/app-state';
import { IndexedDBStore } from './indexeddb-store';
import type {
  MetaMaskStateType,
  MetaMaskStorageStructure,
  BaseStore,
  MetaData,
} from './base-store';
import { runTrackedTask } from './utils/run-tracked-task';

export type StorageKind = 'data' | 'split';

export const backedUpStateKeys = [
  'KeyringController',
  'AppMetadataController',
  'MetaMetricsController',
  'AnalyticsController',
] as const;

export type BackedUpStateKey = (typeof backedUpStateKeys)[number];

/**
 * Shape of the backup object read from the IndexedDB backup database.
 * Used for vault recovery and critical error restore.
 * Keys are derived from backedUpStateKeys (single source of truth).
 */
export type Backup = {
  [K in BackedUpStateKey]?: unknown;
} & {
  meta?: unknown;
};

export type VaultCorruptionDetectedEvent = {
  backup: Backup;
  corruptionType: VaultCorruptionType;
};

export type SplitStateMigrationSucceededEvent = {
  state: MetaMaskStateType;
};

export type SplitStateMigrationFailedEvent = {
  state: MetaMaskStateType;
};

export type PersistenceManagerEventMap = {
  vaultCorruptionDetected: [VaultCorruptionDetectedEvent];
  splitStateMigrationSucceeded: [SplitStateMigrationSucceededEvent];
  splitStateMigrationFailed: [SplitStateMigrationFailedEvent];
};

export type PersistenceManagerOptions = {
  localStore: BaseStore;
};

/**
 * This Error represents an error that occurs during persistence operations.
 * It includes a backup of the state at the time of the error and optionally
 * a reference to the original error that caused the persistence failure.
 */
export class PersistenceError extends Error {
  getBackup: () => object | null;

  /**
   * The type of vault corruption that occurred.
   * - InaccessibleDatabase: The storage system threw an error (e.g., Firefox's "An unexpected error occurred")
   * - MissingVaultInDatabase: The database was accessible but the vault was missing
   */
  corruptionType: VaultCorruptionType;

  /**
   * The original error that caused the persistence failure, if any.
   * This is useful for debugging as it preserves the original error message
   * (e.g., Firefox's "Error: An unexpected error occurred").
   */
  override cause?: Error;

  constructor(
    message: string,
    backup: object | null,
    corruptionType: VaultCorruptionType,
    cause?: Error,
  ) {
    super(message);
    this.name = 'PersistenceError';
    // closure around `backup` to prevent it from being serialized with the
    // error in debug logs, error reporting, etc.
    this.getBackup = () => backup;
    this.corruptionType = corruptionType;
    this.cause = cause;
  }
}

/**
 * Pulls out the relevant state from the MetaMask state object and returns
 * an object to be backed up.
 *
 * We don't back up all properties of the state object, only the ones that are
 * relevant for restoring the state. This is to avoid unnecessary data
 * duplication and ensure efficient storage usage.
 *
 * @param state - The current MetaMask state.
 * @param meta - The metadata object containing versioning information.
 * @returns A Backup object containing the state of various controllers.
 */
function makeBackup(state: MetaMaskStateType, meta: MetaData): Backup {
  const backup = Object.create(null);
  for (const key of backedUpStateKeys) {
    if (hasProperty(state, key)) {
      backup[key] = state[key];
    }
  }
  backup.meta = meta;
  return backup;
}

/**
 * Checks if the state or backup object has a vault.
 *
 * @param state - Full MetaMask state, a backup snapshot, or `null`. Omission is allowed.
 * @returns True if the vault exists, otherwise false.
 */
export function hasVault(state?: MetaMaskStateType | Backup | null): state is {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  KeyringController: RuntimeObject & Record<'vault', unknown>;
} {
  // we're overly defensive here because we have no idea what happened to the
  // database, and we don't want to throw another error on some unexpected object.
  if (!isObject(state) || !hasProperty(state, 'KeyringController')) {
    return false;
  }
  const keyringController = state.KeyringController;
  return (
    isObject(keyringController) &&
    hasProperty(keyringController, 'vault') &&
    Boolean(keyringController.vault)
  );
}

const STATE_LOCK = 'state-lock';

/**
 * What detected a suspected browser shutdown. {@link ShutdownTrigger.OnSuspend}
 * is the proactive MV3 lifecycle signal (paired with `onSuspendCanceled`);
 * {@link ShutdownTrigger.Reactive} and {@link ShutdownTrigger.IdbClose} are
 * inferred heuristics that can be false positives, so they are recoverable
 * (see {@link SHUTDOWN_RECOVERY_RETRY_MS}). {@link ShutdownTrigger.Unknown} is
 * the default when a caller omits the trigger.
 */
export enum ShutdownTrigger {
  Reactive = 'reactive',
  OnSuspend = 'onSuspend',
  IdbClose = 'idb-close',
  Unknown = 'unknown',
}
/**
 * How often to re-probe storage after suspending writes due to an inferred
 * shutdown signal ({@link ShutdownTrigger.Reactive} /
 * {@link ShutdownTrigger.IdbClose}). Set to a quarter of the 1000ms
 * persist debounce (`wait` in `safe-reload.ts`) so a false positive recovers
 * quickly. A genuine shutdown tears down the service worker, so probing stops
 * on its own.
 */
const SHUTDOWN_RECOVERY_RETRY_MS = 250;

/**
 * The PersistenceManager class serves as a high-level manager for handling
 * storage-related operations using a local storage system. It provides methods to read
 * and write state, manage metadata, and handle errors or corruption in the
 * underlying storage system.
 *
 * Key Responsibilities:
 *
 * 1. **State Management:**
 * - Tracks the most recently retrieved state
 * - reads state from the storage system
 * - writes updated state to the storage system
 *
 * 2. **Metadata Handling:**
 * - Manages a `metadata` object containing versioning information for the
 * state tree. The version is used to ensure consistency and proper
 * handling of migrations.
 *
 * 3. **Error Management:**
 * - Tracks whether data persistence is failing and logs appropriate errors
 * - Captures exceptions during write operations and reports them using
 * Sentry
 *
 *
 * Usage:
 * The `PersistenceManager` is instantiated with a `localStore`, which is an
 * implementation of the `BaseStore` class (`ExtensionStore`). It provides methods for setting and retrieving
 * state, managing metadata, and handling cleanup tasks.
 */
export class PersistenceManager extends EventEmitter<PersistenceManagerEventMap> {
  /**
   * DefaultStorageKind is a static property that defines the default storage
   * kind to be used by the PersistenceManager. It checks if the code is running
   * in a test environment and retrieves the storage kind from manifest flags
   * if available; otherwise, it defaults to 'split'.
   */
  static readonly defaultStorageKind = ((process.env.IN_TEST
    ? getManifestFlags().testing?.storageKind
    : null) ?? 'split') as StorageKind;

  /**
   * dataPersistenceFailing is a boolean that is set to true if the storage
   * system attempts to write state and the write operation fails. This is only
   * used as a way of deduplicating error reports sent to sentry as it is
   * likely that multiple writes will fail concurrently.
   */
  #dataPersistenceFailing: boolean = false;

  /**
   * Why writes are currently suspended, or `null` when writes are allowed.
   * Set by {@link suspendWrites} from reactive write errors, lifecycle
   * signals (`onSuspend`), or IndexedDB force-close. While non-null,
   * `set`/`persist` short-circuit without touching storage, so we never start
   * a `storage.local` write the browser could interrupt mid-flight (a cause of
   * on-disk LevelDB corruption). Cleared by {@link resumeWrites} (e.g.
   * `runtime.onSuspendCanceled`) and by {@link reset}; a fresh service-worker
   * start also clears it (new instance).
   *
   * `OnSuspend` is authoritative: inferred triggers (`Reactive`/`IdbClose`)
   * must not overwrite it or schedule recovery while it is set.
   */
  #shutdownTrigger: ShutdownTrigger | null = null;

  /**
   * When false (the default), all shutdown write-suspension behavior is disabled
   * and writes behave exactly as before. The background script flips this on via
   * `setShutdownSuspensionEnabled` based on a feature flag, so the behavior can
   * be ramped and measured before being enabled by default.
   */
  #shutdownSuspensionEnabled: boolean = false;

  /**
   * Deduplicates the "writes suspended due to browser shutdown" telemetry so it
   * is reported at most once per suspension (mirrors `#dataPersistenceFailing`).
   */
  #shutdownReported: boolean = false;

  /**
   * Records that a browser shutdown was signaled while shutdown suspension was
   * not yet enabled (e.g. a buffered `runtime.onSuspend` replayed during cold
   * start, before the feature flag has been applied). When suspension is later
   * enabled we honor this pending signal instead of dropping it. `null` means
   * no pending signal (or it was cancelled via {@link resumeWrites}).
   */
  #pendingShutdownTrigger: ShutdownTrigger | null = null;

  /**
   * Pending recovery-probe timer for an inferred shutdown suspension
   * (`reactive`/`idb-close`). Non-null while a probe is scheduled; cleared once
   * writes resume, are reset, or suspension is disabled.
   */
  #shutdownRecoveryTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * mostRecentRetrievedState is a property that holds the most recent state
   * successfully retrieved from memory. Due to the nature of async read
   * operations it is beneficial to have a near real-time snapshot of the state
   * for sending data to sentry as well as other developer tooling.
   */
  #mostRecentRetrievedState: MetaMaskStorageStructure | null = null;

  /**
   * metadata is a property that holds the current metadata object. This object
   * includes a single key which is 'version' and contains the current version
   * number of the state tree.
   */
  #metadata?: MetaData;

  #isExtensionInitialized: boolean = false;

  #localStore: BaseStore;

  #backupDb: IndexedDBStore | null = null;

  #backup?: string;

  #open: boolean = false;

  /**
   * When non-undefined, an open of the backup IndexedDB is in flight. Concurrent
   * callers of {@link open} await this same promise so only one open runs.
   */
  #openPromise: Promise<void> | undefined;

  /**
   * Callback to be invoked when a set operation fails (storage.local or IndexedDB).
   * This allows the background script to notify the UI about the failure.
   * The callback receives the storage write error type.
   */
  #onSetFailed?: (errorType: StorageWriteErrorType) => void;

  /**
   * Stores the error type from the first failure that occurred before the callback was registered.
   * If not null, indicates a failure occurred before the callback was registered.
   */
  #errorTypeBeforeCallbackRegistered: StorageWriteErrorType | null = null;

  constructor({ localStore }: PersistenceManagerOptions) {
    super();
    this.#localStore = localStore;
  }

  /**
   * Sets the callback to be invoked when a set operation fails.
   * This is called by the background script to wire up the notification to the UI.
   * If a failure already occurred before this callback was registered, it will be
   * called immediately with the stored error type.
   *
   * @param callback - The callback to invoke when a set operation fails
   */
  setOnSetFailed(callback: (errorType: StorageWriteErrorType) => void) {
    this.#onSetFailed = callback;

    // If a failure occurred before this callback was registered, call it now
    if (this.#errorTypeBeforeCallbackRegistered !== null) {
      callback(this.#errorTypeBeforeCallbackRegistered);
    }
  }

  /**
   * Enables or disables shutdown write-suspension. Disabled by default so the
   * behavior can be gated behind a feature flag and ramped safely. When
   * disabled, `set`/`persist` behave exactly as before (a shutdown write error
   * is reported like any other failure). Disabling also clears any in-session
   * suspension so a later re-enable does not inherit a stale suspended state.
   * Enabling honors a shutdown signal that arrived while the flag was still off
   * (see {@link suspendWrites}).
   *
   * A no-op disable while already off does **not** clear
   * `#pendingShutdownTrigger`: startup often syncs `false` before the
   * persisted/live flag is known, and that must not erase a buffered
   * `onSuspend` waiting to be applied.
   *
   * @param enabled - Whether shutdown write-suspension is active.
   */
  setShutdownSuspensionEnabled(enabled: boolean) {
    const wasEnabled = this.#shutdownSuspensionEnabled;
    this.#shutdownSuspensionEnabled = enabled;
    if (!enabled) {
      this.#shutdownTrigger = null;
      this.#shutdownReported = false;
      this.#clearShutdownRecoveryTimer();
      // Drop pending only when the feature is turned off after having been on.
      // false→false syncs (common at startup) must preserve a cold-start signal.
      if (wasEnabled) {
        this.#pendingShutdownTrigger = null;
      }
      return;
    }
    // If a shutdown was signaled before the flag was applied (e.g. a buffered
    // `onSuspend` replayed during cold start), honor it now rather than dropping
    // it.
    if (this.#pendingShutdownTrigger !== null && !this.writesSuspended()) {
      const trigger = this.#pendingShutdownTrigger;
      this.#pendingShutdownTrigger = null;
      this.suspendWrites(trigger);
    }
  }

  /**
   * Whether writes are currently suspended because a browser shutdown was
   * detected.
   */
  writesSuspended(): boolean {
    return this.#shutdownTrigger !== null;
  }

  /**
   * Suspends all writes to the local store because the browser appears to be
   * shutting down. Any write queued in the state lock but not yet started is
   * aborted, and subsequent `set`/`persist` calls short-circuit until
   * `resumeWrites()` is called (or the service worker restarts).
   *
   * If shutdown suspension is not yet enabled, the trigger is remembered and
   * applied when {@link setShutdownSuspensionEnabled} turns the feature on.
   * That covers a cold-start race where a buffered `runtime.onSuspend` is
   * replayed before the persisted feature flag has been applied.
   *
   * This deliberately does NOT flush a final write (unlike `OperationSafener`'s
   * `evacuate`): a write started during shutdown is exactly what we want to
   * avoid, since it can be interrupted mid-flight and corrupt the database.
   *
   * @param trigger - What detected the shutdown, for telemetry only. Defaults
   * to {@link ShutdownTrigger.Unknown} when the caller does not specify one.
   */
  suspendWrites(trigger: ShutdownTrigger = ShutdownTrigger.Unknown) {
    if (!this.#shutdownSuspensionEnabled) {
      // Same OnSuspend authority as the enabled path: inferred triggers must
      // not demote a pending lifecycle signal before the flag is applied.
      if (trigger === ShutdownTrigger.OnSuspend) {
        this.#pendingShutdownTrigger = ShutdownTrigger.OnSuspend;
      } else if (this.#pendingShutdownTrigger !== ShutdownTrigger.OnSuspend) {
        this.#pendingShutdownTrigger = trigger;
      }
      return;
    }
    this.#pendingShutdownTrigger = null;

    // `OnSuspend` is authoritative: inferred triggers must not demote it.
    // Otherwise record the latest trigger so recovery knows which path owns
    // the suspension.
    if (trigger === ShutdownTrigger.OnSuspend) {
      this.#shutdownTrigger = ShutdownTrigger.OnSuspend;
      this.#clearShutdownRecoveryTimer();
    } else if (this.#shutdownTrigger !== ShutdownTrigger.OnSuspend) {
      this.#shutdownTrigger = trigger;
    }

    // Drop any write that is queued in the state lock but hasn't started yet.
    this.#currentLockAbortController?.abort();

    if (!this.#shutdownReported) {
      this.#shutdownReported = true;
      // Low-volume, deduplicated telemetry so we can measure how often
      // shutdown-suspension triggers without the noise/severity of an exception.
      captureMessage('MetaMask - writes suspended: browser shutting down', {
        level: 'info',
        tags: {
          'persistence.event': 'writes-suspended-shutdown',
          'persistence.shutdownTrigger': trigger,
        },
        fingerprint: ['persistence-event', 'writes-suspended-shutdown'],
      });
    }

    // `Reactive` and `IdbClose` are inferred heuristics that can misfire (e.g.
    // a transient write error or a spurious IndexedDB `versionchange`). If they
    // do, nothing would ever resume writes, leaving the extension stuck. So we
    // periodically probe storage and resume once the browser proves responsive.
    // Skip while `OnSuspend` owns the suspension: that path recovers via
    // `onSuspendCanceled` only.
    if (
      (trigger === ShutdownTrigger.Reactive ||
        trigger === ShutdownTrigger.IdbClose) &&
      this.#shutdownTrigger !== ShutdownTrigger.OnSuspend
    ) {
      this.#scheduleShutdownRecovery(trigger);
    }
  }

  /**
   * Reports that the backup IndexedDB was force-closed by the browser. Emitted
   * regardless of whether shutdown suspension is enabled, so we get a baseline
   * of how often these events happen (and whether they are `close` vs
   * `versionchange`) independent of the feature rollout. `IndexedDBStore` only
   * fires this once per live connection, so it stays low-volume without extra
   * deduplication here.
   *
   * @param reason - Which browser event triggered the forced close.
   */
  #reportBackupDbForcedClose(reason: 'close' | 'versionchange') {
    captureMessage('MetaMask - backup IndexedDB force-closed', {
      level: 'info',
      tags: {
        'persistence.event': 'backup-idb-forced-close',
        'persistence.idbCloseReason': reason,
      },
      fingerprint: ['persistence-event', 'backup-idb-forced-close'],
    });
  }

  /**
   * Resumes writes previously suspended by {@link suspendWrites}. Called when a
   * suspected shutdown is cancelled (e.g. `runtime.onSuspendCanceled`) or when a
   * recovery probe confirms the browser is still responsive.
   *
   * For split storage, also best-effort flushes any `#pendingPairs` queued while
   * writes were suspended. Without that, those updates would wait for the next
   * controller `stateChange` and could be lost if the service worker stops first.
   */
  resumeWrites() {
    this.#shutdownTrigger = null;
    this.#shutdownReported = false;
    this.#pendingShutdownTrigger = null;
    this.#clearShutdownRecoveryTimer();
    this.#flushPendingPairsAfterResume();
  }

  /**
   * Persists any split-storage pairs that accumulated during suspension.
   * No-op for data storage (there is no pending queue) or when nothing is queued.
   * Errors are reported but not rethrown: resume must stay synchronous and
   * non-fatal for lifecycle listeners.
   */
  #flushPendingPairsAfterResume() {
    if (this.storageKind !== 'split' || this.#pendingPairs.size === 0) {
      return;
    }
    this.persist().catch((error: unknown) => {
      log.error('Error persisting after writes resumed:', error);
      captureException(error);
    });
  }

  /**
   * Schedules a one-shot recovery probe for an inferred shutdown suspension.
   * No-op if a probe is already pending, so repeated `suspendWrites` calls do
   * not stack timers.
   *
   * @param trigger - The inferred trigger that suspended writes, for telemetry.
   */
  #scheduleShutdownRecovery(trigger: ShutdownTrigger) {
    if (
      this.#shutdownTrigger === ShutdownTrigger.OnSuspend ||
      this.#shutdownRecoveryTimer !== null
    ) {
      return;
    }
    this.#shutdownRecoveryTimer = setTimeout(() => {
      this.#shutdownRecoveryTimer = null;
      // Best-effort: the probe handles its own errors and reschedules, so any
      // unexpected rejection here is swallowed rather than left floating.
      this.#attemptShutdownRecovery(trigger).catch(() => undefined);
    }, SHUTDOWN_RECOVERY_RETRY_MS);
  }

  /**
   * Probes storage once. If the probe succeeds the suspension was a false
   * positive, so writes resume; if it fails the browser is likely really
   * shutting down, so another probe is scheduled. A genuine shutdown tears down
   * the service worker before the next probe, so this stops on its own.
   *
   * @param trigger - The inferred trigger that suspended writes, for telemetry.
   */
  async #attemptShutdownRecovery(trigger: ShutdownTrigger) {
    // Writes were already resumed, reset, or suspension disabled; nothing to do.
    // Also bail if `onSuspend` took ownership after this probe was scheduled:
    // that lifecycle signal recovers only via `onSuspendCanceled`.
    if (
      !this.writesSuspended() ||
      !this.#shutdownSuspensionEnabled ||
      this.#shutdownTrigger === ShutdownTrigger.OnSuspend
    ) {
      return;
    }

    try {
      await this.#probeStorageAlive();
    } catch {
      // Still failing: keep suspended and try again later.
      this.#scheduleShutdownRecovery(trigger);
      return;
    }

    // Re-check after the async probe: `onSuspend` may have taken ownership
    // while we were waiting on storage.
    if (
      !this.writesSuspended() ||
      this.#shutdownTrigger === ShutdownTrigger.OnSuspend
    ) {
      return;
    }

    const wasReported = this.#shutdownReported;
    this.resumeWrites();
    if (wasReported) {
      captureMessage('MetaMask - writes resumed: shutdown recovered', {
        level: 'info',
        tags: {
          'persistence.event': 'writes-resumed-recovery',
          'persistence.shutdownTrigger': trigger,
        },
        fingerprint: ['persistence-event', 'writes-resumed-recovery'],
      });
    }
  }

  /**
   * Checks whether storage is responsive again after an inferred shutdown
   * suspension. Every store we can reach must respond before we resume, so we
   * never restart writes to one store while another is still unresponsive.
   *
   * The backup IndexedDB (when available) is checked first: reopening reconnects
   * after an `idb-close` (the store nulls its handle on forced close), and the
   * `get` round-trip exercises the browser for the `reactive` case where the
   * handle is still open. It is skipped when no backup database exists (e.g.
   * Firefox private browsing). Then `storage.local` (the store that `reactive`
   * suspensions come from) is read to confirm the primary database is
   * responsive again.
   *
   * Throws if any reachable store is still unresponsive.
   */
  async #probeStorageAlive(): Promise<void> {
    if (this.#backupDb) {
      await this.#backupDb.open('metamask-backup', 1);
      await this.#backupDb.get(['meta']);
    }
    await this.#localStore.get();
  }

  /**
   * Cancels any pending recovery probe.
   */
  #clearShutdownRecoveryTimer() {
    if (this.#shutdownRecoveryTimer !== null) {
      clearTimeout(this.#shutdownRecoveryTimer);
      this.#shutdownRecoveryTimer = null;
    }
  }

  /**
   * Determines whether a write error indicates the browser is shutting down
   * (e.g. Chromium's "The browser is shutting down." rejection). Such errors are
   * expected during shutdown and should suspend writes silently rather than be
   * reported as failures.
   *
   * @param errorMessage - The error message from the failed operation
   * @returns True if the error indicates a browser shutdown.
   */
  #isShutdownError(errorMessage: string): boolean {
    return errorMessage.includes('shutting down');
  }

  /**
   * Determines the storage write error type from an error message.
   *
   * @param errorMessage - The error message from the failed operation
   * @returns The appropriate StorageWriteErrorType
   */
  #getStorageWriteErrorType(errorMessage: string): StorageWriteErrorType {
    if (errorMessage.includes('FILE_ERROR_NO_SPACE')) {
      return StorageWriteErrorType.FileErrorNoSpace;
    }
    return StorageWriteErrorType.Default;
  }

  /**
   * Notifies the UI that a set operation has failed (storage.local or IndexedDB).
   * If the callback is not yet registered, tracks the failure for later notification.
   *
   * @param errorMessage - The error message from the failed operation
   */
  #notifySetFailed(errorMessage: string) {
    const errorType = this.#getStorageWriteErrorType(errorMessage);

    if (this.#onSetFailed) {
      this.#onSetFailed(errorType);
    } else {
      // Callback not yet registered - track the failure for later
      this.#errorTypeBeforeCallbackRegistered = errorType;
    }
  }

  #normalizePersistError(error: unknown): Error {
    return error instanceof Error ? error : new Error(String(error));
  }

  async open(): Promise<void> {
    if (this.#open) {
      return;
    }
    if (this.#openPromise) {
      await this.#openPromise;
      return;
    }
    this.#openPromise = this.#openBackupDatabase();
    try {
      await this.#openPromise;
    } finally {
      this.#openPromise = undefined;
    }
  }

  async #openBackupDatabase(): Promise<void> {
    try {
      // Reuse the existing store after a forced close so we reconnect the same
      // handle instead of orphaning it. IndexedDBStore.open() is a no-op when
      // already connected.
      const db = this.#backupDb ?? new IndexedDBStore();
      // Wire before open() so a force-close during/just after open is observed
      // (and so we never assign `#open = true` after onForcedClose cleared it).
      db.onForcedClose = (reason) => {
        this.#reportBackupDbForcedClose(reason);
        this.#open = false;
        this.suspendWrites(ShutdownTrigger.IdbClose);
      };
      await db.open('metamask-backup', 1);
      this.#backupDb = db;
      // Synchronous with isOpen(): no IndexedDB event can run between the check
      // and the assignment, so a close that already fired cannot be stomped.
      this.#open = db.isOpen();
    } catch (error) {
      // `indexedDB` can't be used by addons in FF in some instances of
      // private browsing mode due to this bug:
      // https://bugzilla.mozilla.org/show_bug.cgi?id=1982707. In these
      // cases we just won't have a backup vault.
      if (
        isObject(error) &&
        error instanceof DOMException &&
        error.name === 'InvalidStateError' &&
        error.message ===
          'A mutation operation was attempted on a database that did not allow mutations.'
      ) {
        // Custom fingerprint prevents Sentry's deduplication from dropping
        // this event when other persistence errors with the same underlying
        // error message (e.g., "An unexpected error occurred") are reported.
        captureException(error, {
          tags: { 'persistence.error': 'backup-db-open-failed' },
          fingerprint: ['persistence-error', 'backup-db-open-failed'],
        });
        console.warn(
          'Could not open backup database; automatic vault recovery will not be available.',
        );
        // Treat the manager as open without a backup so set/persist can proceed.
        this.#open = true;
      } else {
        // rethrow since we couldn't handle it here.
        throw error;
      }
    }
  }

  /**
   * Retrieves a clone of the current metadata.
   *
   * @returns A clone of the current metadata object.
   */
  getMetaData(): MetaData | undefined {
    return structuredClone(this.#metadata);
  }

  setMetadata(metadata: MetaData) {
    // don't rewrite if nothing has changed
    // this is a cheap comparison since metadata is small.
    if (
      this.storageKind === 'split' &&
      JSON.stringify(this.#metadata) === JSON.stringify(metadata)
    ) {
      return;
    }
    this.#metadata = metadata;
    if (this.storageKind === 'split') {
      this.#pendingPairs.set('meta', metadata);
    }
  }

  #currentLockAbortController: void | AbortController = undefined;

  #pendingPairs = new Map<string, unknown>();

  storageKind: StorageKind = PersistenceManager.defaultStorageKind;

  /**
   * Retrieves state from the local store, with optional test simulation.
   * In test mode with simulateStorageGetFailure flag, simulates a storage
   * failure after onboarding (when backup exists) to test vault recovery.
   *
   * @returns The current state from the local store
   * @throws Error if simulating storage failure for testing
   */
  async #getFromLocalStore(): Promise<MetaMaskStorageStructure | null> {
    if (
      process.env.IN_TEST &&
      getManifestFlags().testing?.simulateStorageGetFailure
    ) {
      const backup = await this.getBackup().catch(() => null);
      if (backup?.KeyringController) {
        throw new Error('Simulated storage.local.get failure for testing');
      }
    }
    return this.#localStore.get();
  }

  /**
   * Checks if storage set operations should be simulated as failing.
   * When enabled, all set operations will fail immediately.
   *
   * @throws Error if simulating storage failure for testing
   */
  #maybeSimulateSetFailure(): void {
    if (
      process.env.IN_TEST &&
      getManifestFlags().testing?.simulateStorageSetFailure
    ) {
      throw new Error('Simulated storage.local.set failure for testing');
    }
  }

  /**
   * Checks if a browser-shutdown write error should be simulated. When enabled,
   * write operations throw a "The browser is shutting down." style error so the
   * reactive shutdown-suspension path can be exercised in tests/e2e.
   *
   * @throws Error if simulating a browser shutdown for testing
   */
  #maybeSimulateShutdownError(): void {
    if (
      process.env.IN_TEST &&
      getManifestFlags().testing?.simulateBrowserShutdown
    ) {
      throw new Error('The browser is shutting down.');
    }
  }

  /**
   * Sets state in the local store, with optional test simulation.
   * In test mode with simulateStorageSetFailure flag, all set operations
   * will fail immediately.
   *
   * @param data - The data to set in the local store
   * @throws Error if simulating storage failure for testing
   */
  async #setInLocalStore(
    data: Required<MetaMaskStorageStructure>,
  ): Promise<void> {
    this.#maybeSimulateSetFailure();
    this.#maybeSimulateShutdownError();
    await this.#localStore.set(data);
  }

  /**
   * Sets key-value pairs in the local store, with optional test simulation.
   * In test mode with simulateStorageSetFailure flag, all set operations
   * will fail immediately.
   *
   * @param pairs - The key-value pairs to set in the local store
   * @throws Error if simulating storage failure for testing
   */
  async #setKeyValuesInLocalStore(pairs: Map<string, unknown>): Promise<void> {
    this.#maybeSimulateSetFailure();
    this.#maybeSimulateShutdownError();
    await this.#localStore.setKeyValues(pairs);
  }

  /**
   * Sets the state in the local store.
   *
   * @param state - The state to set in the local store. This should be an object
   * containing the state data to be stored.
   * @returns Tuple containing success status and error (if any).
   * @throws Error if the state is missing or if the metadata is not set before
   * calling this method.
   */
  async set(state: MetaMaskStateType): Promise<[boolean, Error | undefined]> {
    if (this.storageKind !== 'data') {
      throw new Error(
        'MetaMask - cannot set full state when storageKind is not "data"',
      );
    }

    if (this.#shutdownSuspensionEnabled && this.writesSuspended()) {
      // The browser is shutting down; do not start a write we may not finish.
      return [false, undefined];
    }

    await this.open();

    if (!state) {
      throw new Error('MetaMask - updated state is missing');
    }
    const meta = this.#metadata;
    if (!meta) {
      throw new Error('MetaMask - metadata must be set before calling "set"');
    }

    const abortController = new AbortController();

    // If we already have a write _pending_, abort it so the more up-to-date
    // write can take its place. This is to prevent piling up multiple writes
    // in the lock queue, which is pointless because we only care about the most
    // recent write. This should rarely happen, as elsewhere we make use of
    // `debounce` for all `set` requests in order to slow them to once per
    // 1000ms; however, if the state is very large it *can* take more than the
    // `debounce`'s `wait` time to write, resulting in a pile up right here.
    // This prevents that pile up from happening.
    this.#currentLockAbortController?.abort();
    this.#currentLockAbortController = abortController;

    return await navigator.locks
      .request(
        STATE_LOCK,
        { mode: 'exclusive', signal: abortController.signal },
        async () => {
          this.#currentLockAbortController = undefined;
          // Track which operation failed to use the correct Sentry tag
          let backupFailed = false;
          try {
            // atomically set all the keys (includes test simulation check)
            await this.#setInLocalStore({
              data: state,
              meta,
            });

            const backup = makeBackup(state, meta);
            // if we have a vault we can back it up
            if (hasVault(backup)) {
              const stringifiedBackup = JSON.stringify(backup);
              // and the backup has changed
              if (this.#backup !== stringifiedBackup) {
                // save it to the backup DB - wrapped in try-catch to differentiate
                // backup failures from storage.local failures in Sentry
                try {
                  await this.#backupDb?.set(backup);
                  this.#backup = stringifiedBackup;
                } catch (backupErr) {
                  backupFailed = true;
                  throw backupErr;
                }
              }
            }

            if (this.#dataPersistenceFailing) {
              this.#dataPersistenceFailing = false;
              // Track recovery to understand how often failures are temporary.
              // This helps answer: "Do set calls ever fail and then succeed in the same session?"
              captureMessage(
                'Data persistence recovered after temporary failure',
                {
                  level: 'info',
                  tags: { 'persistence.event': 'set-recovered' },
                  fingerprint: ['persistence-event', 'set-recovered'],
                },
              );
            }

            return [true, undefined];
          } catch (err) {
            const normalizedError = this.#normalizePersistError(err);

            // If writes were already suspended for shutdown (e.g. backup IDB
            // force-closed mid-write after storage.local succeeded), stay silent:
            // toasting/Sentry would be a false "couldn't save your data" alarm.
            if (this.#shutdownSuspensionEnabled && this.writesSuspended()) {
              return [false, undefined];
            }

            // If the write failed because the browser is shutting down, suspend
            // further writes and stay silent: this is expected, not a failure the
            // user should see. Reporting it would raise a false "couldn't save
            // your data" toast and add Sentry noise.
            if (
              this.#shutdownSuspensionEnabled &&
              !backupFailed &&
              this.#isShutdownError(normalizedError.message)
            ) {
              this.suspendWrites(ShutdownTrigger.Reactive);
              return [false, undefined];
            }

            if (!this.#dataPersistenceFailing) {
              this.#dataPersistenceFailing = true;
              // Use different tags to differentiate storage.local vs IndexedDB backup failures.
              const tag = backupFailed ? 'set-backup-failed' : 'set-failed';

              // Custom fingerprint prevents Sentry's deduplication from dropping
              // this event when other persistence errors with the same underlying
              // error message (e.g., "An unexpected error occurred") are reported.
              captureException(err, {
                tags: { 'persistence.error': tag },
                fingerprint: ['persistence-error', tag],
              });
            }
            this.#notifySetFailed(normalizedError.message);
            log.error('error setting state in local store:', err);
            return [false, normalizedError];
          } finally {
            this.#isExtensionInitialized = true;
          }
        },
      )
      .catch((err) => {
        // The lock request was aborted before it was granted: either a newer
        // write superseded this one, or writes were suspended because the browser
        // is shutting down. Neither is a real persistence failure, so resolve to
        // `[false, undefined]` (the same contract used for suspended writes)
        // rather than letting the abort rejection surface as an error.
        if (abortController.signal.aborted) {
          return [false, undefined];
        }
        throw err;
      });
  }

  /**
   * Updates a specific top-level (Controller) key in the local store.
   *
   * @param key - The top-level key to update in the local store.
   * @param value - The value to set for the specified key. Specify `undefined`
   * to delete the key.
   * @throws Error if the storageKind is not 'split'.
   */
  update(key: keyof MetaMaskStateType, value: unknown | undefined) {
    if (this.storageKind !== 'split') {
      throw new Error(
        'MetaMask - cannot set individual keys when storageKind is not "split"',
      );
    }
    this.#pendingPairs.set(key, value);
  }

  async persist(): Promise<[boolean, Error | undefined]> {
    if (this.storageKind !== 'split') {
      throw new Error(
        'MetaMask - cannot use `persist` when storageKind is not "split"',
      );
    }

    if (this.#shutdownSuspensionEnabled && this.writesSuspended()) {
      // The browser is shutting down; do not start a write we may not finish.
      // The pending pairs are left untouched so they can be written by a later
      // session if the shutdown is cancelled.
      return [false, undefined];
    }

    await this.open();

    const meta = this.#metadata;
    if (!meta) {
      throw new Error(
        'MetaMask - metadata must be set before calling "persist"',
      );
    }

    const abortController = new AbortController();

    // If we already have a write _pending_, abort it so the more up-to-date
    // write can take its place. This is to prevent piling up multiple writes
    // in the lock queue, which is pointless because we only care about the most
    // recent write. This should rarely happen, as elsewhere we make use of
    // `debounce` for all `persist` requests in order to slow them to once per
    // 1000ms; however, if the state is very large it *can* take more than the
    // `debounce`'s `wait` time to write, resulting in a pile up right here.
    // This prevents that pile up from happening.
    this.#currentLockAbortController?.abort();
    this.#currentLockAbortController = abortController;

    return await navigator.locks
      .request(
        STATE_LOCK,
        { mode: 'exclusive', signal: abortController.signal },
        async () => {
          this.#currentLockAbortController = undefined;
          // Track which operation failed to use the correct Sentry tag
          let backupFailed = false;
          try {
            const clone = structuredClone(this.#pendingPairs);
            // reset the pendingPairs
            this.#pendingPairs.clear();
            try {
              // save the pairs (includes test simulation check)
              await this.#setKeyValuesInLocalStore(clone);
            } catch (err) {
              // merge the clone with the pending pairs again
              for (const [key, value] of clone.entries()) {
                // we can't just overwrite because other `update` calls might have
                // happened since we created the clone. We don't want to overwrite
                // any new changes.
                if (!this.#pendingPairs.has(key)) {
                  this.#pendingPairs.set(key, value);
                }
              }
              throw err;
            }

            const partialState = Object.create(null);
            for (const [key, value] of clone.entries()) {
              if (backedUpStateKeys.includes(key as BackedUpStateKey)) {
                partialState[key] = value;
              }
            }
            if (hasVault(partialState)) {
              const backup = makeBackup(partialState, meta);
              // save it to the backup DB - wrapped in try-catch to differentiate
              // backup failures from storage.local failures in Sentry
              try {
                await this.#backupDb?.set(backup);
              } catch (backupErr) {
                backupFailed = true;
                throw backupErr;
              }
            }

            if (this.#dataPersistenceFailing) {
              this.#dataPersistenceFailing = false;
              // Track recovery to understand how often failures are temporary.
              // This helps answer: "Do set calls ever fail and then succeed in the same session?"
              captureMessage(
                'Data persistence recovered after temporary failure',
                {
                  level: 'info',
                  tags: { 'persistence.event': 'persist-recovered' },
                  fingerprint: ['persistence-event', 'persist-recovered'],
                },
              );
            }

            return [true, undefined];
          } catch (err) {
            const normalizedError = this.#normalizePersistError(err);

            // If writes were already suspended for shutdown (e.g. backup IDB
            // force-closed mid-write after storage.local succeeded), stay silent:
            // toasting/Sentry would be a false "couldn't save your data" alarm.
            if (this.#shutdownSuspensionEnabled && this.writesSuspended()) {
              return [false, undefined];
            }

            // If the write failed because the browser is shutting down, suspend
            // further writes and stay silent: this is expected, not a failure the
            // user should see. Reporting it would raise a false "couldn't save
            // your data" toast and add Sentry noise.
            if (
              this.#shutdownSuspensionEnabled &&
              !backupFailed &&
              this.#isShutdownError(normalizedError.message)
            ) {
              this.suspendWrites(ShutdownTrigger.Reactive);
              return [false, undefined];
            }

            if (!this.#dataPersistenceFailing) {
              this.#dataPersistenceFailing = true;
              // Use different tags to differentiate storage.local vs IndexedDB backup failures.
              const tag = backupFailed
                ? 'persist-backup-failed'
                : 'persist-failed';

              // Custom fingerprint prevents Sentry's deduplication from dropping
              // this event when other persistence errors with the same underlying
              // error message (e.g., "An unexpected error occurred") are reported.
              captureException(err, {
                tags: { 'persistence.error': tag },
                fingerprint: ['persistence-error', tag],
              });
            }
            this.#notifySetFailed(normalizedError.message);
            log.error('error setting state in local store:', err);
            return [false, normalizedError];
          } finally {
            this.#isExtensionInitialized = true;
          }
        },
      )
      .catch((err) => {
        // The lock request was aborted before it was granted: either a newer
        // write superseded this one, or writes were suspended because the browser
        // is shutting down. Neither is a real persistence failure, so resolve to
        // `[false, undefined]` (the same contract used for suspended writes)
        // rather than letting the abort rejection surface as an error.
        if (abortController.signal.aborted) {
          return [false, undefined];
        }
        throw err;
      });
  }

  /**
   * Retrieves the current state of the local store. If the store is empty,
   * it returns undefined. If the store is not open, it throws an error.
   *
   * @param options - An object containing options for the retrieval.
   * @param options.validateVault - A flag indicating whether to validate the vault
   * @param options.reportErrors - Whether read errors should be reported to Sentry.
   * @returns The current state of the local store or null if the store is empty.
   * @throws Error if the vault is missing and a backup vault is found in IndexedDB.
   * @throws Error if the local store is not open.
   */
  async get({
    validateVault,
    reportErrors = true,
  }: {
    validateVault: boolean;
    reportErrors?: boolean;
  }): Promise<MetaMaskStorageStructure | undefined> {
    await this.open();

    return await navigator.locks.request(
      STATE_LOCK,
      { mode: 'shared' },
      async () => {
        // Capture both error and result to handle them in a unified way
        // This allows us to respect the validateVault flag consistently
        const [localStoreError, result] = await this.#getFromLocalStore()
          .then((res): [undefined, MetaMaskStorageStructure | null] => [
            undefined,
            res,
          ])
          .catch((error: Error): [Error, undefined] => [error, undefined]);

        // Log and capture the error if one occurred, but don't throw yet
        if (localStoreError) {
          log.error(
            'Error retrieving the current state of the local store:',
            localStoreError,
          );
          if (reportErrors) {
            // Custom fingerprint prevents Sentry's deduplication from dropping
            // this event when other persistence errors with the same underlying
            // error message (e.g., "An unexpected error occurred") are reported.
            captureException(localStoreError, {
              tags: { 'persistence.error': 'get-failed' },
              fingerprint: ['persistence-error', 'get-failed'],
            });
          }
        }

        if (validateVault) {
          // Check if we need to trigger vault recovery:
          // 1. If localStore.get() failed entirely (e.g., Firefox's "Error: An unexpected error occurred")
          // 2. If we got a result but the vault is missing
          const needsVaultRecovery =
            localStoreError !== undefined || !hasVault(result?.data);

          if (needsVaultRecovery) {
            // Check if we have a backup in IndexedDB. We need to throw an error
            // so that the user can be prompted to recover it.
            // Wrap in try-catch to prevent backup failures from masking the
            // original storage error (we care more about the error that got us here).
            let backup: Backup | null = null;
            try {
              backup = (await this.getBackup()) ?? null;
            } catch {
              // Ignore getBackup errors - we're already in an error state
            }

            // This check verifies if we have any keys saved in our backup.
            // We use this as a sigil to determine if we've ever saved a vault before.
            if (
              backup &&
              Object.values(backup).some((value) => value !== undefined)
            ) {
              log.info('Backup vault found in IndexedDB, triggering recovery');

              // Track vault corruption detected event directly to Segment.
              // We do this here (before throwing) because MetaMetricsController
              // is not initialized yet, so we use the backup state for consent/ID.
              const corruptionType = localStoreError
                ? VaultCorruptionType.InaccessibleDatabase
                : VaultCorruptionType.MissingVaultInDatabase;
              this.emit('vaultCorruptionDetected', {
                backup,
                corruptionType,
              });

              // We've got some data (we haven't checked for a vault, as the
              // background+UI are responsible for determining what happens now).
              // Include the original error as cause for debugging purposes.
              throw new PersistenceError(
                MISSING_VAULT_ERROR,
                backup,
                corruptionType,
                localStoreError,
              );
            } else if (localStoreError) {
              log.error(
                'No backup vault available in IndexedDB, cannot recover',
              );
            } else {
              log.info('No backup vault available in IndexedDB');
            }
          }
        }

        // If there was a storage error and we didn't trigger vault recovery
        // (either validateVault was false or no backup was available),
        // re-throw the original error
        if (localStoreError) {
          throw localStoreError;
        }

        if (isEmpty(result)) {
          this.#mostRecentRetrievedState = null;
          return undefined;
        }
        if (!this.#isExtensionInitialized) {
          this.#mostRecentRetrievedState = result;
        }

        // if storageKind is not set in meta, we haven't migrated, so it is still
        // `"data"`.
        this.storageKind = result.meta?.storageKind ?? 'data';

        return result;
      },
    );
  }

  /**
   * Resets the local store and the backup database. This method is used to
   * clear the state and metadata, effectively resetting the application to
   * its initial state.
   */
  async reset() {
    await navigator.locks.request(
      STATE_LOCK,
      { mode: 'exclusive' },
      async () => {
        await Promise.all([
          this.#localStore.reset(),
          await this.#backupDb?.reset(),
        ]);
        this.#backup = undefined;
        this.#isExtensionInitialized = false;
        this.#dataPersistenceFailing = false;
        // Clear per-session shutdown-suspension state (the enablement flag is
        // config set by the background and is intentionally left intact).
        this.#shutdownTrigger = null;
        this.#shutdownReported = false;
        this.#pendingShutdownTrigger = null;
        this.#clearShutdownRecoveryTimer();
        this.#metadata = undefined;
        this.storageKind = PersistenceManager.defaultStorageKind;
        this.cleanUpMostRecentRetrievedState();

        // Clear failure tracking state to prevent stale errors from being reported
        this.#onSetFailed = undefined;
        this.#errorTypeBeforeCallbackRegistered = null;
      },
    );
  }

  /**
   * Retrieves the backup object containing the state of various controllers.
   */
  async getBackup(): Promise<Backup | undefined> {
    await this.open();
    const backupDb = this.#backupDb;
    if (!backupDb) {
      return undefined;
    }
    const values = await backupDb.get([...backedUpStateKeys, `meta`]);
    const backup: Backup = {};
    backedUpStateKeys.forEach((key, index) => {
      backup[key] = values[index];
    });
    backup.meta = values[backedUpStateKeys.length] as MetaData | undefined;
    return backup;
  }

  /**
   * Logs the encrypted vault state to the console. This is useful for
   * debugging purposes.
   */
  async logEncryptedVault() {
    let state: MetaMaskStateType | Backup | undefined;
    let source: string | null = null;
    try {
      state = (await this.get({ validateVault: false }))?.data;
      source = 'primary database';
    } catch (e) {
      console.error('Error getting state from persistence manager', e);
    }
    if (!hasVault(state)) {
      // try from backup
      try {
        state = await this.getBackup();
        source = 'backup database';
      } catch (e) {
        source = null;
        console.error('Error getting state from backup', e);
      }
    }
    // if we have a vault, log it
    if (hasVault(state)) {
      console.log(`MetaMask - Encrypted Vault from ${source}:`);
      console.log(state.KeyringController.vault);
    } else {
      console.log(
        'MetaMask - No vault found in primary database or backup database',
      );
    }
  }

  get mostRecentRetrievedState() {
    return this.#mostRecentRetrievedState;
  }

  cleanUpMostRecentRetrievedState() {
    if (this.#mostRecentRetrievedState) {
      this.#mostRecentRetrievedState = null;
    }
  }

  /**
   * Migrates the storage from 'data' kind to 'split' kind by separating
   * each top-level controller state into its own key in the storage.
   *
   * @param state - The MetaMask state tree containing all controller states to
   * migrate
   * @throws Error if the metadata is not set before calling this method.
   *
   * This method should only be called when no other write operations can
   * occur.
   */
  async migrateToSplitState(state: MetaMaskStateType) {
    try {
      type MigrationStatus = 'skipped' | 'succeeded';

      const migrationStatus = await runTrackedTask<MigrationStatus>(
        'migrateToSplitState',
        async () => {
          if (this.storageKind === 'split') {
            log.debug(
              '[Split State]: Storage is already split, skipping migration',
            );
            return 'skipped';
          }

          if (!this.#metadata) {
            throw new Error(
              'MetaMask - metadata must be set before calling "migrateToSplitState"',
            );
          }

          this.storageKind = 'split';
          const metadata = structuredClone(this.#metadata);
          metadata.storageKind = 'split';
          this.setMetadata(metadata);
          for (const [key, value] of Object.entries(state)) {
            this.update(key, value);
          }

          // mark data key for deletion
          this.update('data', undefined);

          log.debug('[Split State]: Migrating to split state storage');
          // persist doesn't throw when it fails, so we need to check the return
          // value for an error condition and throw it in that case.
          const [didPersist, persistError] = await this.persist();
          if (!didPersist) {
            throw (
              persistError ??
              new Error(
                'MetaMask - persist failed during "migrateToSplitState"',
              )
            );
          }

          return 'succeeded';
        },
      );

      if (migrationStatus === 'succeeded') {
        this.emit('splitStateMigrationSucceeded', { state });
      }
    } catch (error) {
      this.emit('splitStateMigrationFailed', { state });

      throw error;
    }
  }
}
