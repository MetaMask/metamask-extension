import nock from 'nock';

import {
  DataDeletionService,
  RETRIES,
  MAX_CONSECUTIVE_FAILURES,
} from './data-deletion-service';

// We're not customizing the default max delay
// The default can be found here: https://github.com/connor4312/cockatiel?tab=readme-ov-file#exponentialbackoff
const defaultMaxRetryDelay = 30_000;
// Timeout is well over max retry delay, so that requests don't time out when we advance the timer
// to trigger retries.
const defaultTimeout = defaultMaxRetryDelay * 2;

const mockMetaMetricsId = 'mockMetaMetricsId';
const mockSourceId = 'mockSourceId';
const mockAnalyticsDataDeletionOrigin = 'https://metamask.test';
const mockAnalyticsDataDeletionPath = '/data-deletion';
const mockAnalyticsCreateDataDeletionPath = `${mockAnalyticsDataDeletionPath}/regulations/sources/${mockSourceId}`;
// TODO: Add status check tests that use this constant
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mockAnalyticsDataDeletionStatusPath = `${mockAnalyticsDataDeletionPath}/regulations/`;
const mockAnalyticsDataDeletionEndpoint = `${mockAnalyticsDataDeletionOrigin}${mockAnalyticsDataDeletionPath}`;

describe('DataDeletionService', () => {
  describe('createDataDeletionRegulationTask', () => {
    it('submits a data deletion request', async () => {
      const mockTaskId = 'mockTaskId';
      const mockResponse = {
        data: {
          regulateId: mockTaskId,
        },
      };
      mockDataDeletionInterceptor().reply(200, mockResponse);
      const dataDeletionService = new DataDeletionService(getDefaultOptions());

      const response =
        await dataDeletionService.createDataDeletionRegulationTask(
          mockMetaMetricsId,
        );

      expect(response).toStrictEqual(mockResponse);
    });

    it('throws if the request fails consistently', async () => {
      mockDataDeletionInterceptor().replyWithError('Failed to fetch').persist();
      const dataDeletionService = new DataDeletionService(getDefaultOptions());

      await expect(
        dataDeletionService.createDataDeletionRegulationTask(mockMetaMetricsId),
      ).rejects.toThrow('Failed to fetch');
    });

    it('throws if the initial request and all retries fail', async () => {
      const retries = RETRIES;
      mockDataDeletionInterceptor()
        .times(1 + retries)
        .replyWithError('Failed to fetch');
      const dataDeletionService = new DataDeletionService(getDefaultOptions());

      await expect(
        dataDeletionService.createDataDeletionRegulationTask(mockMetaMetricsId),
      ).rejects.toThrow('Failed to fetch');
    });

    it('succeeds if the last retry succeeds', async () => {
      const retries = RETRIES;
      const mockTaskId = 'mockTaskId';
      const mockResponse = {
        data: {
          regulateId: mockTaskId,
        },
      };
      // Initial interceptor for failing requests
      mockDataDeletionInterceptor()
        .times(retries)
        .replyWithError('Failed to fetch');
      // Interceptor for successful request
      mockDataDeletionInterceptor().reply(200, mockResponse);
      const dataDeletionService = new DataDeletionService(getDefaultOptions());

      const response =
        await dataDeletionService.createDataDeletionRegulationTask(
          mockMetaMetricsId,
        );

      expect(response).toStrictEqual(mockResponse);
    });

    describe('timeout', () => {
      beforeEach(() => {
        jest.useFakeTimers();
      });

      afterEach(() => {
        jest.useRealTimers();
      });

      it('throws if all attempts exceed the timeout', async () => {
        const retries = RETRIES;
        const timeout = 10_000;
        const mockTaskId = 'mockTaskId';
        const mockResponse = {
          data: {
            regulateId: mockTaskId,
          },
        };
        mockDataDeletionInterceptor()
          .times(1 + retries)
          .delay(timeout * 2)
          .reply(200, mockResponse);
        const dataDeletionService = new DataDeletionService({
          ...getDefaultOptions(),
          timeout,
        });

        await expect(
          fetchWithFakeTimers({
            fetchOperation: () =>
              dataDeletionService.createDataDeletionRegulationTask(
                mockMetaMetricsId,
              ),
            retries,
          }),
        ).rejects.toThrow('The user aborted a request');
      });
    });

    describe('before circuit break', () => {
      beforeEach(() => {
        jest.useFakeTimers();
      });

      afterEach(() => {
        jest.useRealTimers();
      });

      it('does not call onDegraded when requests succeeds faster than threshold', async () => {
        const degradedThreshold = 1000;
        const mockTaskId = 'mockTaskId';
        const mockResponse = {
          data: {
            regulateId: mockTaskId,
          },
        };
        mockDataDeletionInterceptor()
          .delay(degradedThreshold / 2)
          .reply(200, mockResponse);
        const onDegraded = jest.fn();
        const dataDeletionService = new DataDeletionService({
          ...getDefaultOptions(),
          degradedThreshold,
          onDegraded,
        });

        await fetchWithFakeTimers({
          fetchOperation: () =>
            dataDeletionService.createDataDeletionRegulationTask(
              mockMetaMetricsId,
            ),
          retries: 0,
        });

        expect(onDegraded).not.toHaveBeenCalled();
      });

      it('does not call onDegraded when requests succeeds on retry faster than threshold', async () => {
        const responseDelay = 1000;
        // Set threshold above max retry delay to ensure the time is always under the threshold,
        // even with random jitter
        const degradedThreshold = defaultMaxRetryDelay + responseDelay + 100;
        const mockTaskId = 'mockTaskId';
        const mockResponse = {
          data: {
            regulateId: mockTaskId,
          },
        };
        // Initial interceptor for failing requests
        mockDataDeletionInterceptor().replyWithError('Failed to fetch');
        // Second interceptor for successful response
        mockDataDeletionInterceptor()
          .delay(responseDelay)
          .reply(200, mockResponse);
        const onDegraded = jest.fn();
        const dataDeletionService = new DataDeletionService({
          ...getDefaultOptions(),
          degradedThreshold,
          onDegraded,
        });

        await fetchWithFakeTimers({
          fetchOperation: () =>
            dataDeletionService.createDataDeletionRegulationTask(
              mockMetaMetricsId,
            ),
          retries: 1,
        });

        expect(onDegraded).not.toHaveBeenCalled();
      });

      it('calls onDegraded when request fails', async () => {
        mockDataDeletionInterceptor()
          .replyWithError('Failed to fetch')
          .persist();
        const onDegraded = jest.fn();
        const dataDeletionService = new DataDeletionService({
          ...getDefaultOptions(),
          onDegraded,
        });

        await expect(() =>
          fetchWithFakeTimers({
            fetchOperation: () =>
              dataDeletionService.createDataDeletionRegulationTask(
                mockMetaMetricsId,
              ),
            // Advance timers enough to resolve default number of retries
            retries: RETRIES,
          }),
        ).rejects.toThrow('Failed to fetch');

        expect(onDegraded).toHaveBeenCalledTimes(1);
      });

      it('calls onDegraded when request is slower than threshold', async () => {
        const degradedThreshold = 1000;
        const retries = 0;
        const mockTaskId = 'mockTaskId';
        const mockResponse = {
          data: {
            regulateId: mockTaskId,
          },
        };
        nock(mockAnalyticsDataDeletionOrigin)
          .post(mockAnalyticsCreateDataDeletionPath)
          .delay(degradedThreshold * 2)
          .reply(200, mockResponse);
        const onDegraded = jest.fn();
        const dataDeletionService = new DataDeletionService({
          ...getDefaultOptions(),
          degradedThreshold,
          onDegraded,
        });

        await fetchWithFakeTimers({
          fetchOperation: () =>
            dataDeletionService.createDataDeletionRegulationTask(
              mockMetaMetricsId,
            ),
          retries,
        });

        expect(onDegraded).toHaveBeenCalledTimes(1);
      });

      it('calls onDegraded when request is slower than threshold after retry', async () => {
        const degradedThreshold = 1000;
        const mockTaskId = 'mockTaskId';
        const mockResponse = {
          data: {
            regulateId: mockTaskId,
          },
        };
        // Initial interceptor for failing requests
        mockDataDeletionInterceptor().replyWithError('Failed to fetch');
        // Second interceptor for successful response
        mockDataDeletionInterceptor()
          .delay(degradedThreshold * 2)
          .reply(200, mockResponse);
        const onDegraded = jest.fn();
        const dataDeletionService = new DataDeletionService({
          ...getDefaultOptions(),
          degradedThreshold,
          onDegraded,
        });

        await fetchWithFakeTimers({
          fetchOperation: () =>
            dataDeletionService.createDataDeletionRegulationTask(
              mockMetaMetricsId,
            ),
          retries: 1,
        });

        expect(onDegraded).toHaveBeenCalledTimes(1);
      });
    });

    describe('after circuit break', () => {
      beforeEach(() => {
        jest.useFakeTimers();
      });

      afterEach(() => {
        jest.useRealTimers();
      });

      it('stops making fetch requests after too many consecutive failures', async () => {
        const retries = RETRIES;
        const maxRequestsPerAttempt = retries + 1;
        const attemptsToTriggerBreak =
          MAX_CONSECUTIVE_FAILURES / maxRequestsPerAttempt;
        const mockTaskId = 'mockTaskId';
        const mockResponse = {
          data: {
            regulateId: mockTaskId,
          },
        };
        // Initial interceptor for failing requests
        mockDataDeletionInterceptor()
          .times(MAX_CONSECUTIVE_FAILURES)
          .replyWithError('Failed to fetch');
        // This interceptor should not be used
        const successfullCallScope = mockDataDeletionInterceptor().reply(
          200,
          mockResponse,
        );
        const dataDeletionService = new DataDeletionService({
          ...getDefaultOptions(),
          // Ensure break duration is well over the max delay for a single request, so that the
          // break doesn't end during a retry attempt
          circuitBreakDuration: defaultMaxRetryDelay * 10,
        });
        const fetchOperation = () =>
          dataDeletionService.createDataDeletionRegulationTask(
            mockMetaMetricsId,
          );
        // Initial calls to exhaust maximum allowed failures
        for (const _attempt of Array(attemptsToTriggerBreak).keys()) {
          await expect(() =>
            fetchWithFakeTimers({
              fetchOperation,
              retries,
            }),
          ).rejects.toThrow('Failed to fetch');
        }

        await expect(() =>
          fetchWithFakeTimers({
            fetchOperation,
            retries,
          }),
        ).rejects.toThrow(
          'Execution prevented because the circuit breaker is open',
        );
        expect(successfullCallScope.isDone()).toBe(false);
      });

      it('calls onBreak handler upon break', async () => {
        const retries = RETRIES;
        const maxRequestsPerAttempt = retries + 1;
        const attemptsToTriggerBreak =
          MAX_CONSECUTIVE_FAILURES / maxRequestsPerAttempt;
        // Initial interceptor for failing requests
        mockDataDeletionInterceptor()
          .times(MAX_CONSECUTIVE_FAILURES)
          .replyWithError('Failed to fetch');
        const onBreak = jest.fn();
        const dataDeletionService = new DataDeletionService({
          ...getDefaultOptions(),
          // Ensure break duration is well over the max delay for a single request, so that the
          // break doesn't end during a retry attempt
          circuitBreakDuration: defaultMaxRetryDelay * 10,
          onBreak,
        });
        const fetchOperation = () =>
          dataDeletionService.createDataDeletionRegulationTask(
            mockMetaMetricsId,
          );

        // Initial calls to exhaust maximum allowed failures
        for (const _attempt of Array(attemptsToTriggerBreak).keys()) {
          await expect(() =>
            fetchWithFakeTimers({
              fetchOperation,
              retries,
            }),
          ).rejects.toThrow('Failed to fetch');
        }

        expect(onBreak).toHaveBeenCalledTimes(1);
      });

      it('stops calling onDegraded', async () => {
        const retries = RETRIES;
        const maxRequestsPerAttempt = retries + 1;
        const attemptsToTriggerBreak =
          MAX_CONSECUTIVE_FAILURES / maxRequestsPerAttempt;
        // Initial interceptor for failing requests
        mockDataDeletionInterceptor()
          .times(MAX_CONSECUTIVE_FAILURES)
          .replyWithError('Failed to fetch');
        const onBreak = jest.fn();
        const onDegraded = jest.fn();
        const dataDeletionService = new DataDeletionService({
          ...getDefaultOptions(),
          // Ensure break duration is well over the max delay for a single request, so that the
          // break doesn't end during a retry attempt
          circuitBreakDuration: defaultMaxRetryDelay * 10,
          onBreak,
          onDegraded,
        });
        const fetchOperation = () =>
          dataDeletionService.createDataDeletionRegulationTask(
            mockMetaMetricsId,
          );
        // Initial calls to exhaust maximum allowed failures
        for (const _attempt of Array(attemptsToTriggerBreak).keys()) {
          await expect(() =>
            fetchWithFakeTimers({
              fetchOperation,
              retries,
            }),
          ).rejects.toThrow('Failed to fetch');
        }
        // Confirm that circuit is broken
        expect(onBreak).toHaveBeenCalledTimes(1);
        // Should be called twice by now, once per update attempt prior to break
        expect(onDegraded).toHaveBeenCalledTimes(attemptsToTriggerBreak - 1);

        await expect(() =>
          fetchWithFakeTimers({
            fetchOperation,
            retries,
          }),
        ).rejects.toThrow(
          'Execution prevented because the circuit breaker is open',
        );

        expect(onDegraded).toHaveBeenCalledTimes(attemptsToTriggerBreak - 1);
      });

      it('keeps circuit closed if first request fails when half-open', async () => {
        const retries = RETRIES;
        const maxRequestsPerAttempt = retries + 1;
        const attemptsToTriggerBreak =
          MAX_CONSECUTIVE_FAILURES / maxRequestsPerAttempt;
        const mockTaskId = 'mockTaskId';
        const mockResponse = {
          data: {
            regulateId: mockTaskId,
          },
        };
        // Ensure break duration is well over the max delay for a single request, so that the
        // break doesn't end during a retry attempt
        const circuitBreakDuration = defaultMaxRetryDelay * 10;
        // Initial interceptor for failing requests
        mockDataDeletionInterceptor()
          // The +1 is for the additional request when the circuit is half-open
          .times(MAX_CONSECUTIVE_FAILURES + 1)
          .replyWithError('Failed to fetch');
        // This interceptor should not be used
        const successfullCallScope = mockDataDeletionInterceptor().reply(
          200,
          mockResponse,
        );
        const dataDeletionService = new DataDeletionService({
          ...getDefaultOptions(),
          circuitBreakDuration,
        });
        const fetchOperation = () =>
          dataDeletionService.createDataDeletionRegulationTask(
            mockMetaMetricsId,
          );
        // Initial calls to exhaust maximum allowed failures
        for (const _attempt of Array(attemptsToTriggerBreak).keys()) {
          await expect(() =>
            fetchWithFakeTimers({
              fetchOperation,
              retries,
            }),
          ).rejects.toThrow('Failed to fetch');
        }
        // Confirm that circuit has broken
        await expect(() =>
          fetchWithFakeTimers({
            fetchOperation,
            retries,
          }),
        ).rejects.toThrow(
          'Execution prevented because the circuit breaker is open',
        );
        // Wait for circuit to move to half-open
        await jest.advanceTimersByTimeAsync(circuitBreakDuration);

        // The circuit should remain open after the first request fails
        // The fetch error is replaced by the circuit break error due to the retries
        await expect(() =>
          fetchWithFakeTimers({
            fetchOperation,
            retries,
          }),
        ).rejects.toThrow(
          'Execution prevented because the circuit breaker is open',
        );

        // Confirm that the circuit is still open
        await expect(() =>
          fetchWithFakeTimers({
            fetchOperation,
            retries,
          }),
        ).rejects.toThrow(
          'Execution prevented because the circuit breaker is open',
        );
        expect(successfullCallScope.isDone()).toBe(false);
      });

      it('recovers', async () => {
        const retries = RETRIES;
        const maxRequestsPerAttempt = retries + 1;
        const attemptsToTriggerBreak =
          MAX_CONSECUTIVE_FAILURES / maxRequestsPerAttempt;
        const mockTaskId = 'mockTaskId';
        const mockResponse = {
          data: {
            regulateId: mockTaskId,
          },
        };
        // Ensure break duration is well over the max delay for a single request, so that the
        // break doesn't end during a retry attempt
        const circuitBreakDuration = defaultMaxRetryDelay * 10;
        // Initial interceptor for failing requests
        mockDataDeletionInterceptor()
          .times(MAX_CONSECUTIVE_FAILURES)
          .replyWithError('Failed to fetch');
        // Later interceptor for successfull request after recovery
        mockDataDeletionInterceptor().reply(200, mockResponse);
        const dataDeletionService = new DataDeletionService({
          ...getDefaultOptions(),
          circuitBreakDuration,
        });
        const fetchOperation = () =>
          dataDeletionService.createDataDeletionRegulationTask(
            mockMetaMetricsId,
          );
        // Initial calls to exhaust maximum allowed failures
        for (const _attempt of Array(attemptsToTriggerBreak).keys()) {
          await expect(() => {
            return fetchWithFakeTimers({
              fetchOperation,
              retries,
            });
          }).rejects.toThrow('Failed to fetch');
        }
        // Confirm that circuit has broken
        await expect(() =>
          fetchWithFakeTimers({
            fetchOperation,
            retries,
          }),
        ).rejects.toThrow(
          'Execution prevented because the circuit breaker is open',
        );
        // Wait for circuit to move to half-open
        await jest.advanceTimersByTimeAsync(circuitBreakDuration);

        const response = await fetchWithFakeTimers({
          fetchOperation,
          retries,
        });

        expect(response).toStrictEqual(mockResponse);
      });
    });
  });
});

/**
 * Calls the given fetch operation while advancing the fake timers clock, allowing the function to
 * resolve.
 *
 * Fetching in an environment with fake timers is challenging because we're using a library that
 * automatically retries failed requests, which uses `setTimeout` internally. We have to advance
 * the clock after the update call starts but before awaiting the result, otherwise it never
 * resolves.
 *
 * @param args - Arguments
 * @param args.fetchOperation - The fetch operation to call.
 * @param args.retries - The number of retries the fetch call is configured to make.
 */
async function fetchWithFakeTimers({
  fetchOperation,
  retries,
}: {
  fetchOperation: () => Promise<unknown>;
  retries: number;
}) {
  const pendingUpdate = fetchOperation();

  // This IIFE will track when the request has resolved, and will ensure that
  // the tests don't trigger an "Unhandled Promise error" due to the delayed
  // handling of the Promise.
  let resolved = false;
  (async () => {
    try {
      await pendingUpdate;
    } catch (error) {
      // suppress Unhandled Promise error
    } finally {
      resolved = true;
    }
  })();

  // Advance timer enough to exceed max possible retry delay for initial call and all
  // subsequent retries, until request has resolved.
  for (const _retryAttempt of Array(retries + 1).keys()) {
    if (resolved) {
      break;
    }
    // Advance timer in steps to allow room for other timers/Promises to resolve during this
    // waiting period, and to prevent unnecessarily long waiting.
    const intervalLength = defaultMaxRetryDelay / 10;
    const numberOfIntervals = defaultMaxRetryDelay / intervalLength;
    for (const _interval of new Array(numberOfIntervals).keys()) {
      if (resolved) {
        break;
      }
      await jest.advanceTimersByTimeAsync(intervalLength);
    }
  }

  return await pendingUpdate;
}

/**
 * Create a Nock scope for the "create data deletion task" route.
 *
 * @returns A Nock interceptor for the "create data deletion" request.
 */
function mockDataDeletionInterceptor(): nock.Interceptor {
  return nock(mockAnalyticsDataDeletionOrigin).post(
    mockAnalyticsCreateDataDeletionPath,
    {
      regulationType: 'DELETE_ONLY',
      subjectType: 'USER_ID',
      subjectIds: [mockMetaMetricsId],
    },
  );
}

/**
 * Get default options for the DataDeletionService.
 *
 * @returns Default options for the data deletion service.
 */
function getDefaultOptions(): ConstructorParameters<
  typeof DataDeletionService
>[0] {
  return {
    analyticsDataDeletionEndpoint: mockAnalyticsDataDeletionEndpoint,
    analyticsDataDeletionSourceId: mockSourceId,
    timeout: defaultTimeout,
  };
}
