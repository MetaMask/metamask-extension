import { describe, it, afterEach, beforeEach, mock } from 'node:test';
import assert from 'node:assert';
import {
  version,
  type Stats,
  type Compilation,
  type StatsOptions,
  type StatsCompilation,
  type Compiler,
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

  describe('suppressDevServerInfoLogs', () => {
    it('suppresses webpack-dev-server info logs', () => {
      let infrastructureLog:
        | ((name: string, type: string, args?: unknown[]) => true | void)
        | undefined;
      const compiler = {
        hooks: {
          infrastructureLog: {
            tap: mock.fn((_name, callback) => {
              infrastructureLog = callback;
            }),
          },
        },
      } as unknown as Compiler;

      helpers.suppressDevServerInfoLogs(compiler);

      assert(infrastructureLog, 'infrastructure log callback should be set');
      assert.strictEqual(
        infrastructureLog('webpack-dev-server', 'info', [
          'Project is running at:',
        ]),
        true,
      );
      assert.strictEqual(
        infrastructureLog('webpack-dev-server', 'warn', ['test warning']),
        undefined,
      );
      assert.strictEqual(
        infrastructureLog('webpack.Progress', 'status', ['10%', 'building']),
        undefined,
      );
    });
  });

  describe('writeLineAfterProgress', () => {
    it('clears the active progress status before writing the message', () => {
      const calls: string[] = [];
      const status = mock.fn(() => calls.push('status'));
      const getInfrastructureLogger = mock.fn(() => ({ status }));
      const compiler = {
        getInfrastructureLogger,
      } as unknown as Compiler;
      mock.method(console, 'error', (message) => {
        calls.push(`error:${message}`);
      });

      helpers.writeLineAfterProgress(compiler, 'test message');

      assert.deepStrictEqual(getInfrastructureLogger.mock.calls[0].arguments, [
        'webpack.Progress',
      ]);
      assert.strictEqual(status.mock.callCount(), 1);
      assert.deepStrictEqual(calls, ['status', 'error:test message']);
    });
  });

  describe('logWatchBuildStats', () => {
    it('logs stats and the watch message after each completed build', () => {
      const calls: unknown[] = [];
      let done:
        | Parameters<Compiler['hooks']['done']['tap']>[1]
        | undefined;
      const status = mock.fn(() => calls.push('status'));
      const doneTap = mock.fn((_name, callback) => {
        done = callback;
      });
      const failedTap = mock.fn();
      const compiler = {
        hooks: {
          done: {
            tap: doneTap,
          },
          failed: {
            tap: failedTap,
          },
        },
        getInfrastructureLogger: mock.fn(() => ({ status })),
      } as unknown as Compiler;
      const stats = {
        endTime: 1000,
        startTime: 0,
        hasErrors: mock.fn(() => false),
        hasWarnings: mock.fn(() => false),
        compilation: {
          options: {
            mode: 'development',
            stats: 'none',
          },
          compiler: {
            name: 'test-compiler-name',
          },
        } as Compilation,
        toString: mock.fn((_?: unknown) => 'test-stats'),
      } as unknown as Stats;
      mock.method(console, 'error', (message) => {
        calls.push(message);
      });

      helpers.logWatchBuildStats(compiler, 'test message');

      assert(done, 'done callback should be set');
      assert.deepStrictEqual(
        doneTap.mock.calls[0].arguments[0],
        'MetaMaskWatchBuildLogger',
      );
      assert.deepStrictEqual(
        failedTap.mock.calls[0].arguments[0],
        'MetaMaskWatchBuildLogger',
      );

      done(stats);
      done(stats);

      assert.strictEqual(status.mock.callCount(), 2);
      assert.match(String(calls[1]), /compiled/u);
      assert.strictEqual(calls[2], 'test message');
      assert.match(String(calls[4]), /compiled/u);
      assert.strictEqual(calls[5], 'test message');
    });

    it('logs fatal watch errors and the watch message', () => {
      const calls: unknown[] = [];
      let failed:
        | Parameters<Compiler['hooks']['failed']['tap']>[1]
        | undefined;
      const status = mock.fn(() => calls.push('status'));
      const compiler = {
        hooks: {
          done: {
            tap: mock.fn(),
          },
          failed: {
            tap: mock.fn((_name, callback) => {
              failed = callback;
            }),
          },
        },
        getInfrastructureLogger: mock.fn(() => ({ status })),
      } as unknown as Compiler;
      const error = new Error('test error');
      mock.method(console, 'error', (message) => {
        calls.push(message);
      });

      helpers.logWatchBuildStats(compiler, 'test message');

      assert(failed, 'failed callback should be set');
      failed(error);

      assert.strictEqual(status.mock.callCount(), 1);
      assert.deepStrictEqual(calls, ['status', error, 'test message']);
    });
  });

  describe('setupGracefulWatchShutdown', () => {
    it('ignores repeated shutdown signals until the compiler cache closes', async () => {
      const calls: unknown[] = [];
      const exits: number[] = [];
      const listeners = new Map<NodeJS.Signals, () => void>();
      const stop = mock.fn(() => createDeferred<void>().promise);
      const server = { stop } as unknown as Parameters<
        typeof helpers.setupGracefulWatchShutdown
      >[0]['server'];
      let closeCallback:
        | ((error?: Error | null | undefined) => void)
        | undefined;
      const close = mock.fn(
        (callback: (error?: Error | null | undefined) => void) => {
          closeCallback = callback;
        },
      );
      const status = mock.fn(() => calls.push('status'));
      const compiler = {
        close,
        getInfrastructureLogger: mock.fn(() => ({ status })),
      } as unknown as Compiler;
      const signalProcess = {
        on: mock.fn(
          (signal: NodeJS.Signals, listener: () => void) => {
            listeners.set(signal, listener);
          },
        ),
        removeListener: mock.fn(
          (signal: NodeJS.Signals, listener: () => void) => {
            if (listeners.get(signal) === listener) {
              listeners.delete(signal);
            }
          },
        ),
      };
      mock.method(console, 'error', (message) => {
        calls.push(message);
      });

      helpers.setupGracefulWatchShutdown({
        compiler,
        exit: (code = 0) => exits.push(code),
        process: signalProcess,
        server,
        signals: ['SIGINT'],
      });

      const listener = listeners.get('SIGINT');
      assert(listener, 'SIGINT listener should be set');
      listener();
      listener();

      assert.strictEqual(stop.mock.callCount(), 1);
      assert.strictEqual(close.mock.callCount(), 0);
      assert.deepStrictEqual(exits, []);
      assert.deepStrictEqual(calls, [
        'status',
        '🦊 Gracefully shutting down; waiting for webpack to finish writing its cache…',
        'status',
        '🦊 Still shutting down; waiting for webpack to finish writing its cache…',
      ]);
    });

    it('exits after the dev server stops and the compiler closes', async () => {
      const exits: number[] = [];
      const stopDeferred = createDeferred<void>();
      const listeners = new Map<NodeJS.Signals, () => void>();
      const server = {
        stop: mock.fn(() => stopDeferred.promise),
      } as unknown as Parameters<
        typeof helpers.setupGracefulWatchShutdown
      >[0]['server'];
      let closeCallback:
        | ((error?: Error | null | undefined) => void)
        | undefined;
      const close = mock.fn(
        (callback: (error?: Error | null | undefined) => void) => {
          closeCallback = callback;
        },
      );
      const compiler = {
        close,
        getInfrastructureLogger: mock.fn(() => ({ status: mock.fn() })),
      } as unknown as Compiler;
      const signalProcess = {
        on: mock.fn(
          (signal: NodeJS.Signals, listener: () => void) => {
            listeners.set(signal, listener);
          },
        ),
        removeListener: mock.fn(
          (signal: NodeJS.Signals, listener: () => void) => {
            if (listeners.get(signal) === listener) {
              listeners.delete(signal);
            }
          },
        ),
      };
      mock.method(console, 'error', helpers.noop);

      helpers.setupGracefulWatchShutdown({
        compiler,
        exit: (code = 0) => exits.push(code),
        process: signalProcess,
        server,
        signals: ['SIGINT'],
      });

      const listener = listeners.get('SIGINT');
      assert(listener, 'SIGINT listener should be set');
      listener();
      stopDeferred.resolve();
      await waitForAsyncShutdown();

      assert.strictEqual(close.mock.callCount(), 1);
      assert(closeCallback, 'compiler close callback should be set');
      closeCallback();
      await waitForAsyncShutdown();

      assert.deepStrictEqual(exits, [0]);
      assert.strictEqual(signalProcess.removeListener.mock.callCount(), 1);
      assert.strictEqual(listeners.has('SIGINT'), false);
    });

    it('still closes the compiler when the dev server fails to stop', async () => {
      const exits: number[] = [];
      const calls: unknown[] = [];
      const listeners = new Map<NodeJS.Signals, () => void>();
      const stopError = new Error('stop failed');
      const server = {
        stop: mock.fn(async () => {
          throw stopError;
        }),
      } as unknown as Parameters<
        typeof helpers.setupGracefulWatchShutdown
      >[0]['server'];
      let closeCallback:
        | ((error?: Error | null | undefined) => void)
        | undefined;
      const close = mock.fn(
        (callback: (error?: Error | null | undefined) => void) => {
          closeCallback = callback;
        },
      );
      const compiler = {
        close,
        getInfrastructureLogger: mock.fn(() => ({ status: mock.fn() })),
      } as unknown as Compiler;
      const signalProcess = {
        on: mock.fn(
          (signal: NodeJS.Signals, listener: () => void) => {
            listeners.set(signal, listener);
          },
        ),
        removeListener: mock.fn(helpers.noop),
      };
      mock.method(console, 'error', (message) => {
        calls.push(message);
      });

      helpers.setupGracefulWatchShutdown({
        compiler,
        exit: (code = 0) => exits.push(code),
        process: signalProcess,
        server,
        signals: ['SIGINT'],
      });

      const listener = listeners.get('SIGINT');
      assert(listener, 'SIGINT listener should be set');
      listener();
      await waitForAsyncShutdown();

      assert.strictEqual(close.mock.callCount(), 1);
      assert(closeCallback, 'compiler close callback should be set');
      closeCallback();
      await waitForAsyncShutdown();

      assert.strictEqual(calls.includes(stopError), true);
      assert.deepStrictEqual(exits, [1]);
    });
  });

  describe('getDevServerClientUrl', () => {
    const parse = (url: string) => {
      const [base, query] = url.split('?');
      return { base, params: new URLSearchParams(query) };
    };

    it('returns the webpack-dev-server client base path', () => {
      const { base } = parse(helpers.getDevServerClientUrl({}));
      assert.strictEqual(base, 'webpack-dev-server/client/index');
    });

    it('always sets protocol=ws (extension pages cannot auto-detect WS protocol)', () => {
      const { params } = parse(helpers.getDevServerClientUrl({}));
      assert.strictEqual(params.get('protocol'), 'ws');
    });

    it('omits hostname/port/hot/live-reload when the corresponding fields are unset', () => {
      const { params } = parse(helpers.getDevServerClientUrl({}));
      assert.strictEqual(params.has('hostname'), false);
      assert.strictEqual(params.has('port'), false);
      assert.strictEqual(params.has('hot'), false);
      assert.strictEqual(params.has('live-reload'), false);
    });

    it('maps `host` to the `hostname` param', () => {
      const { params } = parse(
        helpers.getDevServerClientUrl({ host: 'localhost' }),
      );
      assert.strictEqual(params.get('hostname'), 'localhost');
    });

    it('forwards a numeric port as a string', () => {
      const { params } = parse(helpers.getDevServerClientUrl({ port: 12345 }));
      assert.strictEqual(params.get('port'), '12345');
    });

    it("forwards `port: 'auto'` as the string 'auto'", () => {
      const { params } = parse(helpers.getDevServerClientUrl({ port: 'auto' }));
      assert.strictEqual(params.get('port'), 'auto');
    });

    it('forwards `hot` as a string', () => {
      const hotTrue = parse(helpers.getDevServerClientUrl({ hot: true }));
      assert.strictEqual(hotTrue.params.get('hot'), 'true');

      const hotFalse = parse(helpers.getDevServerClientUrl({ hot: false }));
      assert.strictEqual(hotFalse.params.get('hot'), 'false');
    });

    it('maps `liveReload` to the `live-reload` param', () => {
      const { params } = parse(
        helpers.getDevServerClientUrl({ liveReload: true }),
      );
      assert.strictEqual(params.get('live-reload'), 'true');
      assert.strictEqual(params.has('liveReload'), false);
    });

    it('combines all fields into a single query string', () => {
      const url = helpers.getDevServerClientUrl({
        host: 'localhost',
        port: 8080,
        hot: false,
        liveReload: true,
      });
      assert.strictEqual(
        url,
        'webpack-dev-server/client/index?protocol=ws&hostname=localhost&port=8080&hot=false&live-reload=true',
      );
    });
  });
});

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, reject, resolve };
}

async function waitForAsyncShutdown() {
  await new Promise<void>((resolve) => {
    setImmediate(resolve);
  });
}
