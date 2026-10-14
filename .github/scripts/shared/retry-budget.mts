/**
 * The pure retry-budget policy shared by failure classification and its tests.
 * Workflow YAML mirrors the numeric limits where it must run without a
 * checkout, but this module is the source of truth for triage decisions.
 *
 * Attempts are one-indexed GitHub Actions run attempts. A retry is allowed
 * only before its configured limit: attempt 1 can create attempt 2; a
 * retry-ci label can additionally authorize attempts 2 -> 3 and 3 -> 4.
 */
export const DEFAULT_RETRY_MAX_ATTEMPT = 2;
export const RETRY_CI_LABEL_MAX_ATTEMPT = 4;

export type RetryMode = 'automatic' | 'label' | 'none';
export type RetryContext = 'pr' | 'release-push' | 'observation';

export interface RetryBudgetInput {
  /** GitHub Actions run_attempt from the failed Main workflow. */
  attempt: number | string;
  /** Identifies whether the event can use a retry budget. */
  context: RetryContext;
  /** Whether the originating PR currently has the retry-ci label. */
  hasRetryLabel: boolean;
  /** Whether all non-optional failed jobs were classified as retryable. */
  isRetryable: boolean;
  /** Last attempt that can automatically create a retry. */
  automaticRetryLimit?: number;
}

export interface RetryBudgetDecision {
  /** Sanitized one-indexed attempt number used for all policy comparisons. */
  attemptNumber: number;
  /** Last attempt that can automatically create a retry. */
  automaticRetryLimit: number;
  /** Whether the automatic retry allowance is exhausted. */
  automaticRetryLimitReached: boolean;
  /** True only when this retry spends the retry-ci label authorization. */
  consumeRetryLabel: boolean;
  /** Last attempt that can create a retry using retry-ci. */
  labelRetryLimit: number;
  /** Whether the retry-ci retry allowance is exhausted. */
  labelRetryLimitReached: boolean;
  /** Distinguishes automatic, label-funded, and terminal decisions. */
  retryMode: RetryMode;
  /** Whether triage should call gh run rerun --failed. */
  willRetry: boolean;
}

export function parseAttempt(attempt: number | string): number {
  const attemptNumber =
    typeof attempt === 'number' ? attempt : Number.parseInt(attempt, 10);

  if (!Number.isFinite(attemptNumber) || attemptNumber < 1) {
    // Fail safe to attempt 1: malformed workflow input must not accidentally
    // skip the automatic retry or authorize an unbounded retry.
    return 1;
  }

  return Math.floor(attemptNumber);
}

export function getRetryBudget({
  attempt,
  context,
  hasRetryLabel,
  isRetryable,
  automaticRetryLimit = DEFAULT_RETRY_MAX_ATTEMPT,
}: RetryBudgetInput): RetryBudgetDecision {
  const labelRetryLimit = RETRY_CI_LABEL_MAX_ATTEMPT;
  const attemptNumber = parseAttempt(attempt);
  const isPullRequest = context === 'pr';
  const canRetry = context === 'pr' || context === 'release-push';
  // Evaluate the budgets independently. A retry-ci label must not be consumed
  // while the default automatic retry is still available.
  const automaticRetryLimitReached = attemptNumber >= automaticRetryLimit;
  const labelRetryLimitReached =
    // The label limit is meaningful only for PRs, but remains an absolute
    // attempt ceiling after a label-funded retry removes the label.
    isPullRequest && attemptNumber >= labelRetryLimit;
  const canAutomaticallyRetry =
    isRetryable &&
    canRetry &&
    !automaticRetryLimitReached;
  const canRetryWithLabel =
    isRetryable &&
    isPullRequest &&
    hasRetryLabel &&
    !labelRetryLimitReached;
  const retryMode: RetryMode = canAutomaticallyRetry
    ? 'automatic'
    : canRetryWithLabel
      ? 'label'
      : 'none';

  return {
    attemptNumber,
    automaticRetryLimit,
    automaticRetryLimitReached,
    consumeRetryLabel: retryMode === 'label',
    labelRetryLimit,
    labelRetryLimitReached,
    retryMode,
    willRetry: retryMode !== 'none',
  };
}
