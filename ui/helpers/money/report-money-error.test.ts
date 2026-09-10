import { createSentryError } from '../../../shared/lib/error';
import { captureException } from '../../../shared/lib/sentry';
import {
  clearReportedMoneyQueryError,
  reportMoneyError,
  reportMoneyQueryErrorOnce,
  resetReportedMoneyQueryErrorsForTests,
} from './report-money-error';

jest.mock('../../../shared/lib/sentry', () => ({
  captureException: jest.fn(),
}));

const captureExceptionMock = jest.mocked(captureException);

describe('reportMoneyError', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('captures a Sentry error tagged as the money feature', () => {
    const cause = new Error('setup failed');

    reportMoneyError('[Money Account] Deposit setup failed', cause, {
      flow: 'deposit',
      intent: 'addMusd',
    });

    expect(captureExceptionMock).toHaveBeenCalledTimes(1);
    const [sentryError, hint] = captureExceptionMock.mock.calls[0];
    expect(sentryError).toStrictEqual(
      createSentryError('[Money Account] Deposit setup failed', cause),
    );
    expect((sentryError as Error & { cause: unknown }).cause).toBe(cause);
    expect(hint).toStrictEqual({
      tags: { feature: 'money' },
      extra: { flow: 'deposit', intent: 'addMusd' },
    });
  });

  it('omits extra when none is provided', () => {
    reportMoneyError('[Money Account] Availability query failed', 'boom');

    expect(captureExceptionMock).toHaveBeenCalledWith(expect.any(Error), {
      tags: { feature: 'money' },
    });
  });
});

describe('reportMoneyQueryErrorOnce', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetReportedMoneyQueryErrorsForTests();
  });

  it('reports the first failure for a query key', () => {
    const error = new Error('balance down');

    reportMoneyQueryErrorOnce(
      'fetchBalanceWithFallback',
      '[Money Account] Balance fetch failed',
      error,
      { query: 'fetchBalanceWithFallback' },
    );

    expect(captureExceptionMock).toHaveBeenCalledTimes(1);
  });

  it('does not re-report the same query key and error message', () => {
    const first = new Error('balance down');
    const second = new Error('balance down');

    reportMoneyQueryErrorOnce(
      'fetchBalanceWithFallback',
      '[Money Account] Balance fetch failed',
      first,
      { query: 'fetchBalanceWithFallback' },
    );
    reportMoneyQueryErrorOnce(
      'fetchBalanceWithFallback',
      '[Money Account] Balance fetch failed',
      second,
      { query: 'fetchBalanceWithFallback' },
    );

    expect(captureExceptionMock).toHaveBeenCalledTimes(1);
  });

  it('reports again when the same query fails with a different message', () => {
    reportMoneyQueryErrorOnce(
      'fetchBalanceWithFallback',
      '[Money Account] Balance fetch failed',
      new Error('timeout'),
      { query: 'fetchBalanceWithFallback' },
    );
    reportMoneyQueryErrorOnce(
      'fetchBalanceWithFallback',
      '[Money Account] Balance fetch failed',
      new Error('network'),
      { query: 'fetchBalanceWithFallback' },
    );

    expect(captureExceptionMock).toHaveBeenCalledTimes(2);
  });

  it('reports again after the query recovers', () => {
    const error = new Error('balance down');

    reportMoneyQueryErrorOnce(
      'fetchBalanceWithFallback',
      '[Money Account] Balance fetch failed',
      error,
      { query: 'fetchBalanceWithFallback' },
    );
    clearReportedMoneyQueryError('fetchBalanceWithFallback');
    reportMoneyQueryErrorOnce(
      'fetchBalanceWithFallback',
      '[Money Account] Balance fetch failed',
      error,
      { query: 'fetchBalanceWithFallback' },
    );

    expect(captureExceptionMock).toHaveBeenCalledTimes(2);
  });
});
