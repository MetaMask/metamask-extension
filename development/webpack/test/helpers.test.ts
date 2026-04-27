import { describe, it, afterEach, beforeEach, mock } from 'node:test';
import assert from 'node:assert';
import {
  version,
  type Stats,
  type Compilation,
  type StatsOptions,
  type StatsCompilation,
} from 'webpack';
import * as helpers from '../utils/helpers';
import { type Combination, generateCases } from './helpers';

describe('./utils/helpers.ts', () => {
  afterEach(() => mock.restoreAll());

  it('should return undefined when noop it called', () => {
    const nothing = helpers.noop();
    assert.strictEqual(nothing, undefined);
  });

  describe('logStats', () => {
    const getStatsMock = (
      stats: 'normal' | 'none',
      mode: 'development' | 'production',
      hasError: boolean,
      hasWarning: boolean,
    ) => {
      return {
        hash: 'test-hash',
        toJson: null as unknown as () => StatsCompilation,
        endTime: 1000,
        startTime: 0,
        hasErrors: mock.fn(() => hasError),
        hasWarnings: mock.fn(() => hasWarning),
        compilation: {
          options: {
            mode,
            stats,
          },
          compiler: {
            name: 'test-compiler-name',
          },
        } as Compilation,
        toString: mock.fn((_?: unknown) => 'test-stats'),
      } as const satisfies Stats;
    };

    it('should log nothing if err and stats are both not defined', () => {
      const { mock: error } = mock.method(console, 'error', helpers.noop);
      helpers.logStats(undefined, undefined);
      assert.strictEqual(error.callCount(), 0, 'error should not be called');
    });

    it('should log only the error when error and stats are provided', () => {
      const stats = getStatsMock('normal', 'production', false, false);
      const { mock: error } = mock.method(console, 'error', helpers.noop);
      const errorToLog = new Error('test error');

      // should only log the error, and nothing else
      helpers.logStats(errorToLog, stats);

      assert.strictEqual(error.callCount(), 1, 'error should be called');
      assert.deepStrictEqual(
        error.calls[0].arguments,
        [errorToLog],
        'error should be logged',
      );
      assert.strictEqual(
        stats.toString.mock.callCount(),
        0,
        'stats.toString should not be called',
      );
    });

    const matrix = {
      colorDepth: [undefined, 1, 4, 8, 24] as const,
      level: ['normal', 'none'] as const,
      env: ['development', 'production'] as const,
      hasErrors: [true, false] as const,
      hasWarnings: [true, false] as const,
    };

    generateCases(matrix).forEach(runTest);

    function runTest(settings: Combination<typeof matrix>) {
      const { colorDepth, level, env, hasErrors, hasWarnings } = settings;

      let testHelpers: typeof import('../utils/helpers');
      const originalGetColorDepth = process.stderr.getColorDepth;
      beforeEach(() => {
        // getColorDepth is undefined sometimes, so we need to mock it like this
        process.stderr.getColorDepth = (
          colorDepth ? mock.fn(() => colorDepth) : colorDepth
        ) as (env?: object | undefined) => number;

        // helpers caches `getColorDepth` on initialization, so we need to a new
        // one after we mock `getColorDepth`.
        delete require.cache[require.resolve('../utils/helpers')];
        testHelpers = require('../utils/helpers');
      });

      afterEach(() => {
        process.stderr.getColorDepth = originalGetColorDepth;
      });

      it(`should log message when stats is "${level}" and env is "${env}", with errors: \`${hasErrors}\` and warnings: \`${hasWarnings}\``, () => {
        const stats = getStatsMock(level, env, hasErrors, hasWarnings);
        const { mock: error } = mock.method(console, 'error', testHelpers.noop);

        testHelpers.logStats(null, stats); // <- this is what we are testing

        assert.strictEqual(error.callCount(), 1, 'error should be called once');

        let toStringOptions: StatsOptions | undefined;
        if (level === 'normal') {
          toStringOptions = { colors: testHelpers.colors };
        } else if (hasErrors || hasWarnings) {
          toStringOptions = {
            colors: testHelpers.colors,
            preset: 'errors-warnings',
          };
        }
        if (toStringOptions) {
          assert.strictEqual(
            stats.toString.mock.callCount(),
            1,
            'stats.toString should be called once',
          );
          assert.deepStrictEqual(
            stats.toString.mock.calls[0].arguments,
            [toStringOptions],
            'stats should be called with the colors option',
          );
          assert.deepStrictEqual(
            error.calls[0].arguments,
            [stats.toString(toStringOptions)],
            'stats should be logged',
          );
        } else {
          assert.strictEqual(
            stats.toString.mock.callCount(),
            0,
            'stats.toString should not be called',
          );
          const colorFn =
            env === 'production' ? testHelpers.toOrange : testHelpers.toPurple;
          const name = colorFn(`🦊 ${stats.compilation.compiler.name}`);
          const status = testHelpers.toGreen('successfully');
          const time = stats.endTime - stats.startTime;
          const expectedMessage = `${name} (webpack ${version}) compiled ${status} in ${time} ms`;
          assert.deepStrictEqual(error.calls[0].arguments, [expectedMessage]);
        }
      });
    }
  });
});
