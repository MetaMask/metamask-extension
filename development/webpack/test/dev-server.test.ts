import { describe, it, afterEach, mock } from 'node:test';
import assert from 'node:assert';
import type { Stats, Compilation, Compiler } from 'webpack';
import {
  getDevServerOptions,
  injectEntryScripts,
  logWatchBuildStats,
  suppressDevServerInfoLogs,
} from '../utils/dev-server';
import { setupUiClient } from '../utils/dev-server/setup-ui-client';
import { setupBackgroundClient } from '../utils/dev-server/setup-background-client';
import {
  closeSocket,
  connectToDevServer,
} from '../utils/dev-server/connect-to-dev-server';
import {
  BACKGROUND_CLIENT_ENTRY_NAME,
  BACKGROUND_UPDATE_MESSAGE_TYPE,
  UI_UPDATE_MESSAGE_TYPE,
} from '../utils/dev-server/protocol';
import {
  createAnnouncer,
  getClientRequest,
} from '../utils/dev-server/websocket';
import { ManifestPlugin } from '../utils/plugins/ManifestPlugin';

type EntryPluginCall = {
  context: string;
  entry: string;
  options: Record<string, unknown>;
  appliedTo: Compiler;
};

type DoneCallback = Parameters<Compiler['hooks']['done']['tap']>[1];
type ReactRefreshRule = {
  test?: RegExp;
  include?: unknown;
  enforce: string;
  use: {
    loader: string;
    options: {
      clientRequest: string;
    };
  };
};

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
    options: { plugins, module: { rules: [] } },
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

function getOnlyModuleRule(compiler: Compiler): ReactRefreshRule {
  const { rules } = compiler.options.module;
  assert.strictEqual(rules.length, 1);
  const [rule] = rules;
  assert(rule && typeof rule === 'object' && !Array.isArray(rule));
  return rule as ReactRefreshRule;
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

function withFakeWebSocket(
  callback: () => void,
  webSocketImplementation: unknown = FakeWebSocket,
) {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'WebSocket');
  FakeWebSocket.sockets = [];
  Object.defineProperty(globalThis, 'WebSocket', {
    configurable: true,
    writable: true,
    value: webSocketImplementation,
  });
  try {
    callback();
  } finally {
    if (descriptor) {
      Object.defineProperty(globalThis, 'WebSocket', descriptor);
    } else {
      delete (globalThis as Record<string, unknown>).WebSocket;
    }
  }
}

describe('./utils/dev-server', () => {
  afterEach(() => mock.restoreAll());

  describe('getDevServerOptions', () => {
    it('disables built-in live reload and client injection', () => {
      const devServerOptions = getDevServerOptions({
        uiClientRule: { include: '/test/context/scripts/load/ui.ts' },
      });

      assert.strictEqual(devServerOptions.hot, false);
      assert.strictEqual(devServerOptions.liveReload, false);
      assert.strictEqual(devServerOptions.client, false);
    });

    it('registers dev-server clients from the static middleware config', () => {
      const devServerOptions = getDevServerOptions({
        uiClientRule: { include: '/test/context/scripts/load/ui.ts' },
      });
      const manifestPlugin = createManifestPlugin({
        serviceWorkerEntryName: 'service-worker',
      });
      const { compiler, entryPluginCalls } = createCompiler({
        plugins: [manifestPlugin],
      });
      const { devServer } = createDevServer();
      const { setupMiddlewares } = devServerOptions;
      assert(setupMiddlewares, 'setupMiddlewares should be set');
      const middlewares: Parameters<
        NonNullable<typeof devServerOptions.setupMiddlewares>
      >[0] = [];

      const result = setupMiddlewares(middlewares, {
        ...devServer,
        compiler,
      } as never);

      assert.strictEqual(result, middlewares);
      const uiClientRule = getOnlyModuleRule(compiler);
      assert.strictEqual(
        uiClientRule.include,
        '/test/context/scripts/load/ui.ts',
      );
      assert.match(
        uiClientRule.use.options.clientRequest,
        /ui-client\.ts\?url=ws%3A%2F%2Flocalhost%3A12345%2Fws/u,
      );
      assert.strictEqual(entryPluginCalls.length, 1);
      assert.match(
        entryPluginCalls[0].entry,
        /background-client\.ts\?url=ws%3A%2F%2Flocalhost%3A12345%2Fws/u,
      );
      assert.deepStrictEqual(entryPluginCalls[0].options, {
        name: 'service-worker',
      });
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

  describe('setupUiClient', () => {
    it('prepends the UI client to the UI entry', () => {
      const { compiler, entryPluginCalls } = createCompiler();
      const { devServer } = createDevServer({ host: 'localhost', port: 24680 });

      setupUiClient(devServer as never, [compiler], {
        rule: { include: '/test/context/scripts/load/ui.ts' },
      });

      assert.strictEqual(entryPluginCalls.length, 0);
      const rule = getOnlyModuleRule(compiler);
      assert.strictEqual(rule.test, undefined);
      assert.strictEqual(rule.include, '/test/context/scripts/load/ui.ts');
      assert.strictEqual(rule.enforce, 'pre');
      assert.match(
        rule.use.loader,
        /development[\\/]webpack[\\/]utils[\\/]loaders[\\/]reactRefreshLoader/u,
      );
      assert.match(
        rule.use.options.clientRequest,
        /development[\\/]webpack[\\/]utils[\\/]dev-server[\\/]ui-client\.ts\?url=ws%3A%2F%2Flocalhost%3A24680%2Fws/u,
      );
    });
  });

  describe('setupBackgroundClient', () => {
    it('skips compilers without the manifest plugin', () => {
      const { compiler, entryPluginCalls, getDoneCallback } = createCompiler();
      const { devServer } = createDevServer();

      setupBackgroundClient(devServer as never, [compiler]);

      assert.strictEqual(entryPluginCalls.length, 0);
      assert.throws(
        () => getDoneCallback(),
        /done callback should be registered/u,
      );
    });

    it('merges the background client into the MV3 service worker entry', () => {
      const manifestPlugin = createManifestPlugin({
        serviceWorkerEntryName: 'service-worker',
      });
      const { compiler, entryPluginCalls } = createCompiler({
        plugins: [manifestPlugin],
      });
      const { devServer } = createDevServer();

      setupBackgroundClient(devServer as never, [compiler]);

      assert.strictEqual(entryPluginCalls.length, 1);
      assert.deepStrictEqual(entryPluginCalls[0].options, {
        name: 'service-worker',
      });
      assert.match(
        entryPluginCalls[0].entry,
        /background-client\.ts\?url=ws%3A%2F%2Flocalhost%3A12345%2Fws/u,
      );
    });

    it('registers a standalone background client entry for MV2', () => {
      const manifestPlugin = createManifestPlugin();
      const { compiler, entryPluginCalls } = createCompiler({
        plugins: [manifestPlugin],
      });
      const { devServer } = createDevServer();

      setupBackgroundClient(devServer as never, [compiler]);

      assert.strictEqual(entryPluginCalls.length, 1);
      assert.deepStrictEqual(entryPluginCalls[0].options, {
        name: BACKGROUND_CLIENT_ENTRY_NAME,
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

      setupBackgroundClient(devServer as never, [compiler]);
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
          BACKGROUND_UPDATE_MESSAGE_TYPE,
          UI_UPDATE_MESSAGE_TYPE,
          BACKGROUND_UPDATE_MESSAGE_TYPE,
          UI_UPDATE_MESSAGE_TYPE,
          BACKGROUND_UPDATE_MESSAGE_TYPE,
        ],
      );
      assert.strictEqual(sentMessages[1].data, 'ui-a');
      assert.strictEqual(sentMessages[3].data, 'ui-b');
      assert.notStrictEqual(sentMessages[0].data, sentMessages[4].data);
    });

    it('does not announce update messages for failed builds', () => {
      const manifestPlugin = createManifestPlugin({
        serviceWorkerEntryName: 'service-worker',
      });
      const { compiler, getDoneCallback } = createCompiler({
        plugins: [manifestPlugin],
      });
      const { devServer, sentMessages } = createDevServer();

      setupBackgroundClient(devServer as never, [compiler]);
      getDoneCallback()(createStats({ hasErrors: true }));

      assert.deepStrictEqual(sentMessages, []);
    });
  });

  describe('getClientRequest', () => {
    it('embeds the resolved dev-server WebSocket URL into the client request query', () => {
      const { devServer } = createDevServer({
        host: '127.0.0.1',
        port: 35729,
      });

      const request = getClientRequest(
        devServer as never,
        'background-client.ts',
      );

      assert.match(
        request,
        /background-client\.ts\?url=ws%3A%2F%2F127\.0\.0\.1%3A35729%2Fws$/u,
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
    it('reconnects with backoff when WebSocket construction throws', () => {
      class ThrowingWebSocket {
        constructor() {
          throw new Error('connection failed');
        }
      }

      withFakeWebSocket(() => {
        const reconnects: (() => void)[] = [];
        const { mock: setTimeoutMock } = mock.method(
          globalThis,
          'setTimeout',
          (callback: () => void, delay?: number) => {
            reconnects.push(callback);
            return undefined as unknown as ReturnType<typeof setTimeout>;
          },
        );

        connectToDevServer({
          url: 'ws://localhost:12345/ws',
          onMessage: () => undefined,
        });
        reconnects[0]();

        assert.strictEqual(setTimeoutMock.callCount(), 2);
        assert.strictEqual(setTimeoutMock.calls[0].arguments[1], 200);
        assert.strictEqual(setTimeoutMock.calls[1].arguments[1], 400);
      }, ThrowingWebSocket);
    });

    it('dispatches parsed dev-server messages and ignores invalid messages', () => {
      withFakeWebSocket(() => {
        const { mock: consoleWarnMock } = mock.method(
          console,
          'warn',
          () => undefined,
        );
        const messages: {
          type: string;
          data: unknown;
          socket: FakeWebSocket;
        }[] = [];

        connectToDevServer({
          url: 'ws://localhost:12345/ws',
          onMessage: (type, data, socket) => {
            messages.push({
              type,
              data,
              socket: socket as unknown as FakeWebSocket,
            });
          },
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
        assert.deepStrictEqual(
          consoleWarnMock.calls.map((call) => call.arguments[0]),
          [
            '[webpack-dev-server] Ignoring malformed WebSocket message.',
            '[webpack-dev-server] Ignoring WebSocket message without a type.',
            '[webpack-dev-server] Ignoring non-string WebSocket message.',
          ],
        );
      });
    });

    it('ignores messages after the client is done', () => {
      withFakeWebSocket(() => {
        const { mock: consoleWarnMock } = mock.method(
          console,
          'warn',
          () => undefined,
        );
        const onMessage = mock.fn();
        let done = true;

        connectToDevServer({
          url: 'ws://localhost:12345/ws',
          isDone: () => done,
          onMessage,
        });

        const socket = FakeWebSocket.sockets[0];
        socket.dispatch('message', {
          data: JSON.stringify({ type: 'ignored' }),
        });
        done = false;
        socket.dispatch('message', {
          data: JSON.stringify({ type: 'accepted' }),
        });

        assert.strictEqual(onMessage.mock.callCount(), 1);
        assert.strictEqual(onMessage.mock.calls[0].arguments[0], 'accepted');
        assert.strictEqual(consoleWarnMock.callCount(), 0);
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

        connectToDevServer({
          url: 'ws://localhost:12345/ws',
          isDone: () => done,
          onMessage: () => undefined,
        });

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

    it('resets reconnect backoff after a socket opens', () => {
      withFakeWebSocket(() => {
        const reconnects: (() => void)[] = [];
        const { mock: setTimeoutMock } = mock.method(
          globalThis,
          'setTimeout',
          (callback: () => void, delay?: number) => {
            reconnects.push(callback);
            return undefined as unknown as ReturnType<typeof setTimeout>;
          },
        );

        connectToDevServer({
          url: 'ws://localhost:12345/ws',
          onMessage: () => undefined,
        });

        FakeWebSocket.sockets[0].dispatch('close');
        reconnects[0]();
        FakeWebSocket.sockets[1].dispatch('open');
        FakeWebSocket.sockets[1].dispatch('close');

        assert.strictEqual(setTimeoutMock.callCount(), 2);
        assert.strictEqual(setTimeoutMock.calls[0].arguments[1], 200);
        assert.strictEqual(setTimeoutMock.calls[1].arguments[1], 200);
      });
    });

    it('attaches listeners once per WebSocket when reconnecting', () => {
      withFakeWebSocket(() => {
        const reconnects: (() => void)[] = [];
        const messages: string[] = [];
        mock.method(globalThis, 'setTimeout', (callback: () => void) => {
          reconnects.push(callback);
          return undefined as unknown as ReturnType<typeof setTimeout>;
        });

        connectToDevServer({
          url: 'ws://localhost:12345/ws',
          onMessage: (type) => messages.push(type),
        });

        const firstSocket = FakeWebSocket.sockets[0];
        assert.strictEqual(firstSocket.listeners.get('open')?.length, 1);
        assert.strictEqual(firstSocket.listeners.get('message')?.length, 1);
        assert.strictEqual(firstSocket.listeners.get('close')?.length, 1);

        firstSocket.dispatch('close');
        reconnects[0]();

        const secondSocket = FakeWebSocket.sockets[1];
        assert.notStrictEqual(secondSocket, firstSocket);
        assert.strictEqual(secondSocket.listeners.get('open')?.length, 1);
        assert.strictEqual(secondSocket.listeners.get('message')?.length, 1);
        assert.strictEqual(secondSocket.listeners.get('close')?.length, 1);

        secondSocket.dispatch('message', {
          data: JSON.stringify({ type: 'valid' }),
        });

        assert.deepStrictEqual(messages, ['valid']);
      });
    });
  });

  describe('closeSocket', () => {
    it('waits for the socket close event before resolving', async () => {
      const socket = new FakeWebSocket('ws://localhost:12345/ws');
      const { mock: setTimeoutMock } = mock.method(
        globalThis,
        'setTimeout',
        () => 1 as unknown as ReturnType<typeof setTimeout>,
      );
      const { mock: clearTimeoutMock } = mock.method(
        globalThis,
        'clearTimeout',
        () => undefined,
      );

      let resolved = false;
      const closePromise = closeSocket(socket as unknown as WebSocket).then(
        () => {
          resolved = true;
        },
      );

      assert.strictEqual(socket.close.mock.callCount(), 1);
      assert.deepStrictEqual(socket.close.mock.calls[0].arguments, [1000]);
      assert.strictEqual(resolved, false);
      socket.dispatch('close');
      socket.dispatch('close');
      await closePromise;

      assert.strictEqual(setTimeoutMock.callCount(), 1);
      assert.strictEqual(setTimeoutMock.calls[0].arguments[1], 1000);
      assert.strictEqual(resolved, true);
      assert.strictEqual(clearTimeoutMock.callCount(), 1);
    });

    it('resolves after the fallback timeout if the socket close event does not fire', async () => {
      const socket = new FakeWebSocket('ws://localhost:12345/ws');
      let fallback: (() => void) | undefined;
      mock.method(
        globalThis,
        'setTimeout',
        (callback: Parameters<typeof setTimeout>[0]) => {
          fallback = callback as () => void;
          return 1 as unknown as ReturnType<typeof setTimeout>;
        },
      );
      mock.method(globalThis, 'clearTimeout', () => undefined);

      let resolved = false;
      const closePromise = closeSocket(socket as unknown as WebSocket).then(
        () => {
          resolved = true;
        },
      );

      assert.strictEqual(resolved, false);
      assert(fallback, 'fallback callback should be registered');
      fallback();
      socket.dispatch('close');
      await closePromise;

      assert.strictEqual(resolved, true);
    });

    it('uses custom timeout and closure code options', async () => {
      const socket = new FakeWebSocket('ws://localhost:12345/ws');
      let fallback: (() => void) | undefined;
      const { mock: setTimeoutMock } = mock.method(
        globalThis,
        'setTimeout',
        (callback: Parameters<typeof setTimeout>[0]) => {
          fallback = callback as () => void;
          return 1 as unknown as ReturnType<typeof setTimeout>;
        },
      );
      mock.method(globalThis, 'clearTimeout', () => undefined);

      const closePromise = closeSocket(socket as unknown as WebSocket, {
        timeoutMs: 250,
        closureCode: 3001,
      });

      assert.deepStrictEqual(socket.close.mock.calls[0].arguments, [3001]);
      assert.strictEqual(setTimeoutMock.calls[0].arguments[1], 250);
      assert(fallback, 'fallback callback should be registered');
      fallback();
      await closePromise;
    });

    it('resolves when closing the socket throws', async () => {
      let closeListener: (() => void) | undefined;
      const socket = {
        addEventListener: mock.fn(
          (
            type: string,
            listener: () => void,
            options?: AddEventListenerOptions,
          ) => {
            assert.strictEqual(type, 'close');
            assert.deepStrictEqual(options, { once: true });
            closeListener = listener;
          },
        ),
        close: mock.fn(() => {
          throw new Error('close failed');
        }),
      };
      const { mock: clearTimeoutMock } = mock.method(
        globalThis,
        'clearTimeout',
        () => undefined,
      );
      mock.method(
        globalThis,
        'setTimeout',
        () => 1 as unknown as ReturnType<typeof setTimeout>,
      );

      await closeSocket(socket as unknown as WebSocket);

      assert(closeListener, 'close listener should be registered before close');
      assert.strictEqual(socket.close.mock.callCount(), 1);
      assert.strictEqual(clearTimeoutMock.callCount(), 1);
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
});
