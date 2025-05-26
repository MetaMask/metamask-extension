import { DuplexOptions } from 'readable-stream';
import type { Runtime } from 'webextension-polyfill';
import createRandomId from '../../../shared/modules/random-id';
import {
  PortStream,
  toFrames,
  isChunkFrame,
  CHUNK_SIZE,
  type ChunkFrame,
  type Options,
} from './extension-port-stream';

jest.mock('../../../shared/modules/random-id', () => ({
  __esModule: true,
  default: jest.fn(),
}));

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
  let mockCreateRandomId: jest.Mock;
  let consoleDebugSpy: jest.SpyInstance;
  let mockPort: jest.Mocked<Runtime.Port>;
  let simulatePortMessage: (msg: unknown) => void;
  let simulatePortDisconnect: () => void;

  beforeEach(() => {
    const {
      mockPort: port,
      simulateMessage,
      simulateDisconnect: disconnect,
    } = createMockPort();
    mockPort = port;
    simulatePortMessage = simulateMessage;
    simulatePortDisconnect = disconnect;

    mockCreateRandomId = createRandomId as jest.Mock;
    mockCreateRandomId.mockReset();

    consoleDebugSpy = jest
      .spyOn(console, 'debug')
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleDebugSpy.mockRestore();
    jest.clearAllMocks();
  });

  describe('isChunkFrame', () => {
    it('should return true for any string', () => {
      expect(isChunkFrame('id|total|seq|data')).toBe(true);
      expect(isChunkFrame('any string will do')).toBe(true);
    });

    it('should return false for non-string types', () => {
      expect(isChunkFrame(123)).toBe(false);
      expect(isChunkFrame({})).toBe(false);
      expect(isChunkFrame([])).toBe(false);
      expect(isChunkFrame(null)).toBe(false);
      expect(isChunkFrame(undefined)).toBe(false);
      expect(isChunkFrame(true)).toBe(false);
    });
  });

  describe('toFrames', () => {
    let mockJsonStringify: jest.SpyInstance;

    beforeEach(() => {
      mockCreateRandomId.mockImplementation(() => 0);
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
      expect(mockCreateRandomId).not.toHaveBeenCalled();
    });

    it('should yield chunk frames for a payload larger than CHUNK_SIZE', () => {
      mockCreateRandomId.mockReturnValue(12345);
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
      expect(mockCreateRandomId).toHaveBeenCalledTimes(1);

      const expectedId = 12345;
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
        const chunk1: ChunkFrame = `${id}|2|${chunk1Seq}|${part1}`;
        const chunk2: ChunkFrame = `${id}|2|${chunk2Seq}|${part2}`;

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
        const chunk1: ChunkFrame = `${id}|3|0|${jsonPayload.slice(0, 5)}`;
        const chunk2: ChunkFrame = `${id}|3|1|${jsonPayload.slice(5, 10)}`;
        const chunk3: ChunkFrame = `${id}|3|2|${jsonPayload.slice(10)}`;

        stream.on('data', (data) => {
          expect(data).toEqual(payload);
          done();
        });

        simulatePortMessage(chunk1); // Creates queue[id]
        simulatePortMessage(chunk2); // Adds to queue[id].parts
        simulatePortMessage(chunk3); // Completes and pushes
      });
    });

    describe('onDisconnect', () => {
      it('should destroy the stream and clear the queue', (done) => {
        stream = createStream({ debug: true });
        const chunk: ChunkFrame = `4001|2|0|data`;
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
        const chunk: ChunkFrame = `4002|2|0|data`;
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
      beforeEach(() => {
        mockCreateRandomId.mockReset();
      });

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
        const frame: ChunkFrame = '2001|1|0|mydata';

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
        mockCreateRandomId.mockReturnValue(3001);

        // This payload will be stringified by the mocked JSON.stringify
        const largePayload = { data: 'This is a large payload' };
        const jsonPayload = 'B'.repeat(CHUNK_SIZE + 100); // Force 2 chunks

        const stringifySpy = jest
          .spyOn(JSON, 'stringify')
          .mockImplementation((obj) => {
            if (obj === largePayload) {
              return jsonPayload;
            }
            return jest.requireActual('JSON').stringify(obj);
          });

        const expectedFrames: ChunkFrame[] = [
          `3001|2|0|${jsonPayload.substring(0, CHUNK_SIZE)}`,
          `3001|2|1|${jsonPayload.substring(CHUNK_SIZE)}`,
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
          expect(err).toBeInstanceOf(Error);
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

    describe('setLogger', () => {
      it('should update the logger function', (done) => {
        stream = createStream(); // Default logger
        const newLogger = jest.fn();
        stream.setLogger(newLogger);

        const testData = { logThis: 'please' };
        stream._write(testData, 'utf-8', () => {
          expect(newLogger).toHaveBeenCalledWith(testData, true);
          done();
        });
      });
    });
  });
});
