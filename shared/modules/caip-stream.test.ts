import { Duplex, PassThrough } from 'readable-stream';
import { createDeferredPromise } from '@metamask/utils';
import { createCaipStream } from './caip-stream';

const writeToStream = async (stream: Duplex, message: unknown) => {
  const { promise: isWritten, resolve: writeCallback } =
    createDeferredPromise();

  stream.write(message, () => writeCallback());
  await isWritten;
};

const readFromStream = (stream: Duplex): unknown[] => {
  const chunks: unknown[] = [];
  stream.on('data', (chunk: unknown) => {
    chunks.push(chunk);
  });

  return chunks;
};

class MockStream extends Duplex {
  chunks: unknown[] = [];

  constructor() {
    super({ objectMode: true });
  }

  _read() {
    return undefined;
  }

  _write(
    value: unknown,
    _encoding: BufferEncoding,
    callback: (error?: Error | null) => void,
  ) {
    this.chunks.push(value);
    callback();
  }
}

const createMockPort = () => {
  // Minimal chrome.runtime.Port‐like stub
  const listeners: (() => void)[] = [];
  return {
    onDisconnect: {
      addListener: (fn: () => void) => listeners.push(fn),
      // helper used by tests
      _trigger: () => listeners.forEach((fn) => fn()),
    },
  };
};

describe('CAIP Stream', () => {
  describe('createCaipStream', () => {
    it('pipes and unwraps a caip-348 message from source stream to the substream', async () => {
      const sourceStream = new PassThrough({ objectMode: true });
      const sourceStreamChunks = readFromStream(sourceStream);

      const providerStream = createCaipStream(sourceStream);
      const providerStreamChunks = readFromStream(providerStream);

      await writeToStream(sourceStream, {
        type: 'caip-348',
        data: { foo: 'bar' },
      });

      expect(sourceStreamChunks).toStrictEqual([
        { type: 'caip-348', data: { foo: 'bar' } },
      ]);
      expect(providerStreamChunks).toStrictEqual([{ foo: 'bar' }]);
    });

    it('pipes and wraps a message from the substream to the source stream', async () => {
      // using a fake stream here instead of PassThrough to prevent a loop
      // when sourceStream gets written back to at the end of the CAIP pipeline
      const sourceStream = new MockStream();

      const providerStream = createCaipStream(sourceStream);

      await writeToStream(providerStream, {
        foo: 'bar',
      });

      // Note that it's not possible to verify the output side of the internal SplitStream
      // instantiated inside createCaipStream as only the substream is actually exported
      expect(sourceStream.chunks).toStrictEqual([
        { type: 'caip-348', data: { foo: 'bar' } },
      ]);
    });

    it('ends the substream when the source stream ends', async () => {
      // using a fake stream here instead of PassThrough to prevent a loop
      // when sourceStream gets written back to at the end of the CAIP pipeline
      const sourceStream = new MockStream();

      const providerStream = createCaipStream(sourceStream);

      const { promise, resolve } = createDeferredPromise();
      providerStream.on('close', () => resolve?.());

      sourceStream.destroy();

      await expect(promise).resolves.toBe(undefined);
    });

    it('does not emit an error on “Premature close” after graceful shutdown', async () => {
      const sourceStream = new MockStream();
      const mockPort = createMockPort();
      (sourceStream as unknown as { _port: typeof mockPort })._port = mockPort;

      const providerStream = createCaipStream(sourceStream);

      const errorSpy = jest.fn();
      providerStream.on('error', errorSpy);

      // Trigger disconnect
      (
        mockPort as unknown as { onDisconnect: { _trigger: () => void } }
      ).onDisconnect._trigger();

      // Give the event loop a tick to propagate potential errors
      await new Promise((r) => setImmediate(r));

      expect(errorSpy).not.toHaveBeenCalled();
    });
  });
});
