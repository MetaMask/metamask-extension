// This file is for Jest-specific setup only and runs before our Jest tests.

import nock from 'nock';
import '@testing-library/jest-dom';

jest.mock('webextension-polyfill', () => {
  return {
    runtime: {
      getManifest: () => ({ manifest_version: 2 }),
    },
  };
});

jest.mock('../../ui/hooks/usePetnamesEnabled', () => ({
  usePetnamesEnabled: () => false,
}));

const UNRESOLVED = Symbol('timedOut');

// Store this in case it gets stubbed later
const originalSetTimeout = global.setTimeout;

const TIME_TO_WAIT_UNTIL_UNRESOLVED = 100;

/**
 * Produces a sort of dummy promise which can be used in conjunction with a
 * "real" promise to determine whether the "real" promise was ever resolved. If
 * the promise that is produced by this function resolves first, then the other
 * one must be unresolved.
 *
 * @param {number} duration - How long to wait before resolving the promise returned by
 * this function.
 * @returns A promise that resolves to a symbol.
 */
function treatUnresolvedAfter(duration) {
  return new Promise((resolve) => {
    originalSetTimeout(resolve, duration, UNRESOLVED);
  });
}

/* eslint-disable-next-line jest/require-top-level-describe */
beforeEach(() => {
  nock.cleanAll();
});

expect.extend({
  /**
   * Tests that the given promise is fulfilled within a certain amount of time
   * (which is the default time that Jest tests wait before timing out as
   * configured in the Jest configuration file).
   *
   * Inspired by <https://stackoverflow.com/a/68409467/260771>.
   *
   * @param {Promise<any>} promise - The promise to test.
   * @returns The result of the matcher.
   */
  async toBeFulfilled(promise) {
    if (this.isNot) {
      throw new Error(
        "Using `.not.toBeFulfilled(...)` is not supported. Use `.rejects` to test the promise's rejection value instead.",
      );
    }

    let rejectionValue = UNRESOLVED;
    try {
      await promise;
    } catch (e) {
      rejectionValue = e;
    }

    if (rejectionValue !== UNRESOLVED) {
      return {
        message: () =>
          `Expected promise to be fulfilled, but it was rejected with ${rejectionValue}.`,
        pass: false,
      };
    }

    return {
      message: () =>
        'This message should not be displayed as it is for the negative case, which will never happen.',
      pass: true,
    };
  },

  /**
   * Tests that the given promise is never fulfilled or rejected past a certain
   * amount of time (which is the default time that Jest tests wait before
   * timing out as configured in the Jest configuration file).
   *
   * Inspired by <https://stackoverflow.com/a/68409467/260771>.
   *
   * @param {Promise<any>} promise - The promise to test.
   * @returns The result of the matcher.
   */
  async toNeverResolve(promise) {
    if (this.isNot) {
      throw new Error(
        'Using `.not.toNeverResolve(...)` is not supported. ' +
          'You probably want to either `await` the promise and test its ' +
          'resolution value or use `.rejects` to test its rejection value instead.',
      );
    }

    let resolutionValue;
    let rejectionValue;
    try {
      resolutionValue = await Promise.race([
        promise,
        treatUnresolvedAfter(TIME_TO_WAIT_UNTIL_UNRESOLVED),
      ]);
    } catch (e) {
      rejectionValue = e;
    }

    return resolutionValue === UNRESOLVED
      ? {
          message: () =>
            `Expected promise to resolve after ${TIME_TO_WAIT_UNTIL_UNRESOLVED}ms, but it did not`,
          pass: true,
        }
      : {
          message: () => {
            return `Expected promise to never resolve after ${TIME_TO_WAIT_UNTIL_UNRESOLVED}ms, but it ${
              rejectionValue
                ? `was rejected with ${rejectionValue}`
                : `resolved with ${resolutionValue}`
            }`;
          },
          pass: false,
        };
  },
});

// Setup window.prompt
global.prompt = () => undefined;
