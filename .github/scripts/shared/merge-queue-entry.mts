/**
 * Verifies that a failed merge-group run still represents the PR's active
 * merge-queue entry. A workflow_run can start after GitHub has rebuilt or
 * removed that entry, and rerunning such a workflow would waste CI on a
 * commit the queue will never merge.
 *
 * This module deliberately separates a confirmed stale entry from an
 * unverified one. A successful API response that reports no entry or a
 * different commit is stale. An API error is retried, then reported as
 * unverified if GitHub cannot be reached reliably.
 */
export type MergeQueueEntryState = 'current' | 'stale' | 'unverified';

export interface MergeQueueEntryVerification {
  /** Whether retrying the failed merge-group workflow is safe. */
  state: MergeQueueEntryState;
  /** The active queue-entry SHA when GitHub returned one. */
  headSha?: string;
}

export interface VerifyMergeQueueEntryOptions {
  /** SHA from the failed workflow_run event. */
  expectedHeadSha: string;
  /** Fetches the active merge queue entry's head SHA, or null if none exists. */
  getHeadSha: () => Promise<string | null>;
  /** Limits transient API retries so triage cannot hold the queue indefinitely. */
  maxAttempts?: number;
  /** Injectable delay for unit tests and bounded production backoff. */
  sleep?: (milliseconds: number) => Promise<void>;
}

export interface VerifyMergeQueueRetryOptions
  extends VerifyMergeQueueEntryOptions {
  /** Confirms the failed run's temporary merge-queue ref still exists. */
  refExists: () => Promise<boolean>;
}

const DEFAULT_MAX_ATTEMPTS = 3;

function defaultSleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export async function verifyMergeQueueEntry({
  expectedHeadSha,
  getHeadSha,
  maxAttempts = DEFAULT_MAX_ATTEMPTS,
  sleep = defaultSleep,
}: VerifyMergeQueueEntryOptions): Promise<MergeQueueEntryVerification> {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const headSha = await getHeadSha();
      if (headSha === expectedHeadSha) {
        // The PR is still queued on the same synthetic merge-group commit.
        return { state: 'current', headSha };
      }

      // A null result or a different SHA is a successful, authoritative API
      // response. Retrying would not make this obsolete workflow current.
      return { state: 'stale', ...(headSha ? { headSha } : {}) };
    } catch {
      if (attempt === maxAttempts) {
        // Keep the fail-closed distinction: callers must not retry when they
        // cannot establish whether this workflow still belongs to the queue.
        return { state: 'unverified' };
      }

      // Back off briefly for transient GitHub API failures without extending
      // the merge queue's pending state for an unbounded period.
      await sleep(attempt * 1000);
    }
  }

  return { state: 'unverified' };
}

export async function verifyMergeQueueRetry({
  refExists,
  ...entryOptions
}: VerifyMergeQueueRetryOptions): Promise<MergeQueueEntryVerification> {
  const entryVerification = await verifyMergeQueueEntry(entryOptions);
  if (entryVerification.state !== 'current') {
    // The ref has no bearing once the entry itself is confirmed stale or the
    // API could not establish that it is current.
    return entryVerification;
  }

  // GitHub can delete the temporary gh-readonly-queue ref between the GraphQL
  // lookup and the rerun request. Check it last, immediately before callers
  // authorize the retry, to close that race.
  try {
    return (await refExists())
      ? entryVerification
      : { state: 'stale', headSha: entryVerification.headSha };
  } catch {
    // A ref API error does not prove the ref disappeared. Fail closed without
    // misreporting a still-current queue entry as stale.
    return { state: 'unverified', headSha: entryVerification.headSha };
  }
}
