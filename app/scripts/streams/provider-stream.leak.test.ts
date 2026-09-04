import { jest } from '@jest/globals';
import ObjectMultiplex from '@metamask/object-multiplex';
import { Substream } from '@metamask/object-multiplex/dist/Substream';
import {
  APP_INIT_LIVENESS_STREAM,
  BACKGROUND_LIVENESS_STREAM,
  METAMASK_CAIP_MULTICHAIN_PROVIDER,
} from '../constants/stream';
import {
  initStreams,
  setupExtensionStreams,
  onDisconnectDestroyStreams,
} from './provider-stream';

// Set env before any imports or mocks
process.env.PHISHING_WARNING_PAGE_URL = 'https://example.com/phishing';

type MessageListener = (msg: unknown, port: unknown) => void;

type FakePort = {
  name: string;
  onMessage: {
    addListener: (fn: MessageListener) => void;
    removeListener: (fn: MessageListener) => void;
  };
  onDisconnect: {
    addListener: (fn: () => void) => void;
    removeListener: (fn: () => void) => void;
  };
  postMessage: (msg: unknown) => void;
  disconnect: () => void;
  messageListeners: MessageListener[];
};

// Capture every port created by `browser.runtime.connect` so tests can inject
// incoming messages. Exposed via global to satisfy Jest module factory rules.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).mockPorts = [] as FakePort[];
// Capture every ExtensionPortStream instance so tests can check its listeners.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).mockPortStreams = [];

jest.mock('extension-port-stream', () => {
  const actual = jest.requireActual(
    'extension-port-stream',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) as any;
  return {
    ...actual,
    ExtensionPortStream: class extends actual.ExtensionPortStream {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      constructor(...args: any[]) {
        super(...args);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (global as any).mockPortStreams.push(this);
      }
    },
  };
});

// Mock phishing-stream to avoid URL parsing issue at module load
jest.mock('./phishing-stream', () => ({
  connectPhishingChannelToWarningSystem: () => {
    // empty on purpose
  },
}));

// Replace the window transport with a plain object-mode passthrough so the
// real `readable-stream` pipelines can run against it.
jest.mock('@metamask/post-message-stream', () => {
  const { PassThrough } = jest.requireActual(
    'readable-stream',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) as any;
  return {
    WindowPostMessageStream: class extends PassThrough {
      constructor() {
        super({ objectMode: true });
      }
    },
  };
});

jest.mock('webextension-polyfill', () => ({
  /* eslint-disable-next-line @typescript-eslint/naming-convention */
  __esModule: true,
  default: {
    runtime: {
      connect: ({ name }: { name: string }) => {
        const messageListeners: MessageListener[] = [];
        const disconnectListeners: (() => void)[] = [];
        const port = {
          name,
          messageListeners,
          onMessage: {
            addListener: (fn: MessageListener) => messageListeners.push(fn),
            removeListener: (fn: MessageListener) => {
              const index = messageListeners.indexOf(fn);
              if (index !== -1) {
                messageListeners.splice(index, 1);
              }
            },
          },
          onDisconnect: {
            addListener: (fn: () => void) => disconnectListeners.push(fn),
            removeListener: (fn: () => void) => {
              const index = disconnectListeners.indexOf(fn);
              if (index !== -1) {
                disconnectListeners.splice(index, 1);
              }
            },
          },
          postMessage: () => {
            // empty on purpose
          },
          disconnect: () => {
            // empty on purpose
          },
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (global as any).mockPorts.push(port);
        return port;
      },
      onMessage: {
        addListener: () => {
          // empty on purpose
        },
      },
    },
  },
}));

const flushStreams = async () => {
  for (let i = 0; i < 5; i++) {
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
};

const latestPort = (): FakePort => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ports = (global as any).mockPorts as FakePort[];
  return ports[ports.length - 1];
};

describe('provider-stream reconnect cleanup', () => {
  // These tests share module state on purpose: `initStreams` builds the
  // page-side streams once (as in a real content script) and the reconnect
  // test then cycles only the extension side.
  let caipChannel: Substream;

  it('does not accumulate listeners on the page CAIP channel across service worker reconnects (issue #43090)', () => {
    const createStreamSpy = jest.spyOn(
      ObjectMultiplex.prototype as ObjectMultiplex,
      'createStream',
    );

    initStreams();

    // The first substream created for the CAIP channel belongs to the
    // page-side mux; the extension-side one is created later.
    const caipCallIndex = createStreamSpy.mock.calls.findIndex(
      ([name]) => name === METAMASK_CAIP_MULTICHAIN_PROVIDER,
    );
    expect(caipCallIndex).toBeGreaterThanOrEqual(0);
    caipChannel = createStreamSpy.mock.results[caipCallIndex]
      .value as Substream;

    const baseline = {
      close: caipChannel.listenerCount('close'),
      end: caipChannel.listenerCount('end'),
    };
    // Sanity check: the initial pipeline wiring adds some listeners.
    expect(baseline.close).toBeGreaterThan(0);

    // Simulate repeated service worker idles/restarts. Before the fix, every
    // cycle leaked the previous pipeline's listeners onto the persistent
    // page-side CAIP channel, eventually exceeding the default max of 10 and
    // triggering MaxListenersExceededWarning in the console.
    for (let i = 0; i < 5; i++) {
      onDisconnectDestroyStreams(undefined);
      setupExtensionStreams();
    }

    expect(caipChannel.listenerCount('close')).toBe(baseline.close);
    expect(caipChannel.listenerCount('end')).toBe(baseline.end);
    expect(caipChannel.listenerCount('close')).toBeLessThanOrEqual(
      caipChannel.getMaxListeners(),
    );
  });

  it('ignores liveness streams sent over the port without logging orphaned data (issue #43090)', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {
      // empty on purpose
    });

    const port = latestPort();
    const emitPortMessage = (msg: unknown) =>
      port.messageListeners.slice().forEach((fn) => fn(msg, port));

    // Positive control: data for a stream the mux does not know about must
    // still warn, proving messages actually flow into the mux in this test.
    emitPortMessage({
      name: 'unknown-test-stream',
      data: { method: 'TEST' },
    });
    await flushStreams();
    expect(
      warnSpy.mock.calls.some(([message]) =>
        String(message).includes(
          'orphaned data for stream "unknown-test-stream"',
        ),
      ),
    ).toBe(true);

    // The liveness pings that the service worker and background send on every
    // port connection must be ignored instead of logged as orphaned data.
    emitPortMessage({
      name: APP_INIT_LIVENESS_STREAM,
      data: { method: 'APP_INIT_ALIVE' },
    });
    emitPortMessage({
      name: BACKGROUND_LIVENESS_STREAM,
      data: { method: 'ALIVE' },
    });
    await flushStreams();

    expect(
      warnSpy.mock.calls.some(
        ([message]) =>
          String(message).includes(APP_INIT_LIVENESS_STREAM) ||
          String(message).includes(BACKGROUND_LIVENESS_STREAM),
      ),
    ).toBe(false);
  });

  it('accommodates all pipeline listeners on the shared extension port stream', () => {
    // The first ExtensionPortStream (from initStreams) is shared by the main
    // and legacy mux pipelines, which together attach more close/end
    // listeners than the EventEmitter default of 10. Its limit must be
    // raised, or every setup logs MaxListenersExceededWarning.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [firstPortStream] = (global as any).mockPortStreams;
    expect(firstPortStream.listenerCount('close')).toBeGreaterThan(10);
    expect(firstPortStream.listenerCount('close')).toBeLessThanOrEqual(
      firstPortStream.getMaxListeners(),
    );
    expect(firstPortStream.listenerCount('end')).toBeLessThanOrEqual(
      firstPortStream.getMaxListeners(),
    );
  });
});
