import { getRetryBudget, parseAttempt } from './retry-budget.mts';

describe('parseAttempt', () => {
  it('uses attempt 1 when the value is missing or invalid', () => {
    expect(parseAttempt('')).toBe(1);
    expect(parseAttempt('abc')).toBe(1);
    expect(parseAttempt(0)).toBe(1);
  });

  it('normalizes valid attempts to whole numbers', () => {
    expect(parseAttempt('2')).toBe(2);
    expect(parseAttempt(3.9)).toBe(3);
  });
});

describe('getRetryBudget', () => {
  it('retries retryable PR failures on attempt 1 without a label', () => {
    expect(
      getRetryBudget({
        attempt: 1,
        context: 'pr',
        hasRetryLabel: false,
        isRetryable: true,
      }),
    ).toStrictEqual({
      attemptNumber: 1,
      automaticRetryLimit: 2,
      automaticRetryLimitReached: false,
      consumeRetryLabel: false,
      labelRetryLimit: 4,
      labelRetryLimitReached: false,
      retryMode: 'automatic',
      willRetry: true,
    });
  });

  it('does not consume retry-ci when attempt 1 is inside the default budget', () => {
    const decision = getRetryBudget({
      attempt: 1,
      context: 'pr',
      hasRetryLabel: true,
      isRetryable: true,
    });

    expect(decision.retryMode).toBe('automatic');
    expect(decision.consumeRetryLabel).toBe(false);
    expect(decision.willRetry).toBe(true);
  });

  it('requires retry-ci before retrying a main-targeting PR E2E failure', () => {
    // A limit of one means attempt one has no automatic rerun available; the
    // same retry can proceed only through the ordinary retry-ci budget.
    const withoutLabel = getRetryBudget({
      attempt: 1,
      context: 'pr',
      hasRetryLabel: false,
      isRetryable: true,
      automaticRetryLimit: 1,
    });
    const withLabel = getRetryBudget({
      attempt: 1,
      context: 'pr',
      hasRetryLabel: true,
      isRetryable: true,
      automaticRetryLimit: 1,
    });

    expect(withoutLabel.willRetry).toBe(false);
    expect(withoutLabel.retryMode).toBe('none');
    expect(withLabel.willRetry).toBe(true);
    expect(withLabel.retryMode).toBe('label');
    expect(withLabel.consumeRetryLabel).toBe(true);
  });

  it('keeps the automatic retry for non-E2E failures on a main-targeting PR', () => {
    const decision = getRetryBudget({
      attempt: 1,
      context: 'pr',
      hasRetryLabel: false,
      isRetryable: true,
    });

    expect(decision.willRetry).toBe(true);
    expect(decision.retryMode).toBe('automatic');
    expect(decision.consumeRetryLabel).toBe(false);
  });

  it('stops at attempt 2 without retry-ci', () => {
    const decision = getRetryBudget({
      attempt: 2,
      context: 'pr',
      hasRetryLabel: false,
      isRetryable: true,
    });

    expect(decision.automaticRetryLimitReached).toBe(true);
    expect(decision.labelRetryLimitReached).toBe(false);
    expect(decision.retryMode).toBe('none');
    expect(decision.willRetry).toBe(false);
  });

  it('uses retry-ci to retry attempts 2 and 3', () => {
    for (const attempt of [2, 3]) {
      const decision = getRetryBudget({
        attempt,
        context: 'pr',
        hasRetryLabel: true,
        isRetryable: true,
      });

      expect(decision.consumeRetryLabel).toBe(true);
      expect(decision.labelRetryLimit).toBe(4);
      expect(decision.retryMode).toBe('label');
      expect(decision.willRetry).toBe(true);
    }
  });

  it('stops at attempt 4 even with retry-ci', () => {
    const decision = getRetryBudget({
      attempt: 4,
      context: 'pr',
      hasRetryLabel: true,
      isRetryable: true,
    });

    expect(decision.automaticRetryLimitReached).toBe(true);
    expect(decision.labelRetryLimitReached).toBe(true);
    expect(decision.retryMode).toBe('none');
    expect(decision.willRetry).toBe(false);
  });

  it('preserves the retry-ci ceiling after the label-funded retry consumes the label', () => {
    // Removing retry-ci authorizes no further retries, but must not erase the
    // fixed attempt-four ceiling used for terminal reporting.
    const decision = getRetryBudget({
      attempt: 3,
      context: 'pr',
      hasRetryLabel: false,
      isRetryable: true,
    });

    expect(decision.automaticRetryLimitReached).toBe(true);
    expect(decision.labelRetryLimitReached).toBe(false);
    expect(decision.retryMode).toBe('none');
    expect(decision.willRetry).toBe(false);
  });

  it('reports the retry-ci ceiling at attempt 4 after the label was consumed', () => {
    const decision = getRetryBudget({
      attempt: 4,
      context: 'pr',
      hasRetryLabel: false,
      isRetryable: true,
    });

    expect(decision.automaticRetryLimitReached).toBe(true);
    expect(decision.labelRetryLimitReached).toBe(true);
    expect(decision.retryMode).toBe('none');
    expect(decision.willRetry).toBe(false);
  });

  it('does not retry non-retryable failures', () => {
    const decision = getRetryBudget({
      attempt: 1,
      context: 'pr',
      hasRetryLabel: true,
      isRetryable: false,
    });

    expect(decision.automaticRetryLimitReached).toBe(false);
    expect(decision.retryMode).toBe('none');
    expect(decision.willRetry).toBe(false);
  });

  it('does not retry runs without an originating PR', () => {
    const decision = getRetryBudget({
      attempt: 1,
      context: 'observation',
      hasRetryLabel: false,
      isRetryable: true,
    });

    expect(decision.automaticRetryLimitReached).toBe(false);
    expect(decision.retryMode).toBe('none');
    expect(decision.willRetry).toBe(false);
  });

  it('automatically retries release branch pushes without a PR', () => {
    const decision = getRetryBudget({
      attempt: 1,
      context: 'release-push',
      hasRetryLabel: false,
      isRetryable: true,
    });

    expect(decision.automaticRetryLimitReached).toBe(false);
    expect(decision.consumeRetryLabel).toBe(false);
    expect(decision.automaticRetryLimit).toBe(2);
    expect(decision.retryMode).toBe('automatic');
    expect(decision.willRetry).toBe(true);
  });

  it('stops release branch pushes at the automatic retry limit', () => {
    const decision = getRetryBudget({
      attempt: 2,
      context: 'release-push',
      hasRetryLabel: false,
      isRetryable: true,
    });

    expect(decision.automaticRetryLimitReached).toBe(true);
    expect(decision.labelRetryLimitReached).toBe(false);
    expect(decision.retryMode).toBe('none');
    expect(decision.willRetry).toBe(false);
  });

  it('keeps release pushes terminal after attempt 2', () => {
    const decision = getRetryBudget({
      attempt: 3,
      context: 'release-push',
      hasRetryLabel: true,
      isRetryable: true,
    });

    expect(decision.automaticRetryLimitReached).toBe(true);
    expect(decision.willRetry).toBe(false);
  });
});
