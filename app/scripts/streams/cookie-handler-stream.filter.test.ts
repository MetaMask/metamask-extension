import { jest } from '@jest/globals';
import {
  initializeCookieHandlerSteam,
  setupCookieHandlerExtStreams,
} from './cookie-handler-stream';

// Set env before any imports
process.env.PHISHING_WARNING_PAGE_URL = 'https://example.com/phishing';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).mockPipeline = jest.fn();
jest.mock('readable-stream', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pipeline: (...args: unknown[]) => (global as any).mockPipeline(...args),
}));

jest.mock('@metamask/object-multiplex', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function mockObjectMultiplex(this: any) {
    return {
      destroyed: false,
      writableEnded: false,
      setMaxListeners: () => {
        // empty on purpose
      },
      ignoreStream: () => {
        // empty on purpose
      },
      createStream() {
        return {} as unknown;
      },
      end() {
        this.writableEnded = true;
      },
    };
  };
});

jest.mock('@metamask/post-message-stream', () => ({
  WindowPostMessageStream: class {
    once(_event: string, _fn: () => void) {
      // empty on purpose
    }
  },
}));

jest.mock('extension-port-stream', () => ({
  ExtensionPortStream: class {
    once(_event: string, _fn: () => void) {
      // empty on purpose
    }
  },
}));

jest.mock('webextension-polyfill', () => ({
  /* eslint-disable-next-line @typescript-eslint/naming-convention */
  __esModule: true,
  default: {
    runtime: {
      connect: () => ({
        onDisconnect: {
          addListener: () => {
            // empty on purpose
          },
        },
      }),
      onMessage: {
        addListener: () => {
          // empty on purpose
        },
      },
      sendMessage: () => Promise.resolve(),
    },
  },
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).mockLogCalls = [] as unknown[];
jest.mock('./stream-utils', () => ({
  logStreamDisconnectWarning: (...args: unknown[]) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).mockLogCalls.push(args);
  },
}));

describe('cookie-handler-stream logging filter', () => {
  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).mockPipeline.mockClear();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).mockLogCalls = [];
  });

  it('page mux pipeline: logs unconditionally on both completion and error', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const callsBefore = (global as any).mockPipeline.mock.calls.length;
    initializeCookieHandlerSteam();
    // The first pipeline call after init is the page mux pipeline (setupCookieHandlerStreamsFromOrigin)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pageMuxCall = (global as any).mockPipeline.mock.calls[callsBefore];
    const cb = pageMuxCall[pageMuxCall.length - 1] as (err?: Error) => void;

    // Clean completion (no error) - still logs
    cb(undefined);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((global as any).mockLogCalls.length).toBe(1);

    // Error case - logs again
    cb(new Error('boom'));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((global as any).mockLogCalls.length).toBe(2);
  });

  it('extension mux pipeline: logs unconditionally on both completion and error', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const before = (global as any).mockPipeline.mock.calls.length;
    setupCookieHandlerExtStreams();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cb = (global as any).mockPipeline.mock.calls[before][
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).mockPipeline.mock.calls[before].length - 1
    ] as (err?: Error) => void;

    // Clean completion (no error) - still logs
    cb(undefined);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((global as any).mockLogCalls.length).toBe(1);

    // Error case - logs again
    cb(new Error('boom'));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((global as any).mockLogCalls.length).toBe(2);
  });
});
