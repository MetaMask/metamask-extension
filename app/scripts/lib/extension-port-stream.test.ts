import { DuplexOptions } from 'readable-stream';
import type { Runtime } from 'webextension-polyfill';
import type {
  PortStream,
  TransportChunkFrame,
  Options,
} from './extension-port-stream';

// the Jest type for it is wrong
const it = globalThis.it as unknown as jest.It;

// Helper to create a mock port
const createMockPort = () => {
  const listeners: {
    message: ((msg: unknown, port: Runtime.Port) => void)[];
    disconnect: ((port: Runtime.Port) => void)[];
  } = {
    message: [],
    disconnect: [],
  };
  const mockPortInstance: jest.Mocked<Runtime.Port> = {
    name: 'mockPort',
    postMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn((cb) => listeners.message.push(cb)),
      removeListener: jest.fn((cb) => {
        listeners.message = listeners.message.filter((l) => l !== cb);
      }),
      hasListener: jest.fn((cb) => listeners.message.includes(cb)),
      hasListeners: jest.fn(() => listeners.message.length > 0),
    },
    onDisconnect: {
      addListener: jest.fn((cb) => listeners.disconnect.push(cb)),
      removeListener: jest.fn((cb) => {
        listeners.disconnect = listeners.disconnect.filter((l) => l !== cb);
      }),
      hasListener: jest.fn((cb) => listeners.disconnect.includes(cb)),
      hasListeners: jest.fn(() => listeners.disconnect.length > 0),
    },
  } as unknown as jest.Mocked<Runtime.Port>;

  const simulateMessage = (msg: unknown) => {
    listeners.message.forEach((cb) => cb(msg, mockPortInstance));
  };

  const simulateDisconnect = () => {
    listeners.disconnect.forEach((cb) => cb(mockPortInstance));
  };

  return {
    mockPort: mockPortInstance,
    simulateMessage,
    simulateDisconnect,
  };
};

const originalGlobalJsonStringify = JSON.stringify; // Define at a higher scope

describe('extension-port-stream', () => {
  let consoleDebugSpy: jest.SpyInstance;
  let mockPort: jest.Mocked<Runtime.Port>;
  let simulatePortMessage: (msg: unknown) => void;
  let simulatePortDisconnect: () => void;
  let PortStream: typeof import('./extension-port-stream.ts').PortStream;
  let toFrames: typeof import('./extension-port-stream.ts').toFrames;
  let CHUNK_SIZE: typeof import('./extension-port-stream.ts').CHUNK_SIZE;

  beforeEach(async () => {
    // extension-port-stream uses a singleton for id tracking, and we have tests
    // but our tests need a static and predictable `id`. So we need to import a
    // fresh instance of the module before each test.
    // eslint-disable-next-line import/extensions
    ({ PortStream, toFrames, CHUNK_SIZE } = await import(
      // eslint-disable-next-line import/extensions
      './extension-port-stream.ts'
    ));
  });

  beforeEach(() => {
    const {
      mockPort: port,
      simulateMessage,
      simulateDisconnect: disconnect,
    } = createMockPort();
    mockPort = port;
    simulatePortMessage = simulateMessage;
    simulatePortDisconnect = disconnect;

    consoleDebugSpy = jest
      .spyOn(console, 'debug')
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleDebugSpy.mockRestore();
    jest.clearAllMocks();
    // resets the ./extension-port-stream.ts import
    jest.resetModules();
  });

  describe('toFrames', () => {
    let mockJsonStringify: jest.SpyInstance;

    beforeEach(() => {
      mockJsonStringify = jest.spyOn(JSON, 'stringify');
    });

    afterEach(() => {
      mockJsonStringify.mockRestore();
    });

    it('should yield the original payload if it fits in a single frame', () => {
      const payload = { message: 'hello' };
      mockJsonStringify.mockImplementation((obj) =>
        originalGlobalJsonStringify(obj),
      );

      const generator = toFrames(payload);
      const result = generator.next();

      expect(result.value).toEqual(payload);
      expect(result.done).toBe(false);
      expect(generator.next().done).toBe(true);
    });

    it('should yield chunk frames for a payload larger than CHUNK_SIZE', () => {
      const dummyPayload = { data: 'will be mocked' };
      const desiredLength = CHUNK_SIZE * 2 + Math.floor(CHUNK_SIZE / 2); // Needs 3 chunks
      const largeJsonString = 'A'.repeat(desiredLength);

      mockJsonStringify.mockImplementation((obj) => {
        if (obj === dummyPayload) {
          return largeJsonString;
        }
        return jest.requireActual('JSON').stringify(obj);
      });

      const generator = toFrames(dummyPayload);
      const frames = Array.from(generator);

      expect(mockJsonStringify).toHaveBeenCalledWith(dummyPayload);
      expect(frames.length).toBe(3);

      const expectedId = 1;
      const expectedTotal = 3;

      expect(frames[0]).toBe(
        `${expectedId}|${expectedTotal}|0|${largeJsonString.substring(
          0,
          CHUNK_SIZE,
        )}`,
      );
      expect(frames[1]).toBe(
        `${expectedId}|${expectedTotal}|1|${largeJsonString.substring(
          CHUNK_SIZE,
          CHUNK_SIZE * 2,
        )}`,
      );
      expect(frames[2]).toBe(
        `${expectedId}|${expectedTotal}|2|${largeJsonString.substring(
          CHUNK_SIZE * 2,
        )}`,
      );
    });
  });

  describe('PortStream', () => {
    let stream: PortStream;
    const mockLog = jest.fn();

    const createStream = (options?: Options) => {
      return new PortStream(mockPort, options);
    };

    beforeEach(() => {
      mockLog.mockReset();
    });

    it('should initialize correctly and set up listeners', () => {
      stream = createStream();
      expect(mockPort.onMessage.addListener).toHaveBeenCalledTimes(1);
      expect(mockPort.onDisconnect.addListener).toHaveBeenCalledTimes(1);
      expect(consoleDebugSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('debug mode ON'),
      );
    });

    it('should initialize with debug mode', () => {
      stream = createStream({ debug: true });
      expect(consoleDebugSpy).toHaveBeenCalledWith(
        '%cPortStream',
        'color:#888;',
        '🛠  debug mode ON',
      );
    });

    it('should use custom logger if provided', () => {
      stream = createStream({ log: mockLog });
      const testData = { test: 'data' };
      simulatePortMessage(testData);
      expect(mockLog).toHaveBeenCalledWith(testData, false);
    });

    it('should pass DuplexOptions to super constructor', () => {
      const duplexOpts: DuplexOptions = { highWaterMark: 100 };
      stream = new PortStream(mockPort, duplexOpts);
      expect(stream.readableHighWaterMark).toBe(100);
      expect(stream.writableHighWaterMark).toBe(100);
    });

    describe('onMessage (receiving data)', () => {
      it('should handle non-chunked messages and push them', (done) => {
        stream = createStream({ log: mockLog });
        const message = { data: 'simple message' };

        stream.on('data', (data) => {
          expect(data).toEqual(message);
          expect(mockLog).toHaveBeenCalledWith(message, false);
          expect(consoleDebugSpy).not.toHaveBeenCalledWith(
            expect.stringContaining('← raw'),
          );
          done();
        });
        simulatePortMessage(message);
      });

      it('should handle chunked message that contains the delimiter in data part', (done) => {
        stream = createStream({ log: mockLog });
        const message = '|chunked message containing the `|` delimiter!';
        const json = originalGlobalJsonStringify(message);
        const chunk = `1|1|0|${json}`;

        stream.on('data', (data) => {
          expect(data).toEqual(message);
          expect(mockLog).toHaveBeenCalledWith(message, false);
          expect(consoleDebugSpy).not.toHaveBeenCalledWith(
            expect.stringContaining('← raw'),
          );
          done();
        });
        simulatePortMessage(chunk);
      });

      it('should log raw message in debug mode when receiving non-chunked message', (done) => {
        stream = createStream({ debug: true });
        const message = { data: 'simple debug message' };
        stream.on('data', (data) => {
          expect(data).toEqual(message);
          expect(consoleDebugSpy).toHaveBeenCalledWith(
            '%cPortStream',
            'color:#0b8;',
            '← raw',
            message,
          );
          done();
        });
        simulatePortMessage(message);
      });

      it('should handle and reassemble chunked messages', (done) => {
        stream = createStream({ log: mockLog, debug: true });
        const originalPayload = { data: 'chunked data string' };
        const jsonOriginalPayload =
          originalGlobalJsonStringify(originalPayload);
        const id = 1001;
        const part1 = jsonOriginalPayload.substring(0, 10);
        const part2 = jsonOriginalPayload.substring(10);
        const chunk1Seq = 0;
        const chunk2Seq = 1;
        const chunk1: TransportChunkFrame = `${id}|2|${chunk1Seq}|${part1}`;
        const chunk2: TransportChunkFrame = `${id}|2|${chunk2Seq}|${part2}`;

        stream.on('data', (data) => {
          expect(data).toEqual(originalPayload);
          expect(mockLog).toHaveBeenCalledWith(originalPayload, false);
          expect(consoleDebugSpy).toHaveBeenCalledWith(
            '%cPortStream',
            'color:#888;',
            '🛠  debug mode ON',
          );
          expect(consoleDebugSpy).toHaveBeenCalledWith(
            '%cPortStream',
            'color:#0b8;',
            '← raw',
            chunk1,
          );
          // Corrected expectation for frame log message
          expect(consoleDebugSpy).toHaveBeenCalledWith(
            '%cPortStream',
            'color:#0b8;',
            `← frame #${chunk1Seq + 1}/2 id=${id} (${part1.length} bytes)`,
          );
          expect(consoleDebugSpy).toHaveBeenCalledWith(
            '%cPortStream',
            'color:#0b8;',
            '← raw',
            chunk2,
          );
          expect(consoleDebugSpy).toHaveBeenCalledWith(
            '%cPortStream',
            'color:#0b8;',
            `← frame #${chunk2Seq + 1}/2 id=${id} (${part2.length} bytes)`,
          );
          expect(consoleDebugSpy).toHaveBeenCalledWith(
            '%cPortStream',
            'color:#0b8;',
            `✔ re-assembled id=${id} (${jsonOriginalPayload.length} bytes)`,
          );
          done();
        });

        simulatePortMessage(chunk1);
        simulatePortMessage(chunk2);
      });

      it('should handle chunked messages for an existing queue entry', (done) => {
        stream = createStream({ log: mockLog });
        const payload = { a: '1', b: '2', c: '3' };
        const jsonPayload = JSON.stringify(payload);
        const id = 1002;
        const chunk1: TransportChunkFrame = `${id}|3|0|${jsonPayload.slice(0, 5)}`;
        const chunk2: TransportChunkFrame = `${id}|3|1|${jsonPayload.slice(5, 10)}`;
        const chunk3: TransportChunkFrame = `${id}|3|2|${jsonPayload.slice(10)}`;

        stream.on('data', (data) => {
          expect(data).toEqual(payload);
          done();
        });

        simulatePortMessage(chunk1); // Creates queue[id]
        simulatePortMessage(chunk2); // Adds to queue[id].parts
        simulatePortMessage(chunk3); // Completes and pushes
      });

      describe('Invalid chunks frames', () => {
        const invalidFrames = [
          '0x1|chunk|frame', // hex instead of integer
          ' 1234|2|0|valid data', // Leading space
          '1234|2|1', // Missing `data`
          '123trickedYa|2|1|data', // id starts with a number, then has letters
          'id|total|0|data', // id is not an integer
          '1234|total|0|data', // total is not an integer
          '0|1|seq|data', // seq is not an integer
          '-1234|2|0|data', // negative numbers don't count
        ];
        it.each(invalidFrames)(
          'should ignore invalid chunk frames',
          (invalidChunk, done) => {
            stream = createStream({ log: mockLog });
            stream.on('data', (data) => {
              expect(data).toEqual(invalidChunk);
              expect(mockLog).toHaveBeenCalledWith(invalidChunk, false);
              done();
            });
            simulatePortMessage(invalidChunk);
          },
        );
      });
    });

    describe('onDisconnect', () => {
      it('should destroy the stream and clear the queue', (done) => {
        stream = createStream({ debug: true });
        const chunk: TransportChunkFrame = `4001|2|0|data`;
        simulatePortMessage(chunk); // Add to queue

        stream.on('error', (err: Error) => {
          expect(err.message).toBe('Port disconnected');
          expect(consoleDebugSpy).toHaveBeenCalledWith(
            '%cPortStream',
            'color:#888;',
            '✖ port disconnected',
          );
          done();
        });
        simulatePortDisconnect();
      });

      it('should destroy the stream and clear the queue (no debug)', (done) => {
        stream = createStream({ debug: false }); // Ensure debug is false
        const chunk: TransportChunkFrame = `4002|2|0|data`;
        simulatePortMessage(chunk);

        stream.on('error', (err: Error) => {
          expect(err.message).toBe('Port disconnected');
          expect(consoleDebugSpy).not.toHaveBeenCalledWith(
            expect.stringContaining('✖ port disconnected'), // Ensure no debug message
          );
          done();
        });
        simulatePortDisconnect();
      });
    });

    describe('_read', () => {
      it('should be a no-op', () => {
        stream = createStream();
        expect(() => stream._read()).not.toThrow(); // Removed argument
      });
    });

    describe('_write', () => {
      it('should write non-chunked data directly if small enough (using toFrames)', (done) => {
        stream = createStream({ log: mockLog });
        const data = { message: 'write this' };
        // JSON.stringify(data) is small, toFrames yields data itself

        stream._write(data, 'utf-8', (err?: Error | null) => {
          expect(err).toBeFalsy();
          expect(mockPort.postMessage).toHaveBeenCalledTimes(1);
          expect(mockPort.postMessage).toHaveBeenCalledWith(data);
          expect(mockLog).toHaveBeenCalledWith(data, true);
          done();
        });
      });

      it('should write pre-chunked data directly', (done) => {
        stream = createStream({ log: mockLog, debug: true });
        const frame: TransportChunkFrame = '2001|1|0|mydata';

        stream._write(frame, 'utf-8', (err?: Error | null) => {
          expect(err).toBeFalsy();
          expect(mockPort.postMessage).toHaveBeenCalledTimes(1);
          expect(mockPort.postMessage).toHaveBeenCalledWith(frame);
          expect(mockLog).toHaveBeenCalledWith(frame, true);
          expect(consoleDebugSpy).toHaveBeenCalledWith(
            '%cPortStream',
            'color:#08f;',
            '→',
            frame,
          );
          done();
        });
      });

      it('should chunk and write large data using toFrames', (done) => {
        stream = createStream({ log: mockLog, debug: true });

        // This payload will be stringified by the mocked JSON.stringify
        const largePayload = { data: 'This is a large payload' };
        const jsonPayload = 'B'.repeat(CHUNK_SIZE + 100); // Force 2 chunks

        const stringifySpy = jest
          .spyOn(JSON, 'stringify')
          .mockImplementation((obj) => {
            if (obj === largePayload) {
              return jsonPayload;
            }
            return originalGlobalJsonStringify(obj);
          });

        const expectedFrames: TransportChunkFrame[] = [
          `1|2|0|${jsonPayload.substring(0, CHUNK_SIZE)}`,
          `1|2|1|${jsonPayload.substring(CHUNK_SIZE)}`,
        ];

        stream._write(largePayload, 'utf-8', (err?: Error | null) => {
          expect(err).toBeFalsy();
          expect(mockPort.postMessage).toHaveBeenCalledTimes(2);
          expect(mockPort.postMessage).toHaveBeenNthCalledWith(
            1,
            expectedFrames[0],
          );
          expect(mockPort.postMessage).toHaveBeenNthCalledWith(
            2,
            expectedFrames[1],
          );
          expect(mockLog).toHaveBeenCalledWith(largePayload, true);
          expect(consoleDebugSpy).toHaveBeenCalledWith(
            '%cPortStream',
            'color:#08f;',
            '→',
            expectedFrames[0],
          );
          expect(consoleDebugSpy).toHaveBeenCalledWith(
            '%cPortStream',
            'color:#08f;',
            '→',
            expectedFrames[1],
          );
          stringifySpy.mockRestore();
          done();
        });
      });

      it('should increment the chunk ID for each new chunk', async () => {
        // This payload will be stringified by the mocked JSON.stringify
        const largePayload = { data: 'This is a large payload' };
        const jsonPayload = JSON.stringify(largePayload);
        const chunkSize = jsonPayload.length / 2; // Force 2 chunks
        stream = createStream({ chunkSize, log: mockLog, debug: true });

        const expectedFrames: TransportChunkFrame[] = [
          `1|2|0|${jsonPayload.substring(0, chunkSize)}`,
          `1|2|1|${jsonPayload.substring(chunkSize)}`,
          `2|2|0|${jsonPayload.substring(0, chunkSize)}`,
          `2|2|1|${jsonPayload.substring(chunkSize)}`,
        ];

        await new Promise<void>((resolve) => {
          stream._write(largePayload, 'utf-8', (err?: Error | null) => {
            expect(err).toBeFalsy();
            resolve();
          });
        });
        await new Promise<void>((resolve) => {
          stream._write(largePayload, 'utf-8', (err?: Error | null) => {
            expect(err).toBeFalsy();
            resolve();
          });
        });
        expect(mockPort.postMessage).toHaveBeenCalledTimes(4);
        expectedFrames.forEach((frame, index) => {
          expect(mockPort.postMessage).toHaveBeenNthCalledWith(
            index + 1,
            frame,
          );
        });
      });

      it('should not chunk large payload with chunkSize is 0', (done) => {
        stream = createStream({ chunkSize: 0, log: mockLog, debug: true });

        const data = { data: 'B'.repeat(CHUNK_SIZE + 100) }; // large!

        stream._write(data, 'utf-8', (err?: Error | null) => {
          expect(err).toBeFalsy();
          expect(mockPort.postMessage).toHaveBeenCalledTimes(1);
          // data has been untouched!
          expect(mockPort.postMessage).toHaveBeenCalledWith(data);
          expect(mockLog).toHaveBeenCalledWith(data, true);
          done();
        });
      });

      it('should call callback with error for non-UTF-8 encoding', (done) => {
        stream = createStream();
        const data = { message: 'test' };
        stream._write(data, 'ascii' as BufferEncoding, (err?: Error | null) => {
          expect(err).toBeInstanceOf(Error);
          expect(err?.message).toBe('PortStream only supports UTF-8 encoding');
          expect(mockPort.postMessage).not.toHaveBeenCalled();
          done();
        });
      });

      it('should handle errors during port.postMessage and call callback', (done) => {
        stream = createStream({ debug: true });
        const data = { message: 'will fail post' };
        const postError = new Error('Failed to post');
        mockPort.postMessage.mockImplementation(() => {
          throw postError;
        });

        stream._write(data, 'utf-8', (err?: Error | null) => {
          expect(err).toBeInstanceOf(AggregateError);
          expect(err?.message).toBe('PortStream write failed');
          // Log is called after successful loop in _write
          expect(mockLog).not.toHaveBeenCalled();
          expect(consoleDebugSpy).toHaveBeenCalledWith(
            '%cPortStream',
            'color:#888;',
            '⚠ write error',
            postError,
          );
          done();
        });
      });

      it('should handle errors from toFrames (e.g. JSON.stringify fails)', (done) => {
        stream = createStream({ debug: true });
        const data = { message: 'will fail stringify' };
        const stringifyError = new Error('Stringify failed');
        const mockJsonS = jest
          .spyOn(JSON, 'stringify')
          .mockImplementation(() => {
            throw stringifyError;
          });

        stream._write(data, 'utf-8', (err?: Error | null) => {
          expect(err).toBeInstanceOf(Error);
          expect(err?.message).toBe('PortStream write failed');
          expect(mockPort.postMessage).not.toHaveBeenCalled();
          expect(consoleDebugSpy).toHaveBeenCalledWith(
            '%cPortStream',
            'color:#888;',
            '⚠ write error',
            stringifyError,
          );
          mockJsonS.mockRestore();
          done();
        });
      });

      it('should handle errors from toFrames (no debug)', (done) => {
        stream = createStream({ debug: false }); // Ensure debug is false
        const data = { message: 'will fail stringify no debug' };
        const stringifyError = new Error('Stringify failed no debug');
        const mockJsonS = jest
          .spyOn(JSON, 'stringify')
          .mockImplementation(() => {
            throw stringifyError;
          });

        stream._write(data, 'utf-8', (err?: Error | null) => {
          expect(err).toBeInstanceOf(Error);
          expect(err?.message).toBe('PortStream write failed');
          expect(mockPort.postMessage).not.toHaveBeenCalled();
          expect(consoleDebugSpy).not.toHaveBeenCalledWith(
            // Ensure no debug message
            expect.stringContaining('⚠ write error'),
          );
          mockJsonS.mockRestore();
          done();
        });
      });
    });
  });
});
