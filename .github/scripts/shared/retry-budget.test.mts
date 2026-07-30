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
        hasPr: true,
        hasRetryLabel: false,
        isRetryable: true,
      }),
    ).toStrictEqual({
      attemptNumber: 1,
      atRetryLimit: false,
      consumeRetryLabel: false,
      retryLimit: 2,
      retryLimitSource: 'default',
      retryMode: 'automatic',
      usedRetryCiBudget: false,
      willRetry: true,
    });
  });

  it('does not consume retry-ci when attempt 1 is inside the default budget', () => {
    const decision = getRetryBudget({
      attempt: 1,
      hasPr: true,
      hasRetryLabel: true,
      isRetryable: true,
    });

    expect(decision.retryMode).toBe('automatic');
    expect(decision.consumeRetryLabel).toBe(false);
    expect(decision.willRetry).toBe(true);
  });

  it('stops at attempt 2 without retry-ci', () => {
    const decision = getRetryBudget({
      attempt: 2,
      hasPr: true,
      hasRetryLabel: false,
      isRetryable: true,
    });

    expect(decision.atRetryLimit).toBe(true);
    expect(decision.retryLimit).toBe(2);
    expect(decision.retryMode).toBe('none');
    expect(decision.willRetry).toBe(false);
  });

  it('uses retry-ci to retry attempts 2 and 3', () => {
    for (const attempt of [2, 3]) {
      const decision = getRetryBudget({
        attempt,
        hasPr: true,
        hasRetryLabel: true,
        isRetryable: true,
      });

      expect(decision.consumeRetryLabel).toBe(true);
      expect(decision.retryLimit).toBe(4);
      expect(decision.retryLimitSource).toBe('retry-ci');
      expect(decision.retryMode).toBe('label');
      expect(decision.willRetry).toBe(true);
    }
  });

  it('stops at attempt 4 even with retry-ci', () => {
    const decision = getRetryBudget({
      attempt: 4,
      hasPr: true,
      hasRetryLabel: true,
      isRetryable: true,
    });

    expect(decision.atRetryLimit).toBe(true);
    expect(decision.retryLimit).toBe(4);
    expect(decision.retryMode).toBe('none');
    expect(decision.usedRetryCiBudget).toBe(true);
    expect(decision.willRetry).toBe(false);
  });

  it('preserves the retry-ci ceiling after the label-funded retry consumes the label', () => {
    const decision = getRetryBudget({
      attempt: 3,
      hasPr: true,
      hasRetryLabel: false,
      isRetryable: true,
    });

    expect(decision.atRetryLimit).toBe(false);
    expect(decision.retryLimit).toBe(4);
    expect(decision.retryLimitSource).toBe('retry-ci');
    expect(decision.retryMode).toBe('none');
    expect(decision.usedRetryCiBudget).toBe(true);
    expect(decision.willRetry).toBe(false);
  });

  it('reports the retry-ci ceiling at attempt 4 after the label was consumed', () => {
    const decision = getRetryBudget({
      attempt: 4,
      hasPr: true,
      hasRetryLabel: false,
      isRetryable: true,
    });

    expect(decision.atRetryLimit).toBe(true);
    expect(decision.retryLimit).toBe(4);
    expect(decision.retryLimitSource).toBe('retry-ci');
    expect(decision.retryMode).toBe('none');
    expect(decision.usedRetryCiBudget).toBe(true);
    expect(decision.willRetry).toBe(false);
  });

  it('does not retry non-retryable failures', () => {
    const decision = getRetryBudget({
      attempt: 1,
      hasPr: true,
      hasRetryLabel: true,
      isRetryable: false,
    });

    expect(decision.atRetryLimit).toBe(false);
    expect(decision.retryMode).toBe('none');
    expect(decision.willRetry).toBe(false);
  });

  it('does not retry runs without an originating PR', () => {
    const decision = getRetryBudget({
      attempt: 1,
      hasPr: false,
      hasRetryLabel: false,
      isRetryable: true,
    });

    expect(decision.atRetryLimit).toBe(false);
    expect(decision.retryMode).toBe('none');
    expect(decision.willRetry).toBe(false);
  });
});
