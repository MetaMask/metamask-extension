/**
 * The pure retry-budget policy shared by failure classification and its tests.
 * Workflow YAML mirrors the numeric limits where it must run without a
 * checkout, but this module is the source of truth for triage decisions.
 *
 * Attempts are one-indexed GitHub Actions run attempts. A retry is allowed
 * only before the selected limit: attempt 1 can create attempt 2; a retry-ci
 * label can additionally authorize attempts 2 -> 3 and 3 -> 4.
 */
export const DEFAULT_RETRY_MAX_ATTEMPT = 2;
export const RETRY_CI_LABEL_MAX_ATTEMPT = 4;

export type RetryMode = 'automatic' | 'label' | 'none';
export type RetryLimitSource = 'default' | 'retry-ci';

export interface RetryBudgetInput {
  /** GitHub Actions run_attempt from the failed Main workflow. */
  attempt: number | string;
  /** Whether this run can be associated with an originating PR. */
  hasPr: boolean;
  /** Whether the originating PR currently has the retry-ci label. */
  hasRetryLabel: boolean;
  /** Whether all non-optional failed jobs were classified as retryable. */
  isRetryable: boolean;
}

export interface RetryBudgetDecision {
  /** Sanitized one-indexed attempt number used for all policy comparisons. */
  attemptNumber: number;
  /** True only for retryable PR failures that have exhausted their budget. */
  atRetryLimit: boolean;
  /** True only when this retry spends the retry-ci label authorization. */
  consumeRetryLabel: boolean;
  /** Last permitted attempt for the selected retry budget. */
  retryLimit: number;
  /** Explains whether the default or retry-ci limit was selected. */
  retryLimitSource: RetryLimitSource;
  /** True when this run could only have been reached with retry-ci funding. */
  usedRetryCiBudget: boolean;
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
  hasPr,
  hasRetryLabel,
  isRetryable,
}: RetryBudgetInput): RetryBudgetDecision {
  const attemptNumber = parseAttempt(attempt);
  // Attempts above the default ceiling can only be created by a prior
  // retry-ci-funded rerun. The label is removed after that rerun succeeds,
  // so preserve the selected ceiling for later reporting and terminal status.
  const usedRetryCiBudget = attemptNumber > DEFAULT_RETRY_MAX_ATTEMPT;
  const retryLimit = hasRetryLabel || usedRetryCiBudget
    ? RETRY_CI_LABEL_MAX_ATTEMPT
    : DEFAULT_RETRY_MAX_ATTEMPT;
  const retryLimitSource: RetryLimitSource = hasRetryLabel || usedRetryCiBudget
    ? 'retry-ci'
    : 'default';
  // Pushes and other runs without an originating PR are observation-only.
  // A retry also requires a retryable classification and a current label for
  // retries beyond the automatic attempt 1 -> 2 transition.
  const willRetry =
    isRetryable &&
    hasPr &&
    attemptNumber < retryLimit &&
    (attemptNumber < DEFAULT_RETRY_MAX_ATTEMPT || hasRetryLabel);
  const retryMode: RetryMode = !willRetry
    ? 'none'
    : attemptNumber < DEFAULT_RETRY_MAX_ATTEMPT
      ? 'automatic'
      : 'label';

  return {
    attemptNumber,
    // Do not call a non-retryable failure "at limit"; that distinction drives
    // the human-readable classifier report and terminal status description.
    atRetryLimit: isRetryable && hasPr && attemptNumber >= retryLimit,
    consumeRetryLabel: retryMode === 'label',
    retryLimit,
    retryLimitSource,
    retryMode,
    usedRetryCiBudget,
    willRetry,
  };
}
