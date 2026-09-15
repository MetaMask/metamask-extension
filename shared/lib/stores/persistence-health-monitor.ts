import { StorageWriteErrorType } from '../../constants/app-state';
import { captureMessage } from '../sentry';

/**
 * The `persistence.error` tag of a write that still failed after its retry.
 */
export type PersistenceWriteFailureClass =
  | 'set-failed'
  | 'set-backup-failed'
  | 'persist-failed'
  | 'persist-backup-failed';

/**
 * A failed write, as reported to {@link PersistenceHealthMonitor}.
 */
export type PersistenceWriteFailure = {
  errorType: StorageWriteErrorType;
  failureClass: PersistenceWriteFailureClass;
};

/**
 * Storage write error types that make every write unsafe, whichever key it
 * targets. A `Default` error can come from a single unreadable key, so it
 * does not put persistence into degraded mode.
 */
const DEGRADING_ERROR_TYPES: ReadonlySet<StorageWriteErrorType> = new Set([
  StorageWriteErrorType.FileErrorNoSpace,
]);

function getFailureTags(failure: PersistenceWriteFailure) {
  return {
    'persistence.failure_class': failure.failureClass,
    'persistence.storage_write_error_type': failure.errorType,
  };
}

/**
 * Decides when persistence is in degraded mode, and reports entering and
 * leaving it to Sentry.
 *
 * Persistence enters degraded mode when a write fails because the device is
 * out of disk space, and leaves it when a later write succeeds. The monitor
 * only observes writes that the `PersistenceManager` already makes; it never
 * writes anything itself.
 */
export class PersistenceHealthMonitor {
  /**
   * The failure that put persistence into degraded mode, or `null` when
   * persistence is healthy.
   */
  #degradedBy: PersistenceWriteFailure | null = null;

  /**
   * Whether persistence is in degraded mode.
   *
   * @returns `true` from a disk-space write failure until the next successful write.
   */
  get isDegraded(): boolean {
    return this.#degradedBy !== null;
  }

  /**
   * Records a write that failed after its retry. Enters degraded mode if the
   * failure makes every write unsafe and persistence is not already degraded.
   *
   * @param failure - The failed write.
   */
  recordWriteFailure(failure: PersistenceWriteFailure): void {
    if (
      this.#degradedBy !== null ||
      !DEGRADING_ERROR_TYPES.has(failure.errorType)
    ) {
      return;
    }
    this.#degradedBy = failure;
    captureMessage('Degraded persistence mode entered', {
      level: 'warning',
      tags: {
        'persistence.event': 'degraded-persistence-entered',
        ...getFailureTags(failure),
      },
      fingerprint: ['persistence-event', 'degraded-persistence-entered'],
    });
  }

  /**
   * Records a write that succeeded. Leaves degraded mode if persistence was
   * degraded, reporting the failure that entered it.
   */
  recordWriteSuccess(): void {
    const degradedBy = this.#degradedBy;
    if (degradedBy === null) {
      return;
    }
    this.#degradedBy = null;
    captureMessage('Degraded persistence mode exited', {
      level: 'info',
      tags: {
        'persistence.event': 'degraded-persistence-exit',
        ...getFailureTags(degradedBy),
      },
      fingerprint: ['persistence-event', 'degraded-persistence-exit'],
    });
  }
}
