import { jest } from '@jest/globals';
import { initStreams, setupExtensionStreams } from './provider-stream';

// Set env before any imports or mocks
process.env.PHISHING_WARNING_PAGE_URL = 'https://example.com/phishing';

// Capture pipeline callbacks via global to satisfy Jest module factory rules
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).mockPipeline = jest.fn();

jest.mock('readable-stream', () => {
  const { Transform: RealTransform } = jest.requireActual(
    'readable-stream',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) as any;
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pipeline: (...args: unknown[]) => (global as any).mockPipeline(...args),
    Transform: RealTransform,
  };
});

// Mock phishing-stream to avoid URL parsing issue at module load
jest.mock('./phishing-stream', () => ({
  connectPhishingChannelToWarningSystem: () => {
    // empty on purpose
  },
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

    on(_event: string, _fn: (data: unknown) => void) {
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

describe('provider-stream logging filter', () => {
  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).mockPipeline.mockClear();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).mockLogCalls = [];
  });

  it('initStreams (page mux): logs unconditionally on both completion and error', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const callsBefore = (global as any).mockPipeline.mock.calls.length;
    initStreams();
    // The page mux pipeline is the first pipeline call in initStreams
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

  it('setupExtensionStreams: logs unconditionally on both completion and error', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const before = (global as any).mockPipeline.mock.calls.length;
    setupExtensionStreams();
    // The extension mux pipeline is the first new call after invoking setupExtensionStreams
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const firstNewCall = (global as any).mockPipeline.mock.calls[before];
    const cb = firstNewCall[firstNewCall.length - 1] as (err?: Error) => void;

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
