import { describe, it, afterEach, mock } from 'node:test';
import assert from 'node:assert';
import type { Stats, Compilation, Compiler } from 'webpack';
import {
  DEV_SERVER_OPTIONS,
  injectEntryScripts,
  logWatchBuildStats,
  suppressDevServerInfoLogs,
} from '../utils/dev-server';
import {
  getDevServerClientEntry,
  setupUiReload,
} from '../utils/dev-server/ui-reload';
import { setupBackgroundReload } from '../utils/dev-server/background-reload';
import { connectToDevServer } from '../utils/dev-server/connect-to-dev-server';
import {
  BACKGROUND_RELOAD_CLIENT_ENTRY_NAME,
  BACKGROUND_RELOAD_MESSAGE_TYPE,
  UI_RELOAD_CLIENT_ENTRY_NAME,
  UI_RELOAD_MESSAGE_TYPE,
} from '../utils/dev-server/reload-protocol';
import {
  createAnnouncer,
  getClientEntry,
} from '../utils/dev-server/websocket';
import { ManifestPlugin } from '../utils/plugins/ManifestPlugin';

type EntryPluginCall = {
  context: string;
  entry: string;
  options: Record<string, unknown>;
  appliedTo: Compiler;
};

type DoneCallback = Parameters<Compiler['hooks']['done']['tap']>[1];

function createCompiler({
  plugins = [],
}: {
  plugins?: unknown[];
} = {}): {
  compiler: Compiler;
  entryPluginCalls: EntryPluginCall[];
  getDoneCallback: () => DoneCallback;
} {
  const entryPluginCalls: EntryPluginCall[] = [];
  let doneCallback: DoneCallback | undefined;

  class FakeEntryPlugin {
    readonly context: string;

    readonly entry: string;

    readonly options: Record<string, unknown>;

    constructor(
      context: string,
      entry: string,
      options: Record<string, unknown>,
    ) {
      this.context = context;
      this.entry = entry;
      this.options = options;
    }

    apply(compiler: Compiler) {
      entryPluginCalls.push({
        context: this.context,
        entry: this.entry,
        options: this.options,
        appliedTo: compiler,
      });
    }
  }

  const compiler = {
    context: '/test/context',
    options: { plugins },
    hooks: {
      done: {
        tap: mock.fn((_name, callback) => {
          doneCallback = callback;
        }),
      },
    },
    webpack: {
      EntryPlugin: FakeEntryPlugin,
    },
  } as unknown as Compiler;

  return {
    compiler,
    entryPluginCalls,
    getDoneCallback: () => {
      assert(doneCallback, 'done callback should be registered');
      return doneCallback;
    },
  };
}

function createManifestPlugin({
  addedScripts = [],
  serviceWorkerEntryName,
}: {
  addedScripts?: string[];
  serviceWorkerEntryName?: string;
} = {}): ManifestPlugin<boolean> {
  const manifestPlugin = Object.create(
    ManifestPlugin.prototype,
  ) as ManifestPlugin<boolean>;
  manifestPlugin.addedScripts = new Set(addedScripts);
  manifestPlugin.manifests = new Map([
    [
      'chrome',
      serviceWorkerEntryName
        ? {
            manifest_version: 3,
            background: { service_worker: serviceWorkerEntryName },
          }
        : { manifest_version: 2 },
    ],
  ]) as ManifestPlugin<boolean>['manifests'];
  return manifestPlugin;
}

function createDevServer({
  host = 'localhost',
  port = 12345,
}: {
  host?: string;
  port?: number;
} = {}) {
  const connectionListeners: ((socket: unknown) => void)[] = [];
  const clients = ['client-a', 'client-b'];
  const sentMessages: {
    clients: unknown;
    type: string;
    data: string;
  }[] = [];

  return {
    devServer: {
      options: { host, port, hot: false, liveReload: false },
      webSocketServer: {
        clients,
        implementation: {
          on: mock.fn((event: string, listener: (socket: unknown) => void) => {
            assert.strictEqual(event, 'connection');
            connectionListeners.push(listener);
          }),
        },
      },
      sendMessage: mock.fn((messageClients, type: string, data: string) => {
        sentMessages.push({ clients: messageClients, type, data });
      }),
    },
    clients,
    sentMessages,
    connect: (socket: unknown) =>
      connectionListeners.forEach((listener) => listener(socket)),
  };
}

function createCompilation({
  privilegedModuleHashes,
  uiHash,
}: {
  privilegedModuleHashes: string[];
  uiHash: string;
}): Compilation {
  const modules = privilegedModuleHashes.map((hash) => ({ hash }));
  const privilegedChunk = { name: 'privileged-chunk' };
  const uiChunk = { name: 'ui-chunk' };
  const ignoredModule = { hash: 'ignored-ui-module' };

  return {
    hash: uiHash,
    entrypoints: new Map([
      [
        'background',
        {
          chunks: [privilegedChunk],
          getEntrypointChunk: () => ({ runtime: 'background-runtime' }),
        },
      ],
      [
        'ui',
        {
          chunks: [uiChunk],
          getEntrypointChunk: () => ({ runtime: 'ui-runtime' }),
        },
      ],
    ]),
    chunkGraph: {
      getChunkEntryModulesIterable: (chunk: unknown) =>
        chunk === privilegedChunk ? modules.slice(0, 1) : [ignoredModule],
      getModuleHash: (module: { hash: string }) => module.hash,
    },
    moduleGraph: {
      getOutgoingConnections: (module: { hash: string }) => {
        if (module === modules[0]) {
          return modules.slice(1).map((nextModule) => ({
            module: nextModule,
          }));
        }
        return [];
      },
    },
  } as unknown as Compilation;
}

function createStats({
  hasErrors = false,
  privilegedModuleHashes = ['background-a'],
  uiHash = 'ui-hash',
}: {
  hasErrors?: boolean;
  privilegedModuleHashes?: string[];
  uiHash?: string;
} = {}): Stats {
  return {
    hasErrors: mock.fn(() => hasErrors),
    compilation: createCompilation({ privilegedModuleHashes, uiHash }),
  } as unknown as Stats;
}

class FakeWebSocket {
  static sockets: FakeWebSocket[] = [];

  readonly listeners = new Map<string, ((event: unknown) => void)[]>();

  readonly close = mock.fn(() => undefined);

  readonly url: string;

  constructor(url: string) {
    this.url = url;
    FakeWebSocket.sockets.push(this);
  }

  addEventListener(type: string, listener: (event: unknown) => void) {
    const listeners = this.listeners.get(type) ?? [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }

  dispatch(type: string, event: unknown = {}) {
    this.listeners.get(type)?.forEach((listener) => listener(event));
  }
}

function withFakeWebSocket(callback: () => void) {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'WebSocket');
  FakeWebSocket.sockets = [];
  Object.defineProperty(globalThis, 'WebSocket', {
    configurable: true,
    writable: true,
    value: FakeWebSocket,
  });
  try {
    callback();
  } finally {
    if (descriptor) {
      Object.defineProperty(globalThis, 'WebSocket', descriptor);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete (globalThis as Record<string, unknown>).WebSocket;
    }
  }
}

describe('./utils/dev-server', () => {
  afterEach(() => mock.restoreAll());

  describe('DEV_SERVER_OPTIONS', () => {
    it('disables built-in live reload and client injection', () => {
      assert.strictEqual(DEV_SERVER_OPTIONS.hot, false);
      assert.strictEqual(DEV_SERVER_OPTIONS.liveReload, false);
      assert.strictEqual(DEV_SERVER_OPTIONS.client, false);
    });
  });

  describe('injectEntryScripts', () => {
    it('injects only JavaScript files from the entrypoint before the closing head tag', () => {
      const content = '<html><head></head><body></body></html>';
      const compilation = {
        entrypoints: new Map([
          [
            'test-entry',
            {
              getFiles: () => [
                'runtime.js',
                'test-entry.js',
                'test-entry.css',
                'test-entry.js.map',
              ],
            },
          ],
        ]),
      } as unknown as Compilation;

      const result = injectEntryScripts(content, compilation, 'test-entry');

      assert.strictEqual(
        result,
        '<html><head><script src="runtime.js" defer></script><script src="test-entry.js" defer></script></head><body></body></html>',
      );
    });

    it('throws when the requested entrypoint is missing', () => {
      const compilation = {
        entrypoints: new Map(),
      } as unknown as Compilation;

      assert.throws(
        () => injectEntryScripts('<head></head>', compilation, 'missing-entry'),
        /Entry "missing-entry" is missing/u,
      );
    });
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

  describe('setupUiReload', () => {
    it('registers the webpack-dev-server client and UI reload client in the same entrypoint', () => {
      const { compiler, entryPluginCalls } = createCompiler();
      const { devServer } = createDevServer({ host: 'localhost', port: 24680 });

      setupUiReload(devServer as never, [compiler]);

      assert.strictEqual(entryPluginCalls.length, 2);
      assert.deepStrictEqual(entryPluginCalls[0].options, {
        name: UI_RELOAD_CLIENT_ENTRY_NAME,
        chunkLoading: false,
      });
      assert.strictEqual(
        entryPluginCalls[0].entry,
        'webpack-dev-server/client/index?protocol=ws&hostname=localhost&port=24680&hot=false&live-reload=false',
      );
      assert.deepStrictEqual(entryPluginCalls[1].options, {
        name: UI_RELOAD_CLIENT_ENTRY_NAME,
      });
      assert.match(
        entryPluginCalls[1].entry,
        /development\/webpack\/utils\/dev-server\/ui-reload-client\.ts\?url=ws%3A%2F%2Flocalhost%3A24680%2Fws/u,
      );
    });
  });

  describe('setupBackgroundReload', () => {
    it('merges the background reload client into the MV3 service worker entry', () => {
      const manifestPlugin = createManifestPlugin({
        serviceWorkerEntryName: 'service-worker',
      });
      const { compiler, entryPluginCalls } = createCompiler({
        plugins: [manifestPlugin],
      });
      const { devServer } = createDevServer();

      setupBackgroundReload(devServer as never, [compiler]);

      assert.strictEqual(entryPluginCalls.length, 1);
      assert.deepStrictEqual(entryPluginCalls[0].options, {
        name: 'service-worker',
      });
      assert.match(
        entryPluginCalls[0].entry,
        /background-reload-client\.ts\?url=ws%3A%2F%2Flocalhost%3A12345%2Fws/u,
      );
    });

    it('registers a standalone background reload client entry for MV2', () => {
      const manifestPlugin = createManifestPlugin();
      const { compiler, entryPluginCalls } = createCompiler({
        plugins: [manifestPlugin],
      });
      const { devServer } = createDevServer();

      setupBackgroundReload(devServer as never, [compiler]);

      assert.strictEqual(entryPluginCalls.length, 1);
      assert.deepStrictEqual(entryPluginCalls[0].options, {
        name: BACKGROUND_RELOAD_CLIENT_ENTRY_NAME,
        chunkLoading: false,
      });
    });

    it('announces UI hashes only when the privileged-code fingerprint is unchanged', () => {
      const manifestPlugin = createManifestPlugin({
        addedScripts: ['content-script'],
        serviceWorkerEntryName: 'service-worker',
      });
      const { compiler, getDoneCallback } = createCompiler({
        plugins: [manifestPlugin],
      });
      const { devServer, sentMessages } = createDevServer();

      setupBackgroundReload(devServer as never, [compiler]);
      const done = getDoneCallback();

      done(
        createStats({
          privilegedModuleHashes: ['background-a', 'background-b'],
          uiHash: 'ui-a',
        }),
      );
      done(
        createStats({
          privilegedModuleHashes: ['background-b', 'background-a'],
          uiHash: 'ui-b',
        }),
      );
      done(
        createStats({
          privilegedModuleHashes: ['background-c'],
          uiHash: 'ui-c',
        }),
      );

      assert.deepStrictEqual(
        sentMessages.map(({ type }) => type),
        [
          BACKGROUND_RELOAD_MESSAGE_TYPE,
          UI_RELOAD_MESSAGE_TYPE,
          BACKGROUND_RELOAD_MESSAGE_TYPE,
          UI_RELOAD_MESSAGE_TYPE,
          BACKGROUND_RELOAD_MESSAGE_TYPE,
        ],
      );
      assert.strictEqual(sentMessages[1].data, 'ui-a');
      assert.strictEqual(sentMessages[3].data, 'ui-b');
      assert.notStrictEqual(sentMessages[0].data, sentMessages[4].data);
    });

    it('does not announce reload messages for failed builds', () => {
      const manifestPlugin = createManifestPlugin({
        serviceWorkerEntryName: 'service-worker',
      });
      const { compiler, getDoneCallback } = createCompiler({
        plugins: [manifestPlugin],
      });
      const { devServer, sentMessages } = createDevServer();

      setupBackgroundReload(devServer as never, [compiler]);
      getDoneCallback()(createStats({ hasErrors: true }));

      assert.deepStrictEqual(sentMessages, []);
    });
  });

  describe('getClientEntry', () => {
    it('embeds the resolved dev-server WebSocket URL into the client entry query', () => {
      const { devServer } = createDevServer({
        host: '127.0.0.1',
        port: 35729,
      });

      const entry = getClientEntry(
        devServer as never,
        'background-reload-client.ts',
      );

      assert.match(
        entry,
        /background-reload-client\.ts\?url=ws%3A%2F%2F127\.0\.0\.1%3A35729%2Fws$/u,
      );
    });
  });

  describe('createAnnouncer', () => {
    it('broadcasts sorted combined state and sends the latest state to reconnecting clients', () => {
      const { compiler: compilerA } = createCompiler();
      const { compiler: compilerB } = createCompiler();
      const { devServer, clients, sentMessages, connect } = createDevServer();

      const announce = createAnnouncer(devServer as never, 'test-message');

      announce(compilerA, 'z-value');
      announce(compilerB, 'a-value');
      connect('reconnected-client');

      assert.deepStrictEqual(sentMessages, [
        {
          clients,
          type: 'test-message',
          data: 'z-value',
        },
        {
          clients,
          type: 'test-message',
          data: 'a-value|z-value',
        },
        {
          clients: ['reconnected-client'],
          type: 'test-message',
          data: 'a-value|z-value',
        },
      ]);
      assert.strictEqual(
        devServer.webSocketServer.implementation.on.mock.callCount(),
        1,
      );
    });

    it('waits until the WebSocket server exists before installing listeners or sending messages', () => {
      const { compiler } = createCompiler();
      const sendMessage = mock.fn();
      const devServer = {
        webSocketServer: undefined,
        sendMessage,
      };

      const announce = createAnnouncer(devServer as never, 'test-message');

      announce(compiler, 'value');

      assert.strictEqual(sendMessage.mock.callCount(), 0);
    });
  });

  describe('connectToDevServer', () => {
    it('dispatches parsed dev-server messages and ignores invalid messages', () => {
      withFakeWebSocket(() => {
        const messages: { type: string; data: unknown; socket: FakeWebSocket }[] =
          [];

        connectToDevServer('ws://localhost:12345/ws', () => false, (
          type,
          data,
          socket,
        ) => {
          messages.push({ type, data, socket: socket as unknown as FakeWebSocket });
        });

        const socket = FakeWebSocket.sockets[0];
        socket.dispatch('message', {
          data: JSON.stringify({ type: 'valid', data: { ok: true } }),
        });
        socket.dispatch('message', { data: '{not json' });
        socket.dispatch('message', {
          data: JSON.stringify({ data: 'missing type' }),
        });
        socket.dispatch('message', { data: new ArrayBuffer(0) });

        assert.deepStrictEqual(messages, [
          {
            type: 'valid',
            data: { ok: true },
            socket,
          },
        ]);
      });
    });

    it('reconnects with backoff until the client is done', () => {
      withFakeWebSocket(() => {
        const reconnects: (() => void)[] = [];
        let done = false;
        const { mock: setTimeoutMock } = mock.method(
          globalThis,
          'setTimeout',
          (callback: () => void, delay?: number) => {
            reconnects.push(callback);
            return undefined as unknown as ReturnType<typeof setTimeout>;
          },
        );

        connectToDevServer(
          'ws://localhost:12345/ws',
          () => done,
          () => undefined,
        );

        FakeWebSocket.sockets[0].dispatch('close');
        assert.strictEqual(setTimeoutMock.callCount(), 1);
        assert.strictEqual(setTimeoutMock.calls[0].arguments[1], 200);

        reconnects[0]();
        assert.strictEqual(FakeWebSocket.sockets.length, 2);

        done = true;
        FakeWebSocket.sockets[1].dispatch('close');
        assert.strictEqual(setTimeoutMock.callCount(), 1);
      });
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

  describe('getDevServerClientEntry', () => {
    const parse = (url: string) => {
      const [base, query] = url.split('?');
      return { base, params: new URLSearchParams(query) };
    };

    it('returns the webpack-dev-server client base path', () => {
      const { base } = parse(getDevServerClientEntry({}));
      assert.strictEqual(base, 'webpack-dev-server/client/index');
    });

    it('always sets protocol=ws (extension pages cannot auto-detect WS protocol)', () => {
      const { params } = parse(getDevServerClientEntry({}));
      assert.strictEqual(params.get('protocol'), 'ws');
    });

    it('omits hostname/port/hot/live-reload when the corresponding fields are unset', () => {
      const { params } = parse(getDevServerClientEntry({}));
      assert.strictEqual(params.has('hostname'), false);
      assert.strictEqual(params.has('port'), false);
      assert.strictEqual(params.has('hot'), false);
      assert.strictEqual(params.has('live-reload'), false);
    });

    it('maps `host` to the `hostname` param', () => {
      const { params } = parse(getDevServerClientEntry({ host: 'localhost' }));
      assert.strictEqual(params.get('hostname'), 'localhost');
    });

    it('forwards a numeric port as a string', () => {
      const { params } = parse(getDevServerClientEntry({ port: 12345 }));
      assert.strictEqual(params.get('port'), '12345');
    });

    it("forwards `port: 'auto'` as the string 'auto'", () => {
      const { params } = parse(getDevServerClientEntry({ port: 'auto' }));
      assert.strictEqual(params.get('port'), 'auto');
    });

    it('forwards `hot` as a string', () => {
      const hotTrue = parse(getDevServerClientEntry({ hot: true }));
      assert.strictEqual(hotTrue.params.get('hot'), 'true');

      const hotFalse = parse(getDevServerClientEntry({ hot: false }));
      assert.strictEqual(hotFalse.params.get('hot'), 'false');
    });

    it('maps `liveReload` to the `live-reload` param', () => {
      const { params } = parse(getDevServerClientEntry({ liveReload: true }));
      assert.strictEqual(params.get('live-reload'), 'true');
      assert.strictEqual(params.has('liveReload'), false);
    });

    it('combines all fields into a single query string', () => {
      const url = getDevServerClientEntry({
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
