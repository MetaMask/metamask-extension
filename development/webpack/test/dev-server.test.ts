import { describe, it, afterEach, mock } from 'node:test';
import assert from 'node:assert';
import type { Stats, Compilation, Compiler } from 'webpack';
import {
  logWatchBuildStats,
  suppressDevServerInfoLogs,
} from '../utils/dev-server';
import { getDevServerClientUrl } from '../utils/dev-server/ui-reload';

describe('./utils/dev-server', () => {
  afterEach(() => mock.restoreAll());

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

      suppressDevServerInfoLogs(compiler);

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

  describe('logWatchBuildStats', () => {
    it('logs stats and the watch message after each completed build', () => {
      const calls: unknown[] = [];
      let done: Parameters<Compiler['hooks']['done']['tap']>[1] | undefined;
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
      mock.method(console, 'error', (message: unknown) => {
        calls.push(message);
      });

      logWatchBuildStats(compiler, 'test message');

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
      let failed: Parameters<Compiler['hooks']['failed']['tap']>[1] | undefined;
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
      mock.method(console, 'error', (message: unknown) => {
        calls.push(message);
      });

      logWatchBuildStats(compiler, 'test message');

      assert(failed, 'failed callback should be set');
      failed(error);

      assert.strictEqual(status.mock.callCount(), 1);
      assert.deepStrictEqual(calls, ['status', error, 'test message']);
    });
  });

  describe('getDevServerClientUrl', () => {
    const parse = (url: string) => {
      const [base, query] = url.split('?');
      return { base, params: new URLSearchParams(query) };
    };

    it('returns the webpack-dev-server client base path', () => {
      const { base } = parse(getDevServerClientUrl({}));
      assert.strictEqual(base, 'webpack-dev-server/client/index');
    });

    it('always sets protocol=ws (extension pages cannot auto-detect WS protocol)', () => {
      const { params } = parse(getDevServerClientUrl({}));
      assert.strictEqual(params.get('protocol'), 'ws');
    });

    it('omits hostname/port/hot/live-reload when the corresponding fields are unset', () => {
      const { params } = parse(getDevServerClientUrl({}));
      assert.strictEqual(params.has('hostname'), false);
      assert.strictEqual(params.has('port'), false);
      assert.strictEqual(params.has('hot'), false);
      assert.strictEqual(params.has('live-reload'), false);
    });

    it('maps `host` to the `hostname` param', () => {
      const { params } = parse(getDevServerClientUrl({ host: 'localhost' }));
      assert.strictEqual(params.get('hostname'), 'localhost');
    });

    it('forwards a numeric port as a string', () => {
      const { params } = parse(getDevServerClientUrl({ port: 12345 }));
      assert.strictEqual(params.get('port'), '12345');
    });

    it("forwards `port: 'auto'` as the string 'auto'", () => {
      const { params } = parse(getDevServerClientUrl({ port: 'auto' }));
      assert.strictEqual(params.get('port'), 'auto');
    });

    it('forwards `hot` as a string', () => {
      const hotTrue = parse(getDevServerClientUrl({ hot: true }));
      assert.strictEqual(hotTrue.params.get('hot'), 'true');

      const hotFalse = parse(getDevServerClientUrl({ hot: false }));
      assert.strictEqual(hotFalse.params.get('hot'), 'false');
    });

    it('maps `liveReload` to the `live-reload` param', () => {
      const { params } = parse(getDevServerClientUrl({ liveReload: true }));
      assert.strictEqual(params.get('live-reload'), 'true');
      assert.strictEqual(params.has('liveReload'), false);
    });

    it('combines all fields into a single query string', () => {
      const url = getDevServerClientUrl({
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
